export interface Finding {
  id: string;
  job_id: string;
  category: string; // 'Direct Identifier', 'Quasi-Identifier', 'UID', 'Date', 'Free Text', 'Private Tag', 'Pixel Text', 'Barcode/QR'
  tag_or_location: string;
  original_value: string;
  new_value?: string;
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  bbox?: [number, number, number, number]; // [x, y, w, h]
  is_redacted?: boolean;
  created_at: string;
}

export interface ValidationCheck {
  id: string;
  job_id: string;
  check_name: string;
  category: string;
  passed: boolean;
  severity: string;
  evidence: string;
  details?: string;
}

export interface RedTeamResult {
  id: string;
  job_id: string;
  attack_name: string;
  risk_contribution: number;
  detected: boolean;
  description: string;
  evidence?: string;
}

export interface StageLatencies {
  discover?: number;
  transform?: number;
  validate?: number;
  redteam?: number;
  gate?: number;
  total?: number;
}

export interface StageComplexityInfo {
  stage?: string;
  formula: string;
  name: string;
  description: string;
  space_complexity?: string;
}

export interface JobDetail {
  id: string;
  filename: string;
  policy_name: string;
  status: 'processing' | 'approved' | 'needs_human_review' | 'quarantined' | 'pending';
  stage: 'discover' | 'transform' | 'validate' | 'redteam' | 'gate' | 'finished';
  stage_progress: number;
  input_hash?: string;
  output_hash?: string;
  findings_count: number;
  risk_score: number;
  verdict?: 'APPROVED' | 'NEEDS_REVIEW' | 'QUARANTINED';
  verdict_reason?: string;
  reviewer_decision?: string;
  reviewer_notes?: string;
  latency_ms?: number;
  accuracy_pct?: number;
  stage_latencies?: StageLatencies;
  time_complexity?: Record<string, StageComplexityInfo>;
  created_at: string;
  updated_at: string;
  findings?: Finding[];
  validation_checks?: ValidationCheck[];
  redteam_results?: RedTeamResult[];
}

export interface DiffItem {
  tag_keyword: string;
  original_value: string;
  processed_value: string;
  is_changed: boolean;
  status: 'REMOVED' | 'PSEUDONYMIZED' | 'MODIFIED' | 'UNCHANGED';
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  date_shift_days: number;
  rules: any;
}

export interface SampleScan {
  id: string;
  name: string;
  filename: string;
  modality: string;
  description: string;
  expected_outcome: 'APPROVED' | 'NEEDS_REVIEW' | 'QUARANTINED';
  risk_type: string;
}

export interface AuditEntry {
  id: number;
  entry_id: string;
  timestamp: string;
  job_id?: string;
  actor: string;
  action: string;
  details: any;
  input_hash?: string;
  output_hash?: string;
  prev_hash: string;
  entry_hash: string;
}

export interface AuditVerification {
  is_valid: boolean;
  total_entries: number;
  first_hash?: string;
  latest_hash?: string;
  message: string;
  broken_entry_id?: string;
}

export interface DashboardStats {
  total_jobs: number;
  total_findings: number;
  approved_count: number;
  review_count: number;
  quarantined_count: number;
  findings_by_category: { category: string; cnt: number }[];
  avg_latency_ms?: number;
  avg_accuracy_pct?: number;
}

export interface GlossaryTerm {
  term: string;
  plain_english: string;
  why_it_matters: string;
}
