from typing import List, Dict, Any
from pydantic import BaseModel, Field

class SafetyEvaluation(BaseModel):
    drug_name: str
    interaction_found: bool
    contraindication_found: bool
    evidence_extracted: str = Field(description="Direct clinical snippets pulled live from openFDA.")
