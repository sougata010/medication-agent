import os
import httpx
from schema.checker import SafetyEvaluation
from typing import List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Google API key missing from environment configurations.")

class LiveSafetyChecker:
    def __init__(self):
        self.base_url = "https://api.fda.gov/drug/label.json"
        self.model = "gemini-3.0-flash"
    def cross_reference_safety(self, drug_name: str, active_list: List[str], allergies: List[str]) -> SafetyEvaluation:
        search_drug = drug_name.strip().lower()
        query_url = f"{self.base_url}?search=(openfda.brand_name:\"{search_drug}\"+openfda.generic_name:\"{search_drug}\")&limit=1"
        try:
            response = httpx.get(query_url, timeout=10.0)
            if response.status_code != 200:
                return SafetyEvaluation(
                    drug_name=drug_name,
                    interaction_found=False,
                    contraindication_found=False,
                    evidence_extracted=f"API Notice: openFDA returned status {response.status_code}. Bypassing check."
                )
            data = response.json()
            results = data.get("results", [])
            if not results:
                return SafetyEvaluation(
                    drug_name=drug_name,
                    interaction_found=False,
                    contraindication_found=False,
                    evidence_extracted="No matching FDA labeling record found for live cross-referencing."
                )
            label_record = results[0]
            interaction_blob = " ".join(label_record.get("drug_interactions", ["Not listed."]))
            contra_blob = " ".join(label_record.get("contraindications", ["Not listed."]))
            warnings_blob = " ".join(label_record.get("warnings_and_cautions", ["Not listed."]))
        except Exception as e:
            return SafetyEvaluation(
                drug_name=drug_name,
                interaction_found=False,
                contraindication_found=False,
                evidence_extracted=f"Network Processing failure: {str(e)}"
            )
        llm = ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=api_key,
            temperature=0.2
        )
        structured_llm = llm.with_structured_output(SafetyEvaluation)
        system_prompt = (
            "You are a clinical pharmacologist graph node. Analyze raw FDA drug labels "
            "and determine if the Target Drug has cross-conflicts. "
            "You must map clinical medical terms to common drug profiles (e.g., matching 'acetylsalicylic acid' to 'Aspirin' "
            "or knowing 'NSAIDs' covers 'Ibuprofen'). Fill out the requested structured fields cleanly."
        )

        human_prompt = f"""Target Drug being evaluated: {drug_name}
                Patient Current Active Medicines: {active_list}
                Patient Known Allergies: {allergies}

                --- LIVE FDA REGULATORY TEXT RECIEVED ---
                [Drug Interactions Text]:
                {interaction_blob}

                [Contraindications Text]:
                {contra_blob}

                [Warnings and Cautions Text]:
                {warnings_blob}"""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]

        try:
            evaluation = structured_llm.invoke(messages)
            evaluation.drug_name = drug_name
            return evaluation
        except Exception as e:
            return SafetyEvaluation(
                drug_name=drug_name,
                interaction_found=False,
                contraindication_found=False,
                evidence_extracted=f"LLM Reasoning Framework exception: {str(e)}"
            )

if __name__ == "__main__":
    checker = LiveSafetyChecker()
    print("--- 🔬 Testing Live openFDA Safety Interaction Node 🔬 ---\n")
    
    test_drug = "Ibuprofen"
    current_meds = ["Aspirin", "Metformin"]
    patient_allergies = ["NSAIDs"]
    
    result = checker.cross_reference_safety(test_drug, current_meds, patient_allergies)
    
    print(f"Evaluating: {test_drug}")
    print(f"  * Interaction Flag:      {result.interaction_found}")
    print(f"  * Contraindication Flag: {result.contraindication_found}")
    print(f"  * Live Evidence Summary: {result.evidence_extracted}")