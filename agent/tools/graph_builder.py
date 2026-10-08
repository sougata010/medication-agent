import re
import os
import json
import httpx
from typing import List, Dict, Any, Optional

# Knowledge mapping rules for common drugs to build instant high-quality graph connections
KNOWN_KNOWLEDGE_RULES = {
    "warfarin": {
        "treats": ["Atrial Fibrillation", "Deep Vein Thrombosis", "Stroke Prevention"],
        "labs": ["INR (International Normalized Ratio)", "PT (Prothrombin Time)"],
        "side_effects": ["Bleeding Risk", "Easy Bruising"],
        "foods": ["Vitamin K Foods (Spinach, Kale)", "Cranberry Juice"],
        "interactions": {
            "ibuprofen": {"severity": "high", "desc": "Significantly increases gastrointestinal bleeding risk."},
            "aspirin": {"severity": "high", "desc": "Enhanced anticoagulant effect, major bleeding risk."},
            "amiodarone": {"severity": "high", "desc": "Increases Warfarin plasma concentration."}
        }
    },
    "ibuprofen": {
        "treats": ["Pain", "Inflammation", "Arthritis", "Fever"],
        "labs": ["Serum Creatinine", "eGFR", "AST/ALT (Liver Enzymes)"],
        "side_effects": ["Stomach Upset", "GI Ulceration", "Fluid Retention"],
        "foods": ["Take with Food/Milk"],
        "interactions": {
            "warfarin": {"severity": "high", "desc": "Significantly increases gastrointestinal bleeding risk."},
            "lisinopril": {"severity": "moderate", "desc": "May reduce antihypertensive effect & impair renal function."}
        }
    },
    "metformin": {
        "treats": ["Type 2 Diabetes", "Insulin Resistance"],
        "labs": ["HbA1c", "Fasting Blood Glucose", "eGFR", "Vitamin B12"],
        "side_effects": ["Gastrointestinal Distress", "Nausea", "Lactic Acidosis (rare)"],
        "foods": ["Avoid Excessive Alcohol"],
        "interactions": {
            "contrast_dye": {"severity": "high", "desc": "Risk of acute renal failure & lactic acidosis."}
        }
    },
    "lisinopril": {
        "treats": ["Hypertension", "Heart Failure"],
        "labs": ["Serum Potassium", "Serum Creatinine", "eGFR"],
        "side_effects": ["Dry Cough", "Dizziness", "Hyperkalemia"],
        "foods": ["Potassium Supplements / Salt Substitutes"],
        "interactions": {
            "spironolactone": {"severity": "high", "desc": "Increased risk of severe hyperkalemia."},
            "ibuprofen": {"severity": "moderate", "desc": "NSAIDs may diminish antihypertensive efficacy."}
        }
    },
    "atorvastatin": {
        "treats": ["Hyperlipidemia", "Cardiovascular Disease"],
        "labs": ["LDL Cholesterol", "Total Cholesterol", "ALT/AST (Liver Enzymes)"],
        "side_effects": ["Muscle Aches (Myalgia)", "Elevated Liver Enzymes"],
        "foods": ["Grapefruit / Grapefruit Juice"],
        "interactions": {
            "clarithromycin": {"severity": "high", "desc": "Increases statin concentration & rhabdomyolysis risk."}
        }
    },
    "levothyroxine": {
        "treats": ["Hypothyroidism"],
        "labs": ["TSH (Thyroid Stimulating Hormone)", "Free T4"],
        "side_effects": ["Palpitations", "Insomnia", "Weight Loss"],
        "foods": ["Calcium/Iron Supplements (Take 4h apart)", "Coffee (Take 30-60 min before)"],
        "interactions": {
            "calcium_carbonate": {"severity": "moderate", "desc": "Binds levothyroxine in gut, reducing absorption."}
        }
    },
    "amlodipine": {
        "treats": ["Hypertension", "Angina"],
        "labs": ["Blood Pressure", "Heart Rate"],
        "side_effects": ["Peripheral Edema (Swollen Ankles)", "Flushing", "Dizziness"],
        "foods": ["Grapefruit Juice"],
        "interactions": {
            "simvastatin": {"severity": "moderate", "desc": "Increases simvastatin levels (max dose 20mg)."}
        }
    }
}

def sanitize_id(text: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_]', '_', text.strip().lower())

