from pydantic import BaseModel, Field
from typing import List

class DrugMediaAssets(BaseModel):
    drug_name: str
    molecular_structure_urls: List[str] = Field(default_factory=list)
    physical_product_image_url: str
    status: str