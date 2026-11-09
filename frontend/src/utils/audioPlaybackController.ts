/**
 * Centralized Audio Playback Controller for Vaayil AI
 *
 * Ensures:
 * 1. Strict single-audio-source guarantee: only ONE voice plays at any moment.
 * 2. Complete suppression of duplicate speech synthesis engines.
 * 3. Atomic pre-emptive stopping of any previously active audio or browser speech utterances.
 * 4. Request ID / Playback ID fencing: stale async TTS responses are discarded.
 * 5. Lifecycle cleanup on unmount, view switch, or modal dismissal.
 * 6. Protection against rapid repeated button clicks.
 */

export interface PlaybackOptions {
  onStart?: () => void;
  onEnded?: () => void;
  onError?: (err: Error) => void;
  langCode?: 'ta-IN' | 'en-IN';
  voice?: string;
}

class AudioPlaybackController {
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private activePlaybackId: number = 0;
  private isSynthesizing: boolean = false;
  private listeners: Set<(isPlaying: boolean, isLoading: boolean) => void> = new Set();

  constructor() {
    // Ensure clean state in browser environment
    if (typeof window !== 'undefined') {
      // Pre-emptively silence any rogue browser speech synthesis
      this.cancelBrowserSpeech();
    }
  }

  /**
   * Subscribe to playback status updates (for UI reactive state).
   */
  public subscribe(listener: (isPlaying: boolean, isLoading: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isPlaying: boolean, isLoading: boolean) {
    this.listeners.forEach((fn) => {
      try {
        fn(isPlaying, isLoading);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  /**
   * Aggressively cancel any pending or active browser SpeechSynthesis utterances.
   */
  public cancelBrowserSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Stops any currently playing audio immediately and invalidates pending requests.
   */
  public stop(): void {
    // Increment playback ID to invalidate any in-flight async TTS network requests
    this.activePlaybackId++;
    this.isSynthesizing = false;

    // Aggressively cancel browser speech synthesis
    this.cancelBrowserSpeech();

    // Stop and clean up current HTMLAudioElement
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch {
        // Ignore abort errors
      }
      this.currentAudio = null;
    }

    // Revoke previous blob URL to prevent memory leaks
    if (this.currentBlobUrl) {
      try {
        URL.revokeObjectURL(this.currentBlobUrl);
      } catch {
        // Ignore
      }
      this.currentBlobUrl = null;
    }

    this.notify(false, false);
  }

  /**
   * Plays a single voice confirmation using an audio blob fetcher.
   * Only one audio can be active; previous audio is halted immediately.
   *
   * @param fetchBlob Async function that fetches the audio Blob from Gnani Timbre
   * @param options Callbacks for onStart, onEnded, onError
   */
  public async playConfirmation(
    fetchBlob: () => Promise<Blob>,
    options?: PlaybackOptions
  ): Promise<boolean> {
    // 1. Immediately halt any prior audio playback and browser speech
    this.stop();

    // 2. Assign unique playback request ID for fencing
    const thisPlaybackId = this.activePlaybackId;
    this.isSynthesizing = true;
    this.notify(false, true);

    try {
      // 3. Fetch single audio blob from Gnani Timbre backend
      const audioBlob = await fetchBlob();

      // Guard: if another request was triggered or user navigated away/stopped, discard
      if (thisPlaybackId !== this.activePlaybackId) {
        return false;
      }

      // Guard against empty audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Received empty audio stream from TTS provider');
      }

      // 4. Create object URL for audio
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentBlobUrl = audioUrl;

      // 5. Create fresh, dedicated HTMLAudioElement
      const audio = new Audio();
      this.currentAudio = audio;
      audio.preload = 'auto';

      return new Promise<boolean>((resolve) => {
        audio.onplay = () => {
          if (thisPlaybackId === this.activePlaybackId) {
            this.isSynthesizing = false;
            this.notify(true, false);
            options?.onStart?.();
          }
        };

        audio.onended = () => {
          if (thisPlaybackId === this.activePlaybackId) {
            this.stop();
            options?.onEnded?.();
            resolve(true);
          }
        };

        audio.onerror = (e) => {
          console.warn('[AudioController] Audio playback error:', e);
          if (thisPlaybackId === this.activePlaybackId) {
            this.stop();
            options?.onError?.(new Error('Audio playback failed'));
            resolve(false);
          }
        };

        // Extra safety check before playing
        if (thisPlaybackId !== this.activePlaybackId) {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
          return;
        }

        audio.src = audioUrl;
        audio.play().catch((playErr) => {
          console.warn('[AudioController] audio.play() prevented:', playErr);
          if (thisPlaybackId === this.activePlaybackId) {
            this.stop();
            // Note: Per user requirement, DO NOT fallback to browser speech synthesis.
            // Display text and provide manual replay button instead.
            options?.onError?.(playErr instanceof Error ? playErr : new Error('Playback blocked'));
            resolve(false);
          }
        });
      });
    } catch (err: any) {
      console.warn('[AudioController] TTS synthesis failed:', err);
      if (thisPlaybackId === this.activePlaybackId) {
        this.stop();
        options?.onError?.(err instanceof Error ? err : new Error('TTS synthesis failed'));
      }
      return false;
    }
  }

  /**
   * Check if audio is currently playing or actively loading
   */
  public get isBusy(): boolean {
    return this.isSynthesizing || (this.currentAudio !== null && !this.currentAudio.paused);
  }
}

// Global Singleton Instance
export const audioController = new AudioPlaybackController();