def fetch_openfda_knowledge(drug_name: str) -> Optional[Dict[str, Any]]:
    """Dynamically fetches OpenFDA drug label data for drugs not in the static map."""
    search_term = drug_name.strip().split()[0].lower()
    url = f"https://api.fda.gov/drug/label.json?search=(openfda.brand_name:\"{search_term}\"+openfda.generic_name:\"{search_term}\")&limit=1"
    try:
        resp = httpx.get(url, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results:
                rec = results[0]
                indications = rec.get("indications_and_usage", ["Not specified"])
                adverse = rec.get("adverse_reactions", ["Not specified"])
                warnings = rec.get("warnings_and_cautions", ["Not specified"])
                
                treats_summary = indications[0][:80] if indications else "General indication"
                side_summary = adverse[0][:80] if adverse else "General side effect risk"
                
                return {
                    "treats": [treats_summary],
                    "labs": ["Blood Profile", "Metabolic Panel"],
                    "side_effects": [side_summary],
                    "foods": ["Follow Standard Prescription Instructions"],
                    "interactions": {}
                }
    except Exception as e:
        print(f"OpenFDA dynamic fetch notice for {drug_name}: {e}")
    return None

def build_patient_knowledge_graph(
    active_medications: List[str],
    conditions: List[str],
    allergies: List[str],
    lab_results: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Builds a nodes and edges dataset representing the patient's personalized health graph.
    """
    nodes_dict: Dict[str, Dict[str, Any]] = {}
    edges_list: List[Dict[str, Any]] = []

    # Process Medications
    parsed_meds = []
    for med_raw in active_medications:
        if not med_raw or not med_raw.strip():
            continue
        clean_name = med_raw.strip()
        med_key = clean_name.split()[0].lower()
        med_id = f"med_{sanitize_id(clean_name)}"
        
        parsed_meds.append({"raw": clean_name, "key": med_key, "id": med_id})
        
        nodes_dict[med_id] = {
            "id": med_id,
            "label": clean_name,
            "category": "medication",
            "type": "Medication",
            "details": {
                "raw_name": clean_name,
                "status": "Active Regimen",
                "notes": f"Prescribed active medication: {clean_name}"
            }
        }

    # Process Conditions
    for cond_raw in conditions:
        if not cond_raw or not cond_raw.strip():
            continue
        clean_cond = cond_raw.strip()
        cond_id = f"cond_{sanitize_id(clean_cond)}"
        
        nodes_dict[cond_id] = {
            "id": cond_id,
            "label": clean_cond,
            "category": "condition",
            "type": "Health Condition",
            "details": {
                "name": clean_cond,
                "status": "Active Diagnosis"
            }
        }

    # Process Allergies
    for allergy_raw in allergies:
        if not allergy_raw or not allergy_raw.strip():
            continue
        clean_allergy = allergy_raw.strip()
        alg_id = f"alg_{sanitize_id(clean_allergy)}"
        
        nodes_dict[alg_id] = {
            "id": alg_id,
            "label": f"Allergy: {clean_allergy}",
            "category": "allergy",
            "type": "Allergy",
            "details": {
                "allergen": clean_allergy,
                "severity": "High Warning"
            }
        }

    # Process Labs if provided
    if lab_results:
        for lab in lab_results:
            lab_name = lab.get("name", "Lab Test")
            lab_value = lab.get("value", "")
            lab_id = f"lab_{sanitize_id(lab_name)}"
            nodes_dict[lab_id] = {
                "id": lab_id,
                "label": f"{lab_name}: {lab_value}" if lab_value else lab_name,
                "category": "lab",
                "type": "Lab Result",
                "details": {
                    "analyte": lab_name,
                    "value": lab_value,
                    "unit": lab.get("unit", ""),
                    "status": lab.get("status", "Recorded")
                }
            }

    # Build Relationships & Knowledge Enrichment
    for i, med in enumerate(parsed_meds):
        m_key = med["key"]
        m_id = med["id"]
        
        # Check rule knowledge base or fetch OpenFDA dynamically
        rule_data = KNOWN_KNOWLEDGE_RULES.get(m_key) or fetch_openfda_knowledge(med["raw"])
        
        if rule_data:
            # Treats conditions
            for cond in rule_data.get("treats", []):
                cond_id = f"cond_{sanitize_id(cond)}"
                if cond_id not in nodes_dict:
                    nodes_dict[cond_id] = {
                        "id": cond_id,
                        "label": cond,
                        "category": "condition",
                        "type": "Health Condition",
                        "details": {"name": cond, "status": "Indication"}
                    }
                edges_list.append({
                    "id": f"{m_id}_treats_{cond_id}",
                    "source": m_id,
                    "target": cond_id,
                    "relationship": "TREATS",
                    "label": "Treats",
                    "severity": "info",
                    "description": f"{med['raw']} is indicated for the treatment of {cond}."
                })
            
            # Monitored by Labs
            for lab_name in rule_data.get("labs", []):
                lab_id = f"lab_{sanitize_id(lab_name)}"
                if lab_id not in nodes_dict:
                    nodes_dict[lab_id] = {
                        "id": lab_id,
                        "label": lab_name,
                        "category": "lab",
                        "type": "Lab Marker",
                        "details": {"analyte": lab_name, "purpose": "Monitoring parameter"}
                    }
                edges_list.append({
                    "id": f"{m_id}_monitored_by_{lab_id}",
                    "source": m_id,
                    "target": lab_id,
                    "relationship": "MONITORED_BY",
                    "label": "Monitored By",
                    "severity": "info",
                    "description": f"{med['raw']} efficacy and toxicity require monitoring via {lab_name}."
                })

            # Side effects
            for se in rule_data.get("side_effects", []):
                se_id = f"se_{sanitize_id(se)}"
                if se_id not in nodes_dict:
                    nodes_dict[se_id] = {
                        "id": se_id,
                        "label": se,
                        "category": "side_effect",
                        "type": "Side Effect",
                        "details": {"effect": se}
                    }
                edges_list.append({
                    "id": f"{m_id}_causes_{se_id}",
                    "source": m_id,
                    "target": se_id,
                    "relationship": "CAUSES",
                    "label": "Risk Of",
                    "severity": "moderate",
                    "description": f"{med['raw']} is reported to cause potential side effect: {se}."
                })

            # Foods
            for food in rule_data.get("foods", []):
                food_id = f"food_{sanitize_id(food)}"
                if food_id not in nodes_dict:
                    nodes_dict[food_id] = {
                        "id": food_id,
                        "label": food,
                        "category": "food",
                        "type": "Dietary Interaction",
                        "details": {"dietary_item": food}
                    }
                edges_list.append({
                    "id": f"{m_id}_food_{food_id}",
                    "source": m_id,
                    "target": food_id,
                    "relationship": "FOOD_WARNING",
                    "label": "Dietary Caution",
                    "severity": "moderate",
                    "description": f"Caution when taking {med['raw']} with {food}."
                })

        # Drug-Drug Interaction Checking across active regimen
        for j in range(i + 1, len(parsed_meds)):
            other_med = parsed_meds[j]
            o_key = other_med["key"]
            o_id = other_med["id"]
            
            # Check pairwise interaction rules
            if rule_data and "interactions" in rule_data and o_key in rule_data["interactions"]:
                inter = rule_data["interactions"][o_key]
                edges_list.append({
                    "id": f"{m_id}_interacts_{o_id}",
                    "source": m_id,
                    "target": o_id,
                    "relationship": "INTERACTS_WITH",
                    "label": "Drug Interaction",
                    "severity": inter.get("severity", "high"),
                    "description": inter.get("desc", f"Interaction between {med['raw']} and {other_med['raw']}.")
                })
            elif o_key in KNOWN_KNOWLEDGE_RULES and "interactions" in KNOWN_KNOWLEDGE_RULES[o_key] and m_key in KNOWN_KNOWLEDGE_RULES[o_key]["interactions"]:
                inter = KNOWN_KNOWLEDGE_RULES[o_key]["interactions"][m_key]
                edges_list.append({
                    "id": f"{o_id}_interacts_{m_id}",
                    "source": o_id,
                    "target": m_id,
                    "relationship": "INTERACTS_WITH",
                    "label": "Drug Interaction",
                    "severity": inter.get("severity", "high"),
                    "description": inter.get("desc", f"Interaction between {other_med['raw']} and {med['raw']}.")
                })

    nodes_list = list(nodes_dict.values())
    return {
        "nodes": nodes_list,
        "edges": edges_list,
        "summary": {
            "total_nodes": len(nodes_list),
            "total_edges": len(edges_list),
            "high_severity_interactions": len([e for e in edges_list if e.get("severity") == "high"])
        }
    }
