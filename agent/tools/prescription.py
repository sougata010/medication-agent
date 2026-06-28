import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from schema.precription import PrescriptionDossier

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Google API key not found")

class PrescriptionReader:
    def __init__(self):
        self.model = "gemini-3.5-flash"
        self.config = {
            "temperature": 0.2,
            "max_retries": 2,
        }
        self.system_prompt = (
            "You are an expert clinical informatics assistant specializing in prescription layout extraction. "
            "Your task is to analyze highly messy, fragmented OCR text captured from handwritten medical notes. "
            "Map ambiguous typos to standard medical terminology using structural reasoning (e.g., '15g' is likely '150mg', '0/345' is likely '10/325'). "
            "Strictly evaluate confidence levels for every single compound entry."
        )

    def model_call(self, text: str) -> PrescriptionDossier:
        base_model = ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=api_key,
            **self.config
        )
        structured_model = base_model.with_structured_output(PrescriptionDossier)
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=f"Extract structured prescription parameters from this text block:\n{text}")
        ]
        try:
            dossier = structured_model.invoke(messages)
            return dossier
        except Exception as e:
            print(f"LLM Extraction Failed: {str(e)}")
            return PrescriptionDossier(medications=[])
