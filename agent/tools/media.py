import os
import httpx
from agent.schema.media import DrugMediaAssets
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import logging
from agent.tools.internet import TavilySearcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Google API key missing from environment configurations.")

class UnifiedMediaFetcher:
    def __init__(self):
        self.pubchem_base = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
        self.nih_rximage_base = "https://rximage.nlm.nih.gov/api/rximage/1/modules.json"
        self.model = "gemini-3.0-flash"
        self.internet_tool = TavilySearcher()
    def _get_active_compounds_via_llm(self, drug_name: str) -> List[str]:
        llm = ChatGoogleGenerativeAI(
            model=self.model, 
            google_api_key=api_key, 
            temperature=0.0
        )
        system_prompt = (
            "You are a clinical assistant. Identify all active generic chemical compound components "
            "composing the given medication name. Output ONLY their clean generic names separated by a comma. "
            "Do not include sentences, markdown, or punctuation.\n"
            "Example Input: Augmentin\nExample Output: amoxicillin, clavulanate\n"
            "Example Input: Vicodin\nExample Output: acetaminophen, hydrocodone\n"
            "Example Input: Ibuprofen\nExample Output: ibuprofen"
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Deconstruct: {drug_name}")
        ]
        try:
            response = llm.invoke(messages)
            raw_text = response.content.strip()
            if r"," in raw_text:
                return [comp.strip().lower() for comp in raw_text.split(",")]
            return [raw_text.lower()]
        except Exception as e:
            logger.error(f"Compound deconstruction failed: {str(e)}")
            return [drug_name.lower()]
    def _get_pubchem_url(self, client: httpx.Client, generic_name: str) -> Optional[str]:
        """Queries PubChem PUG REST service for 2D molecular structures."""
        try:
            cid_url = f"{self.pubchem_base}/compound/name/{generic_name}/cids/JSON"
            res = client.get(cid_url, timeout=5.0)
            if res.status_code == 200:
                cid = res.json().get("IdentifierList", {}).get("CID", [None])[0]
                if cid:
                    return f"{self.pubchem_base}/compound/cid/{cid}/PNG"
        except Exception:
            pass
        return None
    def _execute_rximage_query(self, client: httpx.Client, name: str) -> Optional[str]:
        """Queries the National Library of Medicine RxImage API."""
        try:
            query_url = f"{self.nih_rximage_base}?name={name}&resolution=600"
            res = client.get(query_url, timeout=5.0)
            if res.status_code == 200:
                images = res.json().get("nlmRxImages", [])
                if images:
                    return images[0].get("imageUrl")
        except Exception:
            pass
        return None
    def fetch_all_assets(self, drug_name: str) -> DrugMediaAssets:
        compounds = self._get_active_compounds_via_llm(drug_name)
        molecular_images = []
        with httpx.Client() as client:
            for compound in compounds:
                mol_url = self._get_pubchem_url(client, compound)
                if not mol_url:
                    mol_url = f"https://ui-avatars.com/api/?name=MOL+{compound.upper()}&background=1e293b&color=818cf8&size=500"
                molecular_images.append(mol_url)
            physical_img = self._execute_rximage_query(client, compounds[0])
            if not physical_img and len(compounds) > 1:
                physical_img = self._execute_rximage_query(client, drug_name)
        
        if not physical_img:
            search_query_str = f"{drug_name} pill capsule appearance site:wikimedia.org OR site:images.unsplash.com"
            internet_schema_res = self.internet_tool.search_query(search_query_str)
            
            if hasattr(internet_schema_res, 'search_res') and internet_schema_res.search_res:
                for result in internet_schema_res.search_res:
                    url = result.url if hasattr(result, 'url') else result.get("url", "")
                    if any(ext in url.lower() for ext in [".jpg", ".jpeg", ".png", "static", "images"]):
                        physical_img = url
                        break
        if not physical_img:
            physical_img = f"https://ui-avatars.com/api/?name={drug_name.upper()}&background=1e293b&color=38bdf8&size=500&font-size=0.15&bold=true"
            
        return DrugMediaAssets(
            drug_name=drug_name,
            molecular_structure_urls=molecular_images, 
            physical_product_image_url=physical_img,
            status="Success"
        )

if __name__ == "__main__":
    fetcher = UnifiedMediaFetcher()
    print("--- 🖼️ Testing Modular Live Media Asset Node 🖼️ ---\n")
    
    # Test with a known multi-compound combination medicine
    target_drug = "Augmentin" 
    assets = fetcher.fetch_all_assets(target_drug)
    
    print(f"Assets loaded for Target: {assets.drug_name}")
    print(f"  * [Live Molecular Diagram Links Found]: {len(assets.molecular_structure_urls)}")
    for url in assets.molecular_structure_urls:
        print(f"    - {url}")
    print(f"  * [Live Physical Pill Look Link]: {assets.physical_product_image_url}")