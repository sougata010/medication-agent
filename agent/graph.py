import os
import sys
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY")

def get_model_name() -> str:
    m = os.getenv("GEMINI_MODEL") or os.getenv("MODEL_NAME") or "gemini-3.1-flash-lite"
    if m in ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-2.5-flash-lite"]:
        return "gemini-3.1-flash-lite"
    return m

# Ensure subfolders are in sys.path
agent_dir = os.path.dirname(os.path.abspath(__file__))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)

from agent.tools.classifier import InputClassifier
from agent.tools.medicine import MedicineLookupTool
from agent.tools.chemical import ChemicalProfilingTool
from agent.tools.checker import LiveSafetyChecker
from agent.tools.internet import TavilySearcher
from agent.tools.prescription import PrescriptionReader

class AgentState(TypedDict):
    user_id: int
    session_id: str
    message: str
    context: Dict[str, Any]       # allergies, conditions, pregnancy_status, active_medications
    history: List[Dict[str, str]]  # role, content
    route: str                    # next_node: general_query, prescription_upload, lab_report
    ocr_raw: Optional[str]
    ocr_parsed_meds: List[Dict[str, Any]]
    raw_response: str
    citations: List[str]
    is_emergency: bool
    emergency_warning: str
    final_response: str

def extract_text(content: Any) -> str:
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict) and "text" in c:
                parts.append(str(c["text"]))
            else:
                parts.append(str(c))
        return " ".join(parts).strip()
    return str(content).strip()

# 1. Classification Node
def route_input(state: AgentState) -> Dict[str, Any]:
    classifier = InputClassifier()
    decision = classifier.classify(state["message"])
    return {"route": decision.next_node}

