"""
audio_degradation.py — Vaayil AI Phase 9 Noise Lab

Standard audio DSP routines for creating controlled synthetic degradations:
1. Additive white/environmental Gaussian noise scaled to target SNR in dB.
2. Narrowband PSTN/telephony simulation:
   - 4th-order Butterworth bandpass filter (300 Hz to 3400 Hz, ITU-T G.712)
   - Telephony sample rate downsampling to 8000 Hz (G.711 / GSM FR)
   - Soft saturation non-linear compression (tanh) simulating carbon/electret microphone compression
   - Low-level telephony line hiss (30 dB SNR)

All functions use standard standard Python wave, numpy, and scipy.signal.
Every operation is fully deterministic when a random seed is provided.
"""

import io
import wave
from typing import Tuple, Dict, Any, List
import numpy as np
from scipy import signal


# Predefined SNR levels in decibels (dB)
SNR_PRESETS = {
    "light": {
        "snr_db": 20.0,
        "label": "Light Noise (20 dB SNR)",
        "description": "Faint room hum, ceiling fan, or quiet air conditioning.",
        "dsp_steps": [
            "Calculated RMS signal power: P_s = mean(s^2)",
            "Calculated target noise power: P_n = P_s / (10^(20/10))",
            "Synthesized uncorrelated Gaussian noise with variance P_n",
            "Summed signal and noise with peak-clipping guard [-1.0, 1.0]",
        ],
    },
    "medium": {
        "snr_db": 10.0,
        "label": "Medium Noise (10 dB SNR)",
        "description": "Busy office, rural tea stall, or moderate background chatter.",
        "dsp_steps": [
            "Calculated RMS signal power: P_s = mean(s^2)",
            "Calculated target noise power: P_n = P_s / (10^(10/10))",
            "Synthesized uncorrelated Gaussian noise with variance P_n",
            "Summed signal and noise with peak-clipping guard [-1.0, 1.0]",
        ],
    },
    "heavy": {
        "snr_db": 3.0,
        "label": "Heavy Noise (3 dB SNR)",
        "description": "Loud bus stand, roadside traffic, or crowded public market.",
        "dsp_steps": [
            "Calculated RMS signal power: P_s = mean(s^2)",
            "Calculated target noise power: P_n = P_s / (10^(3/10))",
            "Synthesized heavy uncorrelated Gaussian noise with variance P_n",
            "Summed signal and noise with peak-clipping guard [-1.0, 1.0]",
        ],
    },
}

PHONE_SIM_METADATA = {
    "label": "Phone Call Telephony Simulation",
    "description": "Narrowband 300–3400 Hz passband, 8 kHz telephony rate, and non-linear dynamic range compression.",
    "dsp_steps": [
        "Applied 4th-order Butterworth bandpass filter (300 Hz – 3400 Hz, ITU-T G.712 telephony standard)",
        "Decimated / downsampled to 8000 Hz (simulating standard PSTN / GSM speech codec bandwidth)",
        "Applied non-linear tanh soft-saturation compression: y = tanh(1.4 * x) / 1.4 (analog handset saturation)",
        "Injected low-level line hum / channel thermal hiss at 30 dB SNR",
        "Resampled back to 16000 Hz for standard speech API ingestion",
    ],
}


def load_wav_to_numpy(wav_bytes_or_path: bytes | str) -> Tuple[np.ndarray, int]:
    """
    Reads a WAV file into a normalized 1D float32 numpy array in range [-1.0, 1.0].
    If stereo or multi-channel, averages channels down to mono.
    Returns: (audio_array, sample_rate)
    """
    if isinstance(wav_bytes_or_path, bytes):
        wf = wave.open(io.BytesIO(wav_bytes_or_path), "rb")
    else:
        wf = wave.open(wav_bytes_or_path, "rb")

    try:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)
    finally:
        wf.close()

    if sampwidth == 2:  # 16-bit PCM
        audio_int = np.frombuffer(raw_bytes, dtype=np.int16)
        audio_float = audio_int.astype(np.float32) / 32768.0
    elif sampwidth == 1:  # 8-bit unsigned PCM
        audio_int = np.frombuffer(raw_bytes, dtype=np.uint8)
        audio_float = (audio_int.astype(np.float32) - 128.0) / 128.0
    elif sampwidth == 4:  # 32-bit int PCM
        audio_int = np.frombuffer(raw_bytes, dtype=np.int32)
        audio_float = audio_int.astype(np.float32) / 2147483648.0
    else:
        # Fallback for 24-bit PCM or unknown
        audio_int = np.frombuffer(raw_bytes, dtype=np.int16)
        audio_float = audio_int.astype(np.float32) / 32768.0

    # If stereo or multichannel, average channels down to mono
    if n_channels > 1:
        audio_float = audio_float.reshape(-1, n_channels).mean(axis=1)

    return audio_float, framerate


def numpy_to_wav_bytes(audio_float: np.ndarray, sample_rate: int) -> bytes:
    """
    Encodes a 1D float32 numpy array into standard 16-bit PCM WAV bytes.
    Clips values safely to [-1.0, 1.0] before quantization to prevent integer overflow.
    """
    clipped = np.clip(audio_float, -1.0, 1.0)
    int16_pcm = (clipped * 32767.0).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16 bits = 2 bytes
        wf.setframerate(sample_rate)
        wf.writeframes(int16_pcm.tobytes())

    return buf.getvalue()


