from pydantic import BaseModel
from typing import List, Dict, Optional

class ChemicalStructure(BaseModel):
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[str] = None
    smiles: Optional[str] = None

class ClinicalGuidelines(BaseModel):
    warnings: Optional[str] = None
    interactions: Optional[str] = None

class GenomicInteraction(BaseModel):
    gene_symbol: Optional[str] = None
    interaction_action: Optional[str] = None

class ChemicalDossier(BaseModel):
    generic_name: str
    structural_framework: ChemicalStructure
    synonyms: List[str]
    clinical_guidelines: ClinicalGuidelines
    genomic_interactions: List[GenomicInteraction]