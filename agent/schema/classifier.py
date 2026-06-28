from typing import Literal
from pydantic import BaseModel, Field

class RouterDecision(BaseModel):
    next_node: Literal["general_query", "prescription_upload", "lab_report"] = Field(
        description="Route to 'general_query' for textual questions, 'prescription_upload' for image/PDF prescriptions, and 'lab_report' for blood/lab metrics."
    )
    rationale: str = Field(description="A brief sentence explaining why this path was chosen.")