# 2. General Query Node
def handle_general_query(state: AgentState) -> Dict[str, Any]:
    query_text = state["message"]
    context = state["context"] or {}
    allergies = context.get("allergies", [])
    active_meds = context.get("active_medications", [])
    pregnancy = context.get("pregnancy_status", False)
    
    # Identify target drug from query using heuristics first, saving LLM quota
    drug_name = "None"
    lower_query = query_text.lower()
    
    if "my med" in lower_query or "my prescription" in lower_query or "my drug" in lower_query:
        if active_meds:
            drug_name = active_meds[0].split()[0]
    else:
        for med in active_meds:
            m_first = med.split()[0].lower()
            if len(m_first) > 2 and m_first in lower_query:
                drug_name = med.split()[0]
                break

    if drug_name == "None":
        import re
        match = re.search(r'(?:what\s+is|tell\s+me\s+about|price\s+of|cost\s+of|info\s+on|about|dosage\s+for|can\s+i\s+take)\s+([A-Za-z0-9\-]+)', query_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            if candidate.lower() not in ["the", "my", "this", "a", "an", "some", "any", "medicines", "medication", "drugs", "pharmacy"]:
                drug_name = candidate

    # Fall back to LLM extraction only if heuristic did not match
    if drug_name == "None":
        try:
            model_name = get_model_name()
            llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.0, max_retries=1)
            msg = [
                SystemMessage(content="You are a clinical pharmacologist helper. Identify the name of the main drug/medication being asked about in the query. Return ONLY the single drug name. If no specific drug is found, return 'None'."),
                HumanMessage(content=query_text)
            ]
            response_content = llm.invoke(msg).content
            drug_name = extract_text(response_content)
        except Exception:
            drug_name = "None"
        
    citations = []
    med_details = ""
    chem_details = ""
    safety_details = ""
    web_details = ""
    
    if drug_name != "None" and len(drug_name) > 1:
        # Fetch OpenFDA Details
        try:
            med_tool = MedicineLookupTool()
            fda_data = med_tool.med_search(med_brand=drug_name)
            if fda_data.get("status") == "Success":
                med_info = fda_data["message"]
                med_details = f = f"Medicine: {med_info['brand_name']} (Generic: {', '.join(med_info['generic_names'])}). Manufacturer: {med_info['manufacturer']}. Form: {med_info['form']}."
                citations.append("OpenFDA Drug Registry")
            else:
                med_details = f"Medicine search for '{drug_name}' returned no FDA records."
        except Exception as e:
            med_details = f"FDA API query failed: {str(e)}"
            
        # Fetch PubChem & dailyMed properties
        try:
            chem_tool = ChemicalProfilingTool()
            chem_dossier = chem_tool.generate_comprehensive_dossier(drug_name)
            chem_details = (
                f"SMILES Structure: {chem_dossier['structural_framework']['smiles'] or 'Unknown'}. "
                f"Warnings: {chem_dossier['clinical_guidelines']['warnings'] or 'N/A'}. "
                f"Genomic interaction: {', '.join([g['gene_symbol'] + ' (' + g['interaction_action'] + ')' for g in chem_dossier['genomic_interactions']])}."
            )
            citations.append("PubChem Molecular DB")
            citations.append("dailyMed Safety Guidelines")
        except Exception as e:
            chem_details = f"Chemical profiling failed: {str(e)}"
            
        # Check drug interactions
        if active_meds or allergies:
            try:
                safety_checker = LiveSafetyChecker()
                eval_res = safety_checker.cross_reference_safety(drug_name, active_meds, allergies)
                safety_details = (
                    f"Allergy conflicts: {'Found' if eval_res.contraindication_found else 'None found'}. "
                    f"Drug interactions: {'Found conflicts' if eval_res.interaction_found else 'None detected'}. "
                    f"Evidence: {eval_res.evidence_extracted}."
                )
                citations.append("openFDA Drug Interaction API")
            except Exception as e:
                safety_details = f"Interaction checker error: {str(e)}"
                
        # Internet search for recent recalls/warnings
        try:
            searcher = TavilySearcher()
            web_res = searcher.search_query(f"{drug_name} safety warning recall 2025 2026")
            if web_res.search_res:
                web_details = f"Recent news/advisory: {web_res.search_res[0]['content']}"
                citations.append(f"Web Search: {web_res.search_res[0]['title']}")
        except Exception:
            pass

    system_prompt = (
        "You are the central MedGraph AI Agent. Synthesize a professional, plain-language summary answering the user's question.\n"
        "Integrate the retrieved FDA data, chemical properties, safety reports, and search results to construct a complete, structured answer.\n"
        "State the generic name, mechanism, dosage constraints, common warnings, and interaction safety flags clearly.\n"
        "Cite the sources in brackets (e.g. [OpenFDA Drug Registry]). Do NOT write a diagnosis or tell the patient to change dosage.\n\n"
        "RAG CAPABILITIES:\n"
        "If the user asks general questions about their health data (e.g., 'what are my medications?', 'what are my allergies?'), "
        "read the provided Patient Allergies and Active Medications lists below, and detail them fully in your response. "
        "Do NOT brush them off. Answer fully and comprehensively based on the context provided.\n\n"
        "PHARMACY PRICING & BUYING:\n"
        "If the user asks about prices, purchasing, discounts, buying medicines, or finding pharmacies, inform them that live retail and generic pricing across Tata 1mg, Apollo Pharmacy, Netmeds, and PharmEasy is available directly in their integrated Pharmacy Hub. Include [ACTION: NAVIGATE:/dashboard/pharmacies] at the end.\n\n"
        "UI CONTROL:\n"
        "You have the power to control the user's application UI by outputting hidden commands in your text. The frontend will intercept these and display a clickable button for the user.\n"
        "To suggest navigating to a specific page, include this exact string anywhere in your response: [ACTION: NAVIGATE:/path]\n"
        "Available paths: /dashboard, /dashboard/medications, /dashboard/reports, /dashboard/reminders, /dashboard/pharmacies\n"
        "IMPORTANT: ONLY output this command if you are strongly recommending they check a specific page (e.g., to view full lab reports or add a new medication). Provide the full answer FIRST, and add the command at the very end.\n"
    )
    
    human_prompt = f"""User Question: {query_text}
Patient Allergies: {allergies}
Patient Active Medications: {active_meds}
Is Pregnant: {pregnancy}

--- RETRIEVED PHARMACOLOGICAL DETAILS ---
[FDA registry]: {med_details}
[Chemical properties]: {chem_details}
[Interaction checks]: {safety_details}
[Live news]: {web_details}"""

    model_name = get_model_name()
    llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.2, max_retries=1)

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ]
    
    try:
        response_content = llm.invoke(messages).content
        synth_res = extract_text(response_content)
    except Exception as e:
        print(f"Synthesis LLM call failed or rate-limited ({e}). Generating structured clinical response from context.")
        parts = []
        if "price" in query_text.lower() or "cost" in query_text.lower() or "buy" in query_text.lower():
            if active_meds:
                parts.append("### Live Pharmacy & Price Options for Your Medications\n")
                parts.append(f"Your active prescriptions: **{', '.join(active_meds)}**.\n")
                parts.append("You can compare live verified prices, check discounts, and bundle your orders across **Tata 1mg, Apollo Pharmacy, Netmeds, and PharmEasy** directly in the Pharmacy Hub:")
                parts.append("[ACTION: NAVIGATE:/dashboard/pharmacies]")
            else:
                parts.append("To check live prices and order medications from certified pharmacies (Tata 1mg, Apollo, Netmeds, PharmEasy), explore the [Pharmacy Hub] [ACTION: NAVIGATE:/dashboard/pharmacies].")
        elif "my med" in query_text.lower() or "my prescription" in query_text.lower():
            if active_meds:
                parts.append("### Your Active Medications\n")
                for m in active_meds:
                    parts.append(f"- **{m}**")
                parts.append("\nYou can view interactions, schedules, and refill reminders in [My Medications] [ACTION: NAVIGATE:/dashboard/medications] or view live pricing in [Pharmacy Hub] [ACTION: NAVIGATE:/dashboard/pharmacies].")
            else:
                parts.append("You do not currently have any active medications logged in your profile. You can log them or scan a prescription in [My Medications] [ACTION: NAVIGATE:/dashboard/medications].")
        else:
            if drug_name and drug_name != "None":
                parts.append(f"### Clinical Summary for {drug_name.title()}\n")
                if med_details and "returned no FDA" not in med_details:
                    parts.append(f"- **FDA Details:** {med_details}")
                if chem_details:
                    parts.append(f"- **Molecular Properties:** {chem_details}")
                if safety_details:
                    parts.append(f"- **Safety & Interactions:** {safety_details}")
                if web_details:
                    parts.append(f"- **Live Updates:** {web_details}")
                parts.append(f"\nTo view live prices and delivery options across certified pharmacies (Tata 1mg, Apollo, Netmeds), visit the [Pharmacy Hub] [ACTION: NAVIGATE:/dashboard/pharmacies?search={drug_name.replace(' ', '+')}].")
            else:
                parts.append(f"I received your inquiry regarding *'{query_text}'*.")
                if active_meds:
                    parts.append(f"\nYour recorded active medications are: {', '.join(active_meds)}.")
                if allergies:
                    parts.append(f"\nKnown allergy profile: {', '.join(allergies)}.")
                parts.append("\nPlease consult your healthcare provider before adjusting dosages or introducing new therapies.")

        synth_res = "\n".join(parts)
        
    return {
        "raw_response": synth_res,
        "citations": citations if citations else ["General Medical Disclaimer"]
    }

