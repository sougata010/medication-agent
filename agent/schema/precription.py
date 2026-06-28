from typing import List, Literal
from pydantic import BaseModel, Field

class ExtractionItem(BaseModel):
    drug_name: str = Field(description="The identified brand or generic name of the medication.")
    dosage: str = Field(description="The strength or dosage parsed from the text (e.g., '10/325 mg').")
    frequency: str = Field(description="How often or when the medication should be taken (e.g., 'AM', 'PM', 'Bedtime').")
    duration: str = Field(description="The duration of treatment if specified, otherwise 'Not specified'.")
    confidence_level: Literal["high", "low"] = Field(
        description="Mark 'low' if handwriting distortion, typos, or fragmentation forced a clinical guess."
    )
    clinical_reasoning: str = Field(description="Brief explanation of how discrepancies or typos were resolved.")

class PrescriptionDossier(BaseModel):
    medications: List[ExtractionItem] = Field(description="List of all extracted and categorized medications.")
