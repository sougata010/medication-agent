from pydantic import BaseModel
from typing import Optional,List

class SearchResultItem(BaseModel):
    title: str
    url: str
    content: str
class Internet(BaseModel):
    answer:Optional[str]=None
    search_res:List[SearchResultItem]