# 3. Prescription Upload Node
def handle_prescription_upload(state: AgentState) -> Dict[str, Any]:
    ocr_text = state["ocr_raw"] or state["message"]
    reader = PrescriptionReader()
    dossier = reader.model_call(ocr_text)
    
    meds_list = []
    for med in dossier.medications:
        meds_list.append({
            "drugName": med.drug_name,
            "dosage": med.dosage,
            "frequency": med.frequency,
            "duration": med.duration,
            "confidenceLevel": med.confidence_level,
            "clinicalReasoning": med.clinical_reasoning
        })
        
    return {
        "ocr_parsed_meds": meds_list,
        "raw_response": f"Successfully parsed prescription containing {len(meds_list)} medications."
    }

# 4. Lab Report Node
def handle_lab_report(state: AgentState) -> Dict[str, Any]:
    ocr_text = state["ocr_raw"] or state["message"]
    model_name = get_model_name()
    llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.0, max_retries=1)
    
    msg = [
        SystemMessage(content="You are a clinical lab technician. Extract all lab parameters, their numerical values, reference ranges, and units. Format them as a clean, readable text list. Suggest if the parameters are normal or abnormal based on standard reference bounds."),
        HumanMessage(content=f"Normalize and extract parameters from this lab text:\n{ocr_text}")
    ]
    try:
        response_content = llm.invoke(msg).content
        ans = extract_text(response_content)
    except Exception as e:
        ans = f"Failed to extract lab report: {str(e)}"
        
    return {
        "raw_response": ans,
        "citations": ["Uploaded Lab Report"]
    }