def add_gaussian_noise(
    audio: np.ndarray,
    snr_db: float,
    seed: int | None = 42
) -> np.ndarray:
    """
    Mixes additive white Gaussian noise (AWGN) to achieve exact target SNR in dB:
    SNR_db = 10 * log10(P_signal / P_noise)
    P_noise = P_signal / 10^(SNR_db / 10)
    """
    if len(audio) == 0:
        return audio

    signal_power = float(np.mean(audio ** 2))
    if signal_power < 1e-9:
        # Signal is nearly silent; avoid division by zero
        return audio.copy()

    # Calculate desired noise power
    target_noise_power = signal_power / (10.0 ** (snr_db / 10.0))

    rng = np.random.default_rng(seed)
    raw_noise = rng.normal(0.0, 1.0, len(audio)).astype(np.float32)
    raw_noise_power = float(np.mean(raw_noise ** 2))

    # Scale noise to exact target power
    scaled_noise = raw_noise * np.sqrt(target_noise_power / (raw_noise_power + 1e-12))

    noisy_audio = audio + scaled_noise
    return np.clip(noisy_audio, -1.0, 1.0)


def simulate_phone_call(
    audio: np.ndarray,
    sample_rate: int,
    seed: int | None = 42
) -> Tuple[np.ndarray, int]:
    """
    Simulates a landline / mobile phone call channel:
    1. Bandpass filter: 300 Hz – 3400 Hz (Butterworth 4th-order).
    2. Resampling down to 8000 Hz (PSTN standard).
    3. Soft saturation non-linear compression (tanh).
    4. Channel line hum / hiss (30 dB SNR).
    5. Resampling back to 16000 Hz for API compatibility.
    """
    if len(audio) < 100:
        return audio, sample_rate

    nyquist = 0.5 * sample_rate
    lowcut = max(50.0, min(300.0, nyquist * 0.1))
    highcut = min(3400.0, nyquist * 0.9)

    # 1. 4th-order Butterworth bandpass filter
    sos = signal.butter(4, [lowcut, highcut], btype="bandpass", fs=sample_rate, output="sos")
    filtered = signal.sosfilt(sos, audio).astype(np.float32)

    # 2. Resample to 8000 Hz telephony rate (if sample_rate != 8000)
    telephony_rate = 8000
    if sample_rate != telephony_rate:
        num_target_samples = int(len(filtered) * telephony_rate / sample_rate)
        downsampled = signal.resample(filtered, num_target_samples)
    else:
        downsampled = filtered

    # 3. Non-linear soft saturation / AGC compression: y = tanh(1.4 * x) / 1.4
    # Models acoustic microphone saturation and analog line companding
    compressed = np.tanh(1.4 * downsampled) / 1.4

    # 4. Inject subtle channel line hiss (30 dB SNR)
    signal_power = float(np.mean(compressed ** 2))
    if signal_power > 1e-9:
        hiss_power = signal_power / (10.0 ** (30.0 / 10.0))
        rng = np.random.default_rng(seed)
        hiss = rng.normal(0.0, np.sqrt(hiss_power), len(compressed)).astype(np.float32)
        compressed = compressed + hiss

    # 5. Resample to 16000 Hz for standard speech API ingestion
    api_rate = 16000
    num_final_samples = int(len(compressed) * api_rate / telephony_rate)
    upsampled = signal.resample(compressed, num_final_samples).astype(np.float32)

    return np.clip(upsampled, -1.0, 1.0), api_rate


def generate_all_variants(
    clean_wav_bytes: bytes,
    noise_levels: List[str] | None = None,
    include_phone_sim: bool = True
) -> Dict[str, Dict[str, Any]]:
    """
    Takes clean WAV bytes and generates all requested variants:
    - "original" (clean baseline)
    - "light" (20 dB SNR)
    - "medium" (10 dB SNR)
    - "heavy" (3 dB SNR)
    - "phone_sim" (ITU-T G.712 bandpass + 8kHz telephony + saturation)

    Returns a dict mapping variant_key -> {
        "wav_bytes": bytes,
        "label": str,
        "snr_db": float | None,
        "description": str,
        "dsp_steps": List[str]
    }
    """
    if noise_levels is None:
        noise_levels = ["light", "medium", "heavy"]

    audio, sr = load_wav_to_numpy(clean_wav_bytes)

    variants: Dict[str, Dict[str, Any]] = {}

    # 1. Clean Baseline (Original)
    variants["original"] = {
        "wav_bytes": numpy_to_wav_bytes(audio, sr),
        "label": "Original (Clean Baseline)",
        "snr_db": None,
        "description": "Unmodified input audio recording.",
        "dsp_steps": ["Direct passthrough into 16-bit PCM WAV (16 kHz)."],
    }

    # 2. Additive Noise Variants
    for level in noise_levels:
        preset = SNR_PRESETS.get(level)
        if preset:
            noisy_audio = add_gaussian_noise(audio, preset["snr_db"])
            variants[level] = {
                "wav_bytes": numpy_to_wav_bytes(noisy_audio, sr),
                "label": preset["label"],
                "snr_db": preset["snr_db"],
                "description": preset["description"],
                "dsp_steps": preset["dsp_steps"],
            }

    # 3. Telephony Simulation
    if include_phone_sim:
        phone_audio, phone_sr = simulate_phone_call(audio, sr)
        variants["phone_sim"] = {
            "wav_bytes": numpy_to_wav_bytes(phone_audio, phone_sr),
            "label": PHONE_SIM_METADATA["label"],
            "snr_db": 30.0,
            "description": PHONE_SIM_METADATA["description"],
            "dsp_steps": PHONE_SIM_METADATA["dsp_steps"],
        }

    return variants

