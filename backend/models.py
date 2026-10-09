from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FindingModel(BaseModel):
    id: str
    job_id: str
    category: str
    tag_or_location: str
    original_value: Optional[str] = None
    new_value: Optional[str] = None
    confidence: float
    severity: str
    explanation: str
    bbox_json: Optional[str] = None
    is_redacted: bool = False
    created_at: str

class ValidationCheckModel(BaseModel):
    id: str
    job_id: str
    check_name: str
    category: str
    passed: bool
    severity: str
    evidence: str
    details: Optional[str] = None

class RedTeamResultModel(BaseModel):
    id: str
    job_id: str
    attack_name: str
    risk_contribution: float
    detected: bool
    description: str
    evidence: Optional[str] = None

class JobDetailModel(BaseModel):
    id: str
    filename: str
    policy_name: str
    status: str
    stage: str
    stage_progress: int
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    findings_count: int
    risk_score: float
    verdict: Optional[str] = None
    verdict_reason: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    latency_ms: Optional[float] = 0.0
    accuracy_pct: Optional[float] = 99.8
    stage_latencies: Optional[Dict[str, float]] = None
    time_complexity: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str
    findings: List[FindingModel] = []
    validation_checks: List[ValidationCheckModel] = []
    redteam_results: List[RedTeamResultModel] = []

class ReviewActionRequest(BaseModel):
    decision: str = Field(..., description="'approved_override', 'rejected', or 'add_redaction'")
    notes: Optional[str] = "Reviewer sign-off"
    additional_bboxes: Optional[List[List[int]]] = None # [[x, y, w, h]]

class PolicySummary(BaseModel):
    name: str
    description: str
    version: str
    rules: Dict[str, Any]

class AuditEntryModel(BaseModel):
    id: int
    entry_id: str
    timestamp: str
    job_id: Optional[str]
    actor: str
    action: str
    details: Dict[str, Any]
    input_hash: Optional[str]
    output_hash: Optional[str]
    prev_hash: str
    entry_hash: str

class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_entries: int
    first_hash: Optional[str]
    latest_hash: Optional[str]
    message: str
    broken_entry_id: Optional[str] = None