# 5. Safety Layer Node (Interceptor)
def intercept_safety(state: AgentState) -> Dict[str, Any]:
    raw_ans = state["raw_response"] or ""
    user_query = state["message"].lower()
    
    # Emergency Keyword short-circuiting
    emergency_keywords = [
        "chest pain", "tightness in chest", "severe head ache", 
        "stroke", "numbness", "difficulty breathing", "anaphylaxis", 
        "throat swelling", "suicidal", "self-harm", "overdose"
    ]
    
    is_emergency = any(kw in user_query for kw in emergency_keywords)
    
    if is_emergency:
        emergency_warning = (
            "⚠️ CRITICAL MEDICAL ALERT: The symptoms or query you provided could indicate a severe, "
            "life-threatening emergency (e.g. cardiac arrest, stroke, anaphylaxis, or acute overdose).\n"
            "Please IMMEDIATELY call emergency services (like 911 or your local health dispatch line) or "
            "proceed to the nearest hospital emergency room. Do NOT wait, and do NOT attempt to self-medicate."
        )
        return {
            "final_response": emergency_warning,
            "is_emergency": True,
            "emergency_warning": "Emergency keywords detected in user input."
        }
    
    # Sanitizer/Disclaimers for standard queries
    disclaimer = (
        "\n\n*Disclaimer: MedGraph AI provides information sourced from official pharmaceutical databases. "
        "It does NOT offer medical diagnoses or prescribe treatment plans. Always consult your doctor or "
        "pharmacist before starting, stopping, or altering your medication regimen.*"
    )
    
    # Enforce safe output standards (block implicit diagnoses)
    sanitized = raw_ans
    if "diagnose" in sanitized.lower() or "suffer from" in sanitized.lower():
        # Replace clinical assertions
        sanitized = sanitized.replace("You suffer from", "Your symptoms are matching parameters indicating")
        
    return {
        "final_response": sanitized + disclaimer,
        "is_emergency": False,
        "emergency_warning": ""
    }

# Compile Graph
workflow = StateGraph(AgentState)

workflow.add_node("classifier", route_input)
workflow.add_node("general_query", handle_general_query)
workflow.add_node("prescription_upload", handle_prescription_upload)
workflow.add_node("lab_report", handle_lab_report)
workflow.add_node("safety_layer", intercept_safety)

# Set classification as entry
workflow.set_entry_point("classifier")

# Define conditional transitions from classification node
def make_routing_decision(state: AgentState) -> str:
    route = state["route"]
    if route == "prescription_upload":
        return "prescription_upload"
    elif route == "lab_report":
        return "lab_report"
    else:
        return "general_query"

workflow.add_conditional_edges(
    "classifier",
    make_routing_decision,
    {
        "general_query": "general_query",
        "prescription_upload": "prescription_upload",
        "lab_report": "lab_report"
    }
)

# Connect everything into safety layer
workflow.add_edge("general_query", "safety_layer")
workflow.add_edge("prescription_upload", "safety_layer")
workflow.add_edge("lab_report", "safety_layer")
workflow.add_edge("safety_layer", END)

# Compile
compiled_graph = workflow.compile()

def run_agent(user_id: int, message: str, context: dict, history: list, ocr_raw: str = None) -> dict:
    initial_state = {
        "user_id": user_id,
        "session_id": "",
        "message": message,
        "context": context,
        "history": history,
        "route": "general_query",
        "ocr_raw": ocr_raw,
        "ocr_parsed_meds": [],
        "raw_response": "",
        "citations": [],
        "is_emergency": False,
        "emergency_warning": "",
        "final_response": ""
    }
    
    result = compiled_graph.invoke(initial_state)
    return {
        "response_text": result["final_response"],
        "safety_alert": {
            "is_emergency": result["is_emergency"],
            "warning_details": result["emergency_warning"]
        },
        "citations": result["citations"],
        "medications": result["ocr_parsed_meds"]
    }
