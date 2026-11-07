export interface SlotPrompt {
  ta: string;
  tanglish: string;
  en: string;
}

export interface SlotDefinition {
  name: string;
  label_en: string;
  label_ta: string;
  type: 'text' | 'phone' | 'date' | 'time' | 'number' | 'select';
  required: boolean;
  options?: string[];
  prompts: SlotPrompt;
  description?: string;
}

export interface Sector {
  id: string;
  name: string;
  display_name_ta: string;
  display_name_en: string;
  tagline_ta: string;
  tagline_en: string;
  description: string;
  icon: string;
  accent_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at?: string;
}

export interface SectorDetail extends Sector {
  slots: SlotDefinition[];
  has_scheduling: boolean;
  schedule_date_key?: string;
  schedule_time_key?: string;
  urgent_keywords: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'owner' | 'staff' | 'admin';
  is_active?: boolean;
  sector_id: string;
  created_at: string;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  sector_id: string;
  terms_accepted: boolean;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface AlertItem {
  id: number;
  sector_id: string;
  sector_name?: string;
  sector_icon?: string;
  sector_accent?: string;
  call_id?: number;
  phone: string;
  reason: string;
  matched_keyword: string;
  snippet: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'new' | 'under_review' | 'confirmed' | 'resolved' | 'false_alarm';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  is_dev_sample: boolean;
  created_at: string;
  transcript_turns: Array<{ speaker: string; text: string }>;
}

export interface AlertSummary {
  total_alerts: number;
  new_alerts: number;
  under_review: number;
  confirmed_urgent: number;
  resolved_alerts: number;
  false_alarms: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  sector_id?: string;
  created_at: string;
}

export interface AdminOverview {
  total_users: number;
  active_users: number;
  total_sectors: number;
  total_calls: number;
  total_bookings: number;
  total_alerts: number;
  new_alerts: number;
  confirmed_alerts: number;
  system_status: string;
  integrations: Record<string, any>;
  sector_breakdown: Array<{
    sector_id: string;
    name: string;
    display_name_ta: string;
    display_name_en: string;
    icon: string;
    accent_color: string;
    users_count: number;
    calls_count: number;
    bookings_count: number;
    alerts_count: number;
  }>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
  sector: Sector | null;
}

export interface Booking {
  id: number;
  sector_id: string;
  reference_number: string;
  customer_name: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  details: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingInput {
  customer_name: string;
  phone: string;
  details: Record<string, any>;
  notes?: string;
}

export interface ConflictCheckResult {
  has_conflict: boolean;
  conflict_message?: string;
  conflicting_reference?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  database: string;
  gnani_stt_configured: boolean;
  gnani_tts_configured: boolean;
  gnani_stt_model: string;
  gnani_tts_model: string;
  active_sectors_count: number;
}

// ---------------------------------------------------------------------------
// Phase 4 — Conversation Engine & Turns
// ---------------------------------------------------------------------------

export interface ConversationTurn {
  speaker: 'caller' | 'agent';
  text: string;
}

export interface DashboardSummary {
  today_calls: number;
  today_bookings: number;
  completion_rate_pct: number;
  avg_call_duration_seconds: number;
  urgent_alerts_count: number;
  pending_actions_count?: number;
  calls_per_day: { date: string; count: number }[];
  outcomes: { outcome: string; count: number }[];
  top_intents: { intent: string; count: number }[];
  peak_hours: { hour: string; calls: number }[];
  recent_calls: {
    id: number;
    caller_phone: string;
    outcome: string;
    duration: string;
    time: string;
    urgent: boolean;
  }[];
  language_distribution?: { language: string; count: number; percentage: number }[];
  booking_trends?: { date: string; count: number }[];
  booking_statuses?: { status: string; count: number }[];
  sector_comparison?: { sector_id: string; name: string; calls: number; bookings: number }[];
  recent_alerts?: { id: number; caller_phone: string; reason: string; status: string; created_at: string }[];
}

export interface SectorOverviewStat {
  sector_id: string;
  calls_today: number;
  total_calls: number;
  bookings_today: number;
  total_bookings: number;
  urgent_alerts: number;
  last_call_at: string | null;
}

export interface HubOverview {
  total_calls: number;
  today_calls: number;
  total_bookings: number;
  today_bookings: number;
  total_urgent_alerts: number;
  overall_completion_rate: number;
  sector_stats: Record<string, SectorOverviewStat>;
  recent_calls: {
    id: number;
    sector_id: string;
    caller_phone: string;
    outcome: string;
    duration: string;
    time: string;
    urgent: boolean;
  }[];
  daily_trends: { date: string; count: number }[];
}

export interface AgentQuestion {
  id: string;
  text_en: string;
  text_ta: string;
  order: number;
}

export interface SectorSettingsData {
  // Business Profile
  business_name: string;
  contact_phone: string;
  contact_email: string;
  // Working Hours
  open_time: string;
  close_time: string;
  working_days: string[];
  // Booking
  slot_length_minutes: number;
  // Voice & Language
  language_mode: string;
  tts_voice: string;
  // Agent Questions
  agent_questions: AgentQuestion[];
  // Urgent Keywords
  urgent_keywords: string[];
  // Privacy
  store_audio: boolean;
  data_retention_days?: number;
  consent_banner_enabled?: boolean;
}

export interface CallLogItem {
  id: number;
  sector_id: string;
  caller_phone: string;
  start_time: string;
  duration_seconds: number;
  outcome: string;
  sentiment: string;
  urgent_flag: boolean;
  transcript_turns: ConversationTurn[];
  insights: {
    source?: string;
    intent?: string;
    summary?: string;
    key_details?: Record<string, any>;
    sentiment?: string;
    turns_count?: number;
  };
  created_at: string;
}

export interface AgentTurnResponse {
  session_id: string;
  state: 'collecting' | 'confirming' | 'completed';
  slots: Record<string, any>;
  next_slot: string | null;
  agent_message: string;
  is_complete: boolean;
  summary: Record<string, any> | null;
  conversation_history: ConversationTurn[];
}

export type LanguageMode = 'tamil' | 'tanglish' | 'english' | 'auto';

export interface TranscribeSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Response from POST /api/voice/transcribe
 * Fields mirror the real Gnani Prisma v3.0 JSON response.
 */
export interface TranscribeResponse {
  success: boolean;
  transcript: string;
  language_code: string;
  model: string;
  confidence: number | null;
  segments: TranscribeSegment[] | null;
  /** Set when the backend converted WebM→WAV before sending to Prisma */
  preprocessing: string | null;
  audio_stored: boolean;
}

// ---------------------------------------------------------------------------
// Phase 9 — Noise Lab & Safety Test Sheet
// ---------------------------------------------------------------------------

export interface TokenAlignment {
  type: 'match' | 'sub' | 'del' | 'ins';
  ref: string;
  hyp: string;
}

export interface NoiseLabVariantResult {
  variant_key: string;
  label: string;
  snr_db: number | null;
  description: string;
  dsp_steps: string[];
  status: 'success' | 'error';
  error_detail: string | null;
  latency_ms: number;
  transcript: string;
  confidence: number | null;
  wer: number;
  wer_percent: number;
  word_accuracy_percent: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  hits: number;
  ref_word_count: number;
  hyp_word_count: number;
  alignment: TokenAlignment[];
}

export interface NoiseLabRunSummary {
  baseline_wer_percent: number | null;
  worst_wer_percent: number | null;
  phone_sim_wer_percent: number | null;
  total_variants: number;
  successful_variants: number;
  formula: string;
}

export interface NoiseLabExperimentResponse {
  success: boolean;
  reference_text: string;
  language_mode: string;
  results: NoiseLabVariantResult[];
  summary: NoiseLabRunSummary;
  disclaimer: string;
  limitations: string[];
}

export interface NoiseLabSavedRun {
  id: number;
  reference_text: string;
  language_mode: string;
  audio_filename: string;
  summary: NoiseLabRunSummary;
  created_at: string;
}

export interface SafetyTestCase {
  id: string;
  sector: string;
  language: string;
  category: string;
  text: string;
  expected_urgent: boolean;
  expected_keyword?: string;
  notes?: string;
}

export interface SafetyConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  actual_positives: number;
  actual_negatives: number;
}

export interface SafetyMetrics {
  recall_percent: number;
  false_alarm_rate_percent: number;
  precision_percent: number;
  specificity_percent: number;
  accuracy_percent: number;
}

export interface SafetyEvaluationItem {
  id: string;
  sector: string;
  language: string;
  category: string;
  text: string;
  expected_urgent: boolean;
  predicted_urgent: boolean;
  matched_keyword: string | null;
  notes: string;
  is_correct: boolean;
  classification: 'TP' | 'FP' | 'TN' | 'FN';
}

export interface SafetyBenchmarkResult {
  sector_filter: string;
  total_test_cases: number;
  metrics: SafetyMetrics;
  confusion_matrix: SafetyConfusionMatrix;
  category_breakdown: Record<string, { total: number; correct: number; errors: number; accuracy_percent: number }>;
  sector_breakdown: Record<string, { total: number; correct: number; recall_percent: number; false_alarm_rate_percent: number }>;
  misses_count: number;
  false_alarms_count: number;
  misses: SafetyEvaluationItem[];
  false_alarms: SafetyEvaluationItem[];
  all_results: SafetyEvaluationItem[];
  suggested_improvements: { type: string; item_id: string; text: string; reason: string }[];
  clinical_disclaimer: string;
}
