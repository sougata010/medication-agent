import os
from dotenv import load_dotenv
import requests
from schema.medicine import Medicine as MedicineSchema

load_dotenv()
openfd_api = os.getenv("OPENFDA_API_KEY")
if not openfd_api:
    raise RuntimeError("OPENFD API NOT FOUND")

class MedicineLookupTool:
    def __init__(self):
        self.openfd_api = openfd_api
        self.fda_url = "https://api.fda.gov/drug/drugsfda.json"
        
    def _fetch_chemical_properties(self, generic_name: str) -> dict:
        if not generic_name or generic_name == "Unknown":
            return {"molecular_formula": None, "molecular_weight": None, "smiles": None}
            
        clean_name = generic_name.split(";")[0].split()[0].strip(",;").lower()
        pubchem_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{clean_name}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON"
        
        try:
            res = requests.get(pubchem_url, timeout=4.0)
            if res.status_code == 200:
                props = res.json().get("PropertyTable", {}).get("Properties", [])[0]
                return {
                    "molecular_formula": props.get("MolecularFormula"),
                    "molecular_weight": str(props.get("MolecularWeight")),
                    "smiles": props.get("CanonicalSMILES")
                }
        except:
            pass
        return {"molecular_formula": None, "molecular_weight": None, "smiles": None}

    def med_search(self, med_name: str = "", med_brand: str = ""):
        search_terms = []
        if med_brand:
            search_terms.append(f'openfda.brand_name:"{med_brand}"')
        if med_name:
            search_terms.append(f'openfda.generic_name:"{med_name}"')    
        if not search_terms:
            return {"status": "Error", "message": "Provide either med_name or med_brand."}  
            
        search_query = " OR ".join(search_terms)
        params = {
            "search": search_query,
            "limit": 1,
            "api_key": self.openfd_api
        }
        
        try:
            response = requests.get(self.fda_url, params=params, timeout=6.0)
            if response.status_code == 200:
                raw_results = response.json().get("results", [])[0]
                fda_meta = raw_results.get("openfda", {})
                products = raw_results.get("products", [])
                
                compounds_list = []
                chemical_profiles = {}
                
                for product in products:
                    active_ingredients = product.get("active_ingredients", [])
                    for ingredient in active_ingredients:
                        raw_name = ingredient.get("name", "Unknown")
                        strength = ingredient.get("strength", "Unknown")
                        
                        if raw_name not in chemical_profiles:
                            compounds_list.append({
                                "name": raw_name,
                                "strength": strength
                            })
                            chemical_profiles[raw_name] = self._fetch_chemical_properties(raw_name)
                
                raw_payload = {
                    "status": "Success",
                    "message": {
                        "brand_name": fda_meta.get("brand_name", [med_brand if med_brand else "Unknown"])[0],
                        "generic_names": fda_meta.get("generic_name", []),
                        "manufacturer": fda_meta.get("manufacturer_name", ["Unknown"])[0],
                        "form": products[0].get("dosage_form", "Unknown") if products else "Unknown",
                        "active_compounds": compounds_list,
                        "chemical_structures": chemical_profiles
                    }
                }
                
                validated_model = MedicineSchema(**raw_payload)
                return validated_model.model_dump()
                
            elif response.status_code == 404:
                return {"status": "Not Found", "message": "No matching medicine entries found."}
            else:
                return {"status": "Failed", "code": response.status_code}
                
        except Exception as e:
            return {"status": "Error", "message": str(e)}

