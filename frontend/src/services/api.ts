import type {
  HealthStatus,
  Sector,
  SectorDetail,
  AuthResponse,
  Booking,
  BookingInput,
  ConflictCheckResult,
  TranscribeResponse,
  AgentTurnResponse,
  CallLogItem,
  DashboardSummary,
  SectorSettingsData,
  RegisterInput,
  RegisterResponse,
  AlertItem,
  AlertSummary,
  AdminOverview,
  AdminUser,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('vaayil_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new ApiError(`Health check failed: ${res.statusText}`, res.status);
    }
    return res.json();
  },

  async getSectors(): Promise<Sector[]> {
    const res = await fetch(`${API_BASE}/sectors`);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch sectors: ${res.statusText}`, res.status);
    }
    return res.json();
  },

  async getSectorDetail(sectorId: string): Promise<SectorDetail> {
    const res = await fetch(`${API_BASE}/sectors/${sectorId}`);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch sector details: ${res.statusText}`, res.status);
    }
    return res.json();
  },

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new ApiError(err.detail || 'Registration failed', res.status);
    }

    return res.json();
  },

  async adminLogin(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Admin login failed' }));
      throw new ApiError(err.detail || 'Admin login failed', res.status);
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem('vaayil_token', data.access_token);
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new ApiError(err.detail || 'Login failed', res.status);
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem('vaayil_token', data.access_token);
    return data;
  },

  async demoLogin(sectorId: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/demo-login/${sectorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Demo login failed' }));
      throw new ApiError(err.detail || 'Demo login failed', res.status);
    }

    const data: AuthResponse = await res.json();
    localStorage.setItem('vaayil_token', data.access_token);
    return data;
  },

  async getMe(): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      localStorage.removeItem('vaayil_token');
      throw new ApiError('Session expired or invalid', res.status);
    }

    return res.json();
  },

  logout(): void {
    localStorage.removeItem('vaayil_token');
  },

  getToken(): string | null {
    return localStorage.getItem('vaayil_token');
  },

  // ==================== BOOKINGS API ====================

  async getBookings(search?: string, statusFilter?: string): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

    const url = `${API_BASE}/bookings${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch bookings' }));
      throw new ApiError(err.detail || 'Failed to fetch bookings', res.status);
    }

    return res.json();
  },

  async createBooking(payload: BookingInput): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create booking' }));
      throw new ApiError(err.detail || 'Failed to create booking', res.status);
    }

    return res.json();
  },

  async updateBooking(id: number, payload: Partial<BookingInput> & { status?: string }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update booking' }));
      throw new ApiError(err.detail || 'Failed to update booking', res.status);
    }

    return res.json();
  },

  async cancelBooking(id: number): Promise<{ message: string; success: boolean }> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to cancel booking' }));
      throw new ApiError(err.detail || 'Failed to cancel booking', res.status);
    }

    return res.json();
  },

  async checkConflict(details: Record<string, any>, excludeBookingId?: number): Promise<ConflictCheckResult> {
    const url = `${API_BASE}/bookings/check-conflict${excludeBookingId ? `?exclude_booking_id=${excludeBookingId}` : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(details),
    });

    if (!res.ok) {
      return { has_conflict: false };
    }

    return res.json();
  },

  // ==================== ANALYTICS & DASHBOARD (Phase 7) ====================

  async getAnalyticsSummary(startDate?: string, endDate?: string): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const res = await fetch(`${API_BASE}/analytics/summary${params.toString() ? `?${params.toString()}` : ''}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch analytics summary', res.status);
    }
    return res.json();
  },

  async getHubOverview(): Promise<import('../types').HubOverview> {
    const res = await fetch(`${API_BASE}/analytics/hub-overview`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch hub overview', res.status);
    }
    return res.json();
  },

  async clearDemoData(): Promise<{ message: string; success: boolean }> {
    const res = await fetch(`${API_BASE}/demo/clear`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to clear demo data', res.status);
    }
    return res.json();
  },

  // ==================== SETTINGS (Phase 7) ====================

  async getSettings(): Promise<SectorSettingsData> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to load settings', res.status);
    }
    return res.json();
  },

  async updateSettings(payload: SectorSettingsData): Promise<SectorSettingsData> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new ApiError('Failed to update settings', res.status);
    }
    return res.json();
  },

  // ==================== CALL LOGS & INSIGHTS (Phase 6) ====================

  async getCallLogs(search?: string, outcome?: string, urgentOnly?: boolean): Promise<CallLogItem[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (outcome && outcome !== 'all') params.append('outcome', outcome);
    if (urgentOnly) params.append('urgent_only', 'true');

    const res = await fetch(`${API_BASE}/call-logs${params.toString() ? `?${params.toString()}` : ''}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch call logs', res.status);
    }
    return res.json();
  },

  async getCallLogDetail(id: number): Promise<CallLogItem> {
    const res = await fetch(`${API_BASE}/call-logs/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch call detail', res.status);
    }
    return res.json();
  },

  async confirmBookingFromCall(payload: {
    session_id: string;
    sector_id: string;
    slots: Record<string, any>;
    notes?: string;
  }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to confirm booking' }));
      throw new ApiError(err.detail || 'Failed to confirm booking', res.status);
    }
    return res.json();
  },

  // ==================== AGENT CONVERSATION TURNS (Phase 4) ====================

  /**
   * Executes a deterministic turn with the conversation engine.
   */
  async executeAgentTurn(payload: {
    session_id?: string;
    sector_id: string;
    transcript_text: string;
    language_mode?: string;
  }): Promise<AgentTurnResponse> {
    const res = await fetch(`${API_BASE}/agent/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Agent turn failed' }));
      throw new ApiError(err.detail || 'Agent turn failed', res.status);
    }

    return res.json();
  },

  // ==================== VOICE / PRISMA STT API (Phase 3) ====================

  /**
   * Synthesizes speech from text using genuine Gnani Timbre TTS (Phase 5).
   * Returns a playable Blob URL.
   */
  async speakText(text: string, languageMode: string = 'ta-IN', voice: string = 'Shivani'): Promise<Blob> {
    const res = await fetch(`${API_BASE}/voice/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        text,
        voice,
        language_mode: languageMode,
        speed: 1.0,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Timbre TTS synthesis failed' }));
      throw new ApiError(err.detail || 'Timbre TTS synthesis failed', res.status);
    }

    return res.blob();
  },

  /**
   * Send an audio file to the backend for Gnani Prisma STT transcription.
   * The backend validates the file, converts WebM→WAV if needed, and calls
   * Prisma with the API key from env vars. Never calls Prisma from the frontend.
   *
   * @param formData - FormData with 'audio' (File) and 'language' (string) fields
   * @returns Real transcript + metadata from Prisma's response
   */
  async transcribe(formData: FormData): Promise<TranscribeResponse> {
    const res = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers: {
        // No Content-Type header — browser sets multipart boundary automatically
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Transcription failed' }));
      throw new ApiError(err.detail || 'Transcription failed', res.status);
    }

    return res.json();
  },

  // ==================== DEMO MODE API ====================

  async loadDemoBookings(): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/demo/load`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load demo bookings' }));
      throw new ApiError(err.detail || 'Failed to load demo bookings', res.status);
    }

    return res.json();
  },

  // ==================== NOISE LAB & SAFETY TEST (Phase 9) ====================

  async runNoiseLab(
    audioBlob: Blob,
    referenceText: string,
    languageMode = 'tamil',
    noiseLevels = 'light,medium,heavy',
    includePhoneSim = true
  ): Promise<any> {
    const formData = new FormData();
    const isWebm = audioBlob.type.includes('webm');
    const isOgg = audioBlob.type.includes('ogg');
    const fileName = (audioBlob as any).name || (isWebm ? 'recorded_audio.webm' : isOgg ? 'recorded_audio.ogg' : 'sample.wav');
    formData.append('audio_file', audioBlob, fileName);
    formData.append('reference_text', referenceText);
    formData.append('language_mode', languageMode);
    formData.append('noise_levels', noiseLevels);
    formData.append('include_phone_sim', String(includePhoneSim));

    const res = await fetch(`${API_BASE}/noise-lab/run`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Noise Lab experiment failed' }));
      throw new ApiError(err.detail || 'Noise Lab experiment failed', res.status);
    }

    return res.json();
  },

  async saveNoiseLabRun(payload: any): Promise<{ success: boolean; run_id: number; message: string }> {
    const res = await fetch(`${API_BASE}/noise-lab/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save Noise Lab run' }));
      throw new ApiError(err.detail || 'Failed to save run', res.status);
    }

    return res.json();
  },

  async getNoiseLabRuns(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/noise-lab/runs`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch saved Noise Lab runs', res.status);
    }
    return res.json();
  },

  async getNoiseLabRun(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/noise-lab/runs/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch run details', res.status);
    }
    return res.json();
  },

  async getSafetyDataset(sector?: string): Promise<any> {
    const params = sector && sector !== 'all' ? `?sector=${sector}` : '';
    const res = await fetch(`${API_BASE}/safety-test/dataset${params}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch safety dataset', res.status);
    }
    return res.json();
  },

  async runSafetyBenchmark(sector = 'all'): Promise<any> {
    const res = await fetch(`${API_BASE}/safety-test/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ sector }),
    });
    if (!res.ok) {
      throw new ApiError('Failed to execute safety benchmark', res.status);
    }
    return res.json();
  },

  // ==================== URGENT ALERTS API ====================
  async getAlerts(filters?: {
    status?: string;
    severity?: string;
    sector_id?: string;
    search?: string;
  }): Promise<AlertItem[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
    if (filters?.sector_id && filters.sector_id !== 'all') params.append('sector_id', filters.sector_id);
    if (filters?.search) params.append('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/alerts${queryStr}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch urgent alerts', res.status);
    }
    return res.json();
  },

  async getAlertSummary(sectorId?: string): Promise<AlertSummary> {
    const query = sectorId && sectorId !== 'all' ? `?sector_id=${sectorId}` : '';
    const res = await fetch(`${API_BASE}/alerts/summary${query}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch alert summary metrics', res.status);
    }
    return res.json();
  },

  async getAlertDetail(id: number): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch alert detail', res.status);
    }
    return res.json();
  },

  async reviewAlert(id: number, action: string, reviewNotes?: string): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/alerts/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ action, review_notes: reviewNotes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit alert review' }));
      throw new ApiError(err.detail || 'Review update failed', res.status);
    }
    return res.json();
  },

  // ==================== ADMIN API ====================
  async getAdminOverview(): Promise<AdminOverview> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch admin overview', res.status);
    }
    return res.json();
  },

  async getAdminUsers(params?: { search?: string; sector_id?: string; role?: string }): Promise<AdminUser[]> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.sector_id && params.sector_id !== 'all') sp.append('sector_id', params.sector_id);
    if (params?.role && params.role !== 'all') sp.append('role', params.role);

    const queryStr = sp.toString() ? `?${sp.toString()}` : '';
    const res = await fetch(`${API_BASE}/admin/users${queryStr}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new ApiError('Failed to fetch users', res.status);
    }
    return res.json();
  },

  async toggleUserStatus(userId: number, isActive: boolean): Promise<{ success: boolean; message: string; is_active: boolean }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update user status' }));
      throw new ApiError(err.detail || 'Failed to toggle status', res.status);
    }
    return res.json();
  },
};
