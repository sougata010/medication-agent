from pydantic import BaseModel
from typing import List, Dict, Optional

class ActiveCompound(BaseModel):
    name: str
    strength: str

class ChemicalStructure(BaseModel):
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[str] = None
    smiles: Optional[str] = None

class Medicine_Data(BaseModel):
    brand_name: str
    generic_names: List[str]
    manufacturer: str
    form: str
    active_compounds: List[ActiveCompound]
    chemical_structures: Dict[str, ChemicalStructure]

class Medicine(BaseModel):
    status: str
    message: Medicine_Data