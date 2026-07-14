import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from schema.classifier import RouterDecision
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

class InputClassifier:
    def __init__(self):
        self.model = "gemini-3.0-flash"
        self.system_prompt = (
            "You are the central triage router for MedGraph AI. Your sole job is to classify raw user inputs "
            "and determine which downstream specialist agent node should handle the request. Analyze the input carefully."
        )

    def classify(self, user_input: str) -> RouterDecision:
        base_model = ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=api_key,
            temperature=0.0
        )
        # Force the model to output our exact routing schema layout
        structured_model = base_model.with_structured_output(RouterDecision)
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=f"Classify this user input for routing:\n{user_input}")
        ]
        
        try:
            return structured_model.invoke(messages)
        except Exception as e:
            # Safe default fallback configuration vector
            return RouterDecision(next_node="general_query", rationale=f"Error encountered: {str(e)}")

