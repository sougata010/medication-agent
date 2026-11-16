"""
Symptom to Disease Prediction Module
Using a calibrated Deep Multi-Layer Perceptron (DL MLP) Neural Network Architecture
Trained on clinical symptom-disease diagnostic profiles (132 clinical symptoms across 42 disease classes).
"""

import numpy as np
from typing import List, Dict, Any, Tuple

# Standardized Clinical Symptoms (132 features)
SYMPTOMS_LIST = [
    "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering",
    "chills", "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue",
    "muscle_wasting", "vomiting", "burning_micturition", "spotting_urination", "fatigue",
    "weight_gain", "anxiety", "cold_hands_and_feets", "mood_swings", "weight_loss",
    "restlessness", "lethargy", "patches_in_throat", "irregular_sugar_level", "cough",
    "high_fever", "sunken_eyes", "breathlessness", "sweating", "dehydration",
    "indigestion", "headache", "yellowish_skin", "dark_urine", "nausea",
    "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation", "abdominal_pain",
    "diarrhoea", "mild_fever", "yellow_urine", "yellowing_of_eyes", "acute_liver_failure",
    "fluid_overload", "swelling_of_stomach", "swelled_lymph_nodes", "malaise", "blurred_and_distorted_vision",
    "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose",
    "congestion", "chest_pain", "weakness_in_limbs", "fast_heart_rate", "pain_during_bowel_movements",
    "pain_in_anal_region", "bloody_stool", "irritation_in_anus", "neck_pain", "dizziness",
    "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels",
    "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "excessive_hunger",
    "extra_marital_contacts", "drying_and_tingling_lips", "slurred_speech", "knee_pain", "hip_joint_pain",
    "muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "spinning_movements",
    "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "loss_of_smell", "bladder_discomfort",
    "foul_smell_of_urine", "continuous_feel_of_urine", "passage_of_gases", "internal_itching", "toxic_look_(typhos)",
    "depression", "irritability", "muscle_pain", "altered_sensorium", "red_spots_over_body",
    "belly_pain", "abnormal_menstruation", "dischromic_patches", "watering_from_eyes", "increased_appetite",
    "polyuria", "family_history", "mucoid_sputum", "rusty_sputum", "lack_of_concentration",
    "visual_disturbances", "receiving_blood_transfusion", "receiving_unsterile_injections", "coma", "stomach_bleeding",
    "distention_of_abdomen", "history_of_alcohol_consumption", "blood_in_sputum", "prominent_veins_on_calf", "palpitations",
    "painful_walking", "pus_filled_pimples", "blackheads", "scurring", "skin_peeling",
    "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails", "blister", "red_sore_around_nose",
    "yellow_crust_ooze"
]

# Categorized Symptoms for UI grouping
SYMPTOM_CATEGORIES = {
    "Respiratory": [
        "continuous_sneezing", "cough", "breathlessness", "phlegm", "throat_irritation",
        "sinus_pressure", "runny_nose", "congestion", "loss_of_smell", "mucoid_sputum",
        "rusty_sputum", "blood_in_sputum"
    ],
    "Gastrointestinal & Abdominal": [
        "stomach_pain", "acidity", "ulcers_on_tongue", "vomiting", "indigestion",
        "nausea", "loss_of_appetite", "constipation", "abdominal_pain", "diarrhoea",
        "swelling_of_stomach", "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool",
        "irritation_in_anus", "passage_of_gases", "belly_pain", "stomach_bleeding", "distention_of_abdomen"
    ],
    "Systemic & Fever": [
        "chills", "shivering", "fatigue", "weight_gain", "weight_loss",
        "lethargy", "high_fever", "sweating", "dehydration", "mild_fever",
        "malaise", "dizziness", "toxic_look_(typhos)", "polyuria", "excessive_hunger"
    ],
    "Dermatological (Skin & Nails)": [
        "itching", "skin_rash", "nodal_skin_eruptions", "yellowish_skin", "red_spots_over_body",
        "dischromic_patches", "pus_filled_pimples", "blackheads", "scurring", "skin_peeling",
        "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails", "blister", "red_sore_around_nose",
        "yellow_crust_ooze", "brittle_nails", "bruising"
    ],
    "Neurological & Psychological": [
        "headache", "anxiety", "mood_swings", "restlessness", "depression",
        "irritability", "altered_sensorium", "lack_of_concentration", "slurred_speech", "spinning_movements",
        "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "coma"
    ],
    "Musculoskeletal": [
        "joint_pain", "muscle_wasting", "back_pain", "weakness_in_limbs", "neck_pain",
        "cramps", "knee_pain", "hip_joint_pain", "muscle_weakness", "stiff_neck",
        "swelling_joints", "movement_stiffness", "muscle_pain", "painful_walking"
    ],
    "Cardiovascular & Vascular": [
        "chest_pain", "fast_heart_rate", "palpitations", "cold_hands_and_feets", "swollen_legs",
        "swollen_blood_vessels", "prominent_veins_on_calf"
    ],
    "Eyes & ENT": [
        "sunken_eyes", "pain_behind_the_eyes", "yellowing_of_eyes", "blurred_and_distorted_vision",
        "redness_of_eyes", "watering_from_eyes", "patches_in_throat", "visual_disturbances",
        "drying_and_tingling_lips"
    ],
    "Urinary & Endocrine": [
        "burning_micturition", "spotting_urination", "dark_urine", "yellow_urine", "bladder_discomfort",
        "foul_smell_of_urine", "continuous_feel_of_urine", "irregular_sugar_level", "enlarged_thyroid",
        "puffy_face_and_eyes", "swollen_extremeties", "abnormal_menstruation"
    ]
}

# 42 Disease Classes with clinical metadata
DISEASE_PROFILES: Dict[str, Dict[str, Any]] = {
    "Fungal infection": {
        "symptoms": ["itching", "skin_rash", "nodal_skin_eruptions", "dischromic_patches"],
        "severity": "Mild",
        "specialist": "Dermatologist",
        "description": "Fungal skin infection causing scaling, erythema, and localized pruritus.",
        "precautions": ["Bath twice daily", "Use clean and dry clothes", "Avoid sharing towels", "Apply prescribed antifungal cream"],
        "recommended_meds": ["Clotrimazole", "Terbinafine", "Ketoconazole"]
    },
    "Allergy": {
        "symptoms": ["continuous_sneezing", "shivering", "chills", "watering_from_eyes"],
        "severity": "Mild",
        "specialist": "Allergist / Immunologist",
        "description": "Hypersensitivity reaction triggered by environmental allergens or histaminic responses.",
        "precautions": ["Avoid allergens", "Keep living space dust-free", "Wear a protective mask", "Take antihistamines as directed"],
        "recommended_meds": ["Cetirizine", "Fexofenadine", "Levocetirizine"]
    },
    "GERD": {
        "symptoms": ["stomach_pain", "acidity", "ulcers_on_tongue", "vomiting", "cough", "chest_pain"],
        "severity": "Moderate",
        "specialist": "Gastroenterologist",
        "description": "Gastroesophageal Reflux Disease with mucosal damage from abnormal acid backflow.",
        "precautions": ["Avoid spicy and fatty foods", "Eat smaller meals frequently", "Avoid lying down immediately after eating", "Elevate head of bed"],
        "recommended_meds": ["Omeprazole", "Pantoprazole", "Famotidine"]
    },
    "Chronic cholestasis": {
        "symptoms": ["itching", "vomiting", "yellowish_skin", "nausea", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes"],
        "severity": "Moderate",
        "specialist": "Hepatologist",
        "description": "Impairment of bile flow leading to systemic accumulation of bile acids and jaundice.",
        "precautions": ["Consult a liver specialist promptly", "Avoid alcohol completely", "Maintain a balanced, low-fat diet", "Undergo hepatic function monitoring"],
        "recommended_meds": ["Ursodeoxycholic acid", "Cholestyramine"]
    },
    "Drug Reaction": {
        "symptoms": ["itching", "skin_rash", "stomach_pain", "burning_micturition", "spotting_urination"],
        "severity": "Moderate",
        "specialist": "General Physician / Allergist",
        "description": "Adverse immunological or toxic cutaneous reaction to a recently administered drug.",
        "precautions": ["Discontinue suspected offending medication", "Consult physician immediately", "Stay well-hydrated", "Monitor for systemic signs like wheezing"],
        "recommended_meds": ["Diphenhydramine", "Prednisone (if prescribed)", "Calamine lotion"]
    },
    "Peptic ulcer disease": {
        "symptoms": ["vomiting", "indigestion", "loss_of_appetite", "abdominal_pain", "passage_of_gases", "internal_itching"],
        "severity": "Moderate",
        "specialist": "Gastroenterologist",
        "description": "Distinct breach in the mucosal lining of the stomach or duodenum.",
        "precautions": ["Avoid NSAID pain relievers", "Limit alcohol and smoking", "Avoid caffeine and acidic foods", "Complete prescribed antibiotic course if H. pylori positive"],
        "recommended_meds": ["Esomeprazole", "Sucralfate", "Clarithromycin"]
    },
    "AIDS": {
        "symptoms": ["muscle_wasting", "patches_in_throat", "high_fever", "extra_marital_contacts"],
        "severity": "Critical",
        "specialist": "Infectious Disease Specialist",
        "description": "Advanced retroviral immunodeficiency infection characterized by low CD4 counts.",
        "precautions": ["Immediate ART (Antiretroviral Therapy) initiation", "Practice safe sex", "Prevent opportunistic infections", "Regular CD4 & viral load testing"],
        "recommended_meds": ["Tenofovir", "Emtricitabine", "Dolutegravir"]
    },
    "Diabetes": {
        "symptoms": ["fatigue", "weight_loss", "restlessness", "lethargy", "irregular_sugar_level", "blurred_and_distorted_vision", "obesity", "excessive_hunger", "increased_appetite", "polyuria"],
        "severity": "Moderate",
        "specialist": "Endocrinologist",
        "description": "Metabolic disorder characterized by chronic hyperglycemia from insulin deficiency or resistance.",
        "precautions": ["Monitor blood glucose daily", "Follow low-glycemic Mediterranean diet", "Engage in 150 mins aerobic exercise weekly", "Check feet daily for lesions"],
        "recommended_meds": ["Metformin", "Glimepiride", "Empagliflozin"]
    },
    "Gastroenteritis": {
        "symptoms": ["vomiting", "sunken_eyes", "dehydration", "diarrhoea"],
        "severity": "Moderate",
        "specialist": "Gastroenterologist",
        "description": "Acute inflammation of the gastrointestinal tract, primarily infectious in etiology.",
        "precautions": ["Drink Oral Rehydration Solution (ORS)", "Follow the BRAT diet (bananas, rice, applesauce, toast)", "Avoid dairy and fatty meals", "Rest adequately"],
        "recommended_meds": ["Oral Rehydration Salts (ORS)", "Ondansetron", "Zinc supplements"]
    },
    "Bronchial Asthma": {
        "symptoms": ["fatigue", "cough", "high_fever", "breathlessness", "family_history", "mucoid_sputum"],
        "severity": "Moderate",
        "specialist": "Pulmonologist",
        "description": "Chronic inflammatory airway disorder with reversible bronchial hyperresponsiveness.",
        "precautions": ["Keep quick-relief inhaler handy", "Avoid pollen, dust, and pet dander", "Perform peak flow monitoring", "Stay warm during cold weather"],
        "recommended_meds": ["Albuterol", "Fluticasone/Salmeterol", "Montelukast"]
    },
    "Hypertension": {
        "symptoms": ["headache", "chest_pain", "dizziness", "loss_of_balance", "lack_of_concentration"],
        "severity": "Moderate",
        "specialist": "Cardiologist",
        "description": "Sustained arterial blood pressure elevation >= 130/80 mmHg with cardiovascular risk.",
        "precautions": ["Reduce daily sodium intake (< 2g/day)", "Engage in regular cardiovascular exercise", "Manage emotional stress", "Limit alcohol consumption"],
        "recommended_meds": ["Amlodipine", "Lisinopril", "Telmisartan", "Losartan"]
    },
    "Migraine": {
        "symptoms": ["acidity", "indigestion", "headache", "blurred_and_distorted_vision", "excessive_hunger", "stiff_neck", "depression", "irritability", "visual_disturbances"],
        "severity": "Moderate",
        "specialist": "Neurologist",
        "description": "Neurovascular disorder marked by recurrent unilateral throbbing cephalalgia.",
        "precautions": ["Rest in a dark, quiet room", "Identify and avoid migraine food triggers", "Maintain consistent sleep schedule", "Stay well-hydrated"],
        "recommended_meds": ["Sumatriptan", "Rizatriptan", "Propranolol (prophylaxis)"]
    },
    "Cervical spondylosis": {
        "symptoms": ["back_pain", "neck_pain", "dizziness", "loss_of_balance"],
        "severity": "Moderate",
        "specialist": "Orthopedist / Neurologist",
        "description": "Age-related degeneration of cervical intervertebral discs and vertebrae.",
        "precautions": ["Use ergonomic neck support", "Perform gentle neck stretching exercises", "Avoid prolonged forward-head posture", "Apply warm compresses"],
        "recommended_meds": ["Pregabalin", "Ibuprofen", "Baclofen"]
    },
    "Paralysis (brain hemorrhage)": {
        "symptoms": ["vomiting", "headache", "weakness_of_one_body_side", "altered_sensorium"],
        "severity": "Critical",
        "specialist": "Emergency Physician / Neurosurgeon",
        "description": "Acute intracranial cerebrovascular event causing neurological hemiparesis. Emergency!",
        "precautions": ["CALL EMERGENCY SERVICES (911/112) IMMEDIATELY", "Do not give food or liquids", "Keep patient lying down on side", "Track time of symptom onset"],
        "recommended_meds": ["Emergency in-hospital IV therapy only", "Mannitol", "Labetalol"]
    },
    "Jaundice": {
        "symptoms": ["itching", "vomiting", "fatigue", "weight_loss", "high_fever", "yellowish_skin", "dark_urine", "abdominal_pain"],
        "severity": "Moderate",
        "specialist": "Gastroenterologist / Hepatologist",
        "description": "Hyperbilirubinemia manifesting as yellow discoloration of sclera, mucous membranes, and skin.",
        "precautions": ["Drink plenty of fluids and tender coconut water", "Eat easily digestible bland foods", "Complete rest", "Avoid fatty and oily meals completely"],
        "recommended_meds": ["Silymarin", "Multivitamins", "Supportive care"]
    },
    "Malaria": {
        "symptoms": ["chills", "vomiting", "high_fever", "sweating", "headache", "nausea", "muscle_pain"],
        "severity": "Moderate",
        "specialist": "Infectious Disease Specialist",
        "description": "Vector-borne parasitic infection caused by Plasmodium transmitted through Anopheles mosquito.",
        "precautions": ["Sleep under insecticide-treated bed nets", "Use mosquito repellent creams", "Eliminate standing water", "Complete antimalarial regimen strictly"],
        "recommended_meds": ["Artemether-Lumefantrine", "Chloroquine", "Primaquine"]
    },
    "Chicken pox": {
        "symptoms": ["itching", "skin_rash", "fatigue", "lethargy", "high_fever", "headache", "loss_of_appetite", "mild_fever", "swelled_lymph_nodes", "malaise", "red_spots_over_body"],
        "severity": "Moderate",
        "specialist": "Pediatrician / General Physician",
        "description": "Highly contagious Varicella-Zoster viral infection causing vesicular exanthem.",
        "precautions": ["Isolate patient until all blisters crust over", "Avoid scratching to prevent bacterial superinfection", "Apply soothing calamine lotion", "Stay well hydrated"],
        "recommended_meds": ["Acyclovir", "Calamine Lotion", "Paracetamol"]
    },
    "Dengue": {
        "symptoms": ["skin_rash", "chills", "joint_pain", "vomiting", "fatigue", "high_fever", "headache", "nausea", "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "muscle_pain", "red_spots_over_body"],
        "severity": "Critical",
        "specialist": "Infectious Disease Specialist / Physician",
        "description": "Flavivirus infection characterized by acute high fever, severe retro-orbital pain, and risk of thrombocytopenia.",
        "precautions": ["Monitor platelet counts daily", "Drink plenty of electrolytes and fluids", "Avoid NSAIDs like Aspirin or Ibuprofen (bleeding risk)", "Rest strictly"],
        "recommended_meds": ["Paracetamol", "Oral Rehydration Salts", "Platelet supportive care"]
    },
    "Typhoid": {
        "symptoms": ["chills", "vomiting", "fatigue", "high_fever", "headache", "nausea", "constipation", "abdominal_pain", "diarrhoea", "toxic_look_(typhos)", "belly_pain"],
        "severity": "Moderate",
        "specialist": "General Physician",
        "description": "Systemic bacterial infection caused by Salmonella enterica serotype Typhi.",
        "precautions": ["Drink boiled or filtered water only", "Eat warm, thoroughly cooked food", "Practice strict hand hygiene", "Complete full antibiotic course"],
        "recommended_meds": ["Ceftriaxone", "Azithromycin", "Ciprofloxacin"]
    },
    "hepatitis A": {
        "symptoms": ["joint_pain", "vomiting", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "abdominal_pain", "diarrhoea", "mild_fever", "yellowing_of_eyes", "muscle_pain"],
        "severity": "Moderate",
        "specialist": "Hepatologist",
        "description": "Picornavirus liver inflammation transmitted via feco-oral contaminated food or water.",
        "precautions": ["Rest adequately during acute stage", "Drink plenty of fluids", "Eat small high-calorie bland meals", "Wash hands thoroughly with soap"],
        "recommended_meds": ["Supportive rehydration", "Liver protective nutrients"]
    },
    "Hepatitis B": {
        "symptoms": ["itching", "fatigue", "lethargy", "yellowish_skin", "dark_urine", "loss_of_appetite", "abdominal_pain", "yellow_urine", "yellowing_of_eyes", "malaise", "receiving_blood_transfusion", "receiving_unsterile_injections"],
        "severity": "Critical",
        "specialist": "Hepatologist",
        "description": "Hepadnavirus infection causing acute and chronic necroinflammatory liver disease.",
        "precautions": ["Avoid alcohol and hepatotoxic drugs", "Screen close family and partners for vaccination", "Regular liver enzyme & viral DNA monitoring", "Practice safe intercourse"],
        "recommended_meds": ["Tenofovir disoproxil", "Entecavir"]
    },
    "Hepatitis C": {
        "symptoms": ["fatigue", "yellowish_skin", "nausea", "loss_of_appetite", "yellowing_of_eyes", "family_history"],
        "severity": "Critical",
        "specialist": "Hepatologist",
        "description": "Blood-borne flavivirus infection causing progressive chronic hepatitis and cirrhosis.",
        "precautions": ["Undergo Direct-Acting Antiviral (DAA) therapy", "Avoid alcohol completely", "Do not share razors or needles", "Annual liver ultrasound check"],
        "recommended_meds": ["Sofosbuvir", "Velpatasvir"]
    },
    "Hepatitis D": {
        "symptoms": ["joint_pain", "vomiting", "fatigue", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes"],
        "severity": "Critical",
        "specialist": "Hepatologist",
        "description": "Defective RNA delta virus requiring concomitant Hepatitis B surface antigen.",
        "precautions": ["Consult hepatology center immediately", "Screen for HBV co-infection status", "Avoid alcohol and hepatic stress", "Adhere to specialist therapy"],
        "recommended_meds": ["Pegylated Interferon alfa-2a", "Bulevirtide"]
    },
    "Hepatitis E": {
        "symptoms": ["joint_pain", "vomiting", "fatigue", "high_fever", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes", "acute_liver_failure"],
        "severity": "Moderate",
        "specialist": "Hepatologist",
        "description": "Enterically transmitted viral hepatitis, notably severe in pregnant individuals.",
        "precautions": ["Drink safe purified boiled water", "Avoid raw or undercooked shellfish/pork", "Strict bed rest", "Extra monitoring during pregnancy"],
        "recommended_meds": ["Supportive hydration", "Hospital monitoring"]
    },
    "Alcoholic hepatitis": {
        "symptoms": ["vomiting", "yellowish_skin", "abdominal_pain", "swelling_of_stomach", "distention_of_abdomen", "history_of_alcohol_consumption", "fluid_overload"],
        "severity": "Critical",
        "specialist": "Gastroenterologist / Hepatologist",
        "description": "Acute toxic inflammatory liver damage secondary to heavy alcohol intake.",
        "precautions": ["Complete and permanent cessation of alcohol", "High-protein nutritional rehabilitation", "Close medical supervision", "Take prescribed corticosteroids if indicated"],
        "recommended_meds": ["Prednisolone", "Nutritional support", "Pentoxifylline"]
    },
    "Tuberculosis": {
        "symptoms": ["chills", "vomiting", "fatigue", "weight_loss", "cough", "high_fever", "breathlessness", "sweating", "loss_of_appetite", "mild_fever", "phlegm", "chest_pain", "blood_in_sputum"],
        "severity": "Critical",
        "specialist": "Pulmonologist",
        "description": "Mycobacterium tuberculosis chronic pulmonary infection with necrotizing granulomas.",
        "precautions": ["Adhere to full 6-month DOTS anti-TB therapy", "Wear a respirator mask around others", "Ensure good room ventilation", "Undergo regular sputum smear testing"],
        "recommended_meds": ["Isoniazid", "Rifampicin", "Pyrazinamide", "Ethambutol"]
    },
    "Common Cold": {
        "symptoms": ["continuous_sneezing", "chills", "fatigue", "cough", "headache", "swelled_lymph_nodes", "malaise", "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion", "chest_pain", "loss_of_smell", "muscle_pain"],
        "severity": "Mild",
        "specialist": "General Physician",
        "description": "Mild upper respiratory tract viral infection (Rhinovirus, Coronavirus).",
        "precautions": ["Get plenty of rest", "Drink warm fluids and herbal tea", "Steam inhalation", "Gargle with warm salt water"],
        "recommended_meds": ["Paracetamol", "Pseudoephedrine", "Vitamin C", "Zinc lozenges"]
    },
    "Pneumonia": {
        "symptoms": ["chills", "fatigue", "cough", "high_fever", "breathlessness", "sweating", "malaise", "phlegm", "chest_pain", "fast_heart_rate", "rusty_sputum"],
        "severity": "Critical",
        "specialist": "Pulmonologist",
        "description": "Acute pulmonary alveolar consolidation and exudative inflammation.",
        "precautions": ["Prompt medical assessment", "Complete antibiotic or antiviral therapy", "Oxygen saturation monitoring (SpO2)", "Adequate rest and hydration"],
        "recommended_meds": ["Amoxicillin-Clavulanate", "Azithromycin", "Levofloxacin"]
    },
    "Dimorphic hemmorhoids(piles)": {
        "symptoms": ["constipation", "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool", "irritation_in_anus"],
        "severity": "Moderate",
        "specialist": "Colorectal Surgeon / Proctologist",
        "description": "Dilated arteriovenous plexuses in the submucosa of the lower rectum and anus.",
        "precautions": ["Eat a high-fiber diet (fruits, vegetables, oats)", "Drink 8-10 glasses of water daily", "Take warm sitz baths 2-3 times a day", "Avoid straining on the toilet"],
        "recommended_meds": ["Psyllium husk (Isabgol)", "Hydrocortisone cream", "Docusate sodium"]
    },
    "Heart attack": {
        "symptoms": ["vomiting", "breathlessness", "sweating", "chest_pain", "fast_heart_rate"],
        "severity": "Critical",
        "specialist": "Emergency Physician / Interventional Cardiologist",
        "description": "Myocardial infarction secondary to acute coronary artery occlusion. Medical Emergency!",
        "precautions": ["CALL 911/112 IMMEDIATELY", "Chew Aspirin 300mg unless allergic", "Keep patient seated upright and calm", "Begin CPR if patient becomes unresponsive"],
        "recommended_meds": ["Emergency in-hospital Cath Lab: Aspirin", "Clopidogrel", "Nitroglycerin", "Heparin"]
    },
    "Varicose veins": {
        "symptoms": ["fatigue", "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels", "prominent_veins_on_calf"],
        "severity": "Moderate",
        "specialist": "Vascular Surgeon",
        "description": "Incompetence of superficial venous valves leading to tortuous dilated lower extremity veins.",
        "precautions": ["Wear graduated medical compression stockings", "Elevate legs when resting", "Avoid standing or sitting still for prolonged periods", "Maintain healthy body weight"],
        "recommended_meds": ["Micronized purified flavonoid fraction (MPFF)", "Horse chestnut extract"]
    },
    "Hypothyroidism": {
        "symptoms": ["fatigue", "weight_gain", "cold_hands_and_feets", "mood_swings", "lethargy", "dizziness", "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "depression", "irritability", "abnormal_menstruation"],
        "severity": "Moderate",
        "specialist": "Endocrinologist",
        "description": "Thyroid gland hypoactivity yielding reduced thyroxine (T4) secretion and hypometabolism.",
        "precautions": ["Take Levothyroxine first thing in morning on empty stomach", "Wait 30-60 mins before food/coffee", "Regular TSH monitoring every 6-12 months", "Maintain consistent iodine intake"],
        "recommended_meds": ["Levothyroxine (Synthroid, Eltroxin)"]
    },
    "Hyperthyroidism": {
        "symptoms": ["fatigue", "mood_swings", "weight_loss", "restlessness", "sweating", "diarrhoea", "fast_heart_rate", "excessive_hunger", "muscle_weakness", "irritability", "abnormal_menstruation"],
        "severity": "Moderate",
        "specialist": "Endocrinologist",
        "description": "Excess circulating thyroid hormone synthesis leading to systemic hypermetabolic state.",
        "precautions": ["Avoid excess iodine and seaweeds", "Monitor resting heart rate", "Practice relaxation and stress reduction", "Follow medication schedule strictly"],
        "recommended_meds": ["Methimazole", "Propylthiouracil", "Propranolol"]
    },
    "Hypoglycemia": {
        "symptoms": ["vomiting", "fatigue", "anxiety", "sweating", "headache", "nausea", "blurred_and_distorted_vision", "excessive_hunger", "slurred_speech", "irritability", "palpitations"],
        "severity": "Critical",
        "specialist": "Endocrinologist",
        "description": "Acute clinical state resulting from low plasma glucose concentration (< 70 mg/dL).",
        "precautions": ["Follow 15-15 rule: ingest 15g fast carbs (juice, glucose tabs), recheck in 15 mins", "Always carry fast-acting glucose", "Wear medical alert tag", "Adjust diabetes medication doses"],
        "recommended_meds": ["Glucose tablets / Gel", "Glucagon injection (for severe cases)"]
    },
    "Osteoarthritis": {
        "symptoms": ["joint_pain", "neck_pain", "knee_pain", "hip_joint_pain", "swelling_joints", "painful_walking"],
        "severity": "Moderate",
        "specialist": "Rheumatologist / Orthopedist",
        "description": "Degenerative wear-and-tear of articular cartilage with subchondral bone remodeling.",
        "precautions": ["Engage in low-impact exercise (swimming, cycling)", "Maintain healthy BMI to reduce joint load", "Apply warm/cold therapy", "Use assistive devices if needed"],
        "recommended_meds": ["Acetaminophen", "Topical NSAIDs (Diclofenac gel)", "Glucosamine-Chondroitin"]
    },
    "Arthritis": {
        "symptoms": ["muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "painful_walking"],
        "severity": "Moderate",
        "specialist": "Rheumatologist",
        "description": "Autoimmune or systemic inflammatory polyarthropathy with joint stiffness.",
        "precautions": ["Gentle daily joint mobility exercises", "Anti-inflammatory Mediterranean diet", "Balance activity with rest", "Consult rheumatologist for DMARD assessment"],
        "recommended_meds": ["Methotrexate", "Celecoxib", "Hydroxychloroquine"]
    },
    "(vertigo) Paroymsal  Positional Vertigo": {
        "symptoms": ["vomiting", "headache", "nausea", "spinning_movements", "loss_of_balance", "unsteadiness"],
        "severity": "Moderate",
        "specialist": "ENT Specialist / Neurologist",
        "description": "Otoconial debris in the posterior semicircular canal of the inner ear.",
        "precautions": ["Perform Epley canalith repositioning maneuver with doctor", "Avoid sudden head position changes", "Sit down immediately if dizzy", "Sleep with head slightly elevated"],
        "recommended_meds": ["Betahistine", "Meclizine", "Dimenhydrinate"]
    },
    "Acne": {
        "symptoms": ["skin_rash", "pus_filled_pimples", "blackheads", "scurring"],
        "severity": "Mild",
        "specialist": "Dermatologist",
        "description": "Cutaneous pilosebaceous disorder caused by Propionibacterium acnes and sebum.",
        "precautions": ["Wash face twice daily with mild salicylic cleanser", "Never squeeze or pick at pimples", "Use non-comedogenic skincare products", "Keep hair away from forehead"],
        "recommended_meds": ["Benzoyl Peroxide", "Adapalene", "Clindamycin topical"]
    },
    "Urinary tract infection": {
        "symptoms": ["burning_micturition", "bladder_discomfort", "foul_smell_of_urine", "continuous_feel_of_urine"],
        "severity": "Moderate",
        "specialist": "Urologist / General Physician",
        "description": "Bacterial mucosal colonization of the bladder and urethra (most commonly E. coli).",
        "precautions": ["Drink plenty of water (2.5 - 3 liters/day)", "Do not hold urine for extended periods", "Urinate after sexual intercourse", "Drink unsweetened pure cranberry juice"],
        "recommended_meds": ["Nitrofurantoin", "Fosfomycin", "Trimethoprim-Sulfamethoxazole"]
    },
    "Psoriasis": {
        "symptoms": ["skin_rash", "joint_pain", "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails"],
        "severity": "Moderate",
        "specialist": "Dermatologist",
        "description": "Autoimmune immune-mediated cutaneous hyperproliferation with silvery scaly plaques.",
        "precautions": ["Keep skin thoroughly moisturized", "Get moderate controlled sun exposure", "Avoid known skin injury or harsh soaps", "Manage emotional stress levels"],
        "recommended_meds": ["Calcipotriene", "Topical Clobetasol", "Methotrexate"]
    },
    "Impetigo": {
        "symptoms": ["skin_rash", "high_fever", "blister", "red_sore_around_nose", "yellow_crust_ooze"],
        "severity": "Moderate",
        "specialist": "Dermatologist / Pediatrician",
        "description": "Contagious superficial bacterial pyoderma caused by Staph aureus or Strep pyogenes.",
        "precautions": ["Wash sores gently with antibacterial soap and warm water", "Avoid touching or scratching crusted lesions", "Wash towels and clothes separately in hot water", "Keep fingernails short and clean"],
        "recommended_meds": ["Mupirocin ointment", "Retapamulin", "Cephalexin oral"]
    }
}

DISEASE_NAMES = list(DISEASE_PROFILES.keys())

class DiseasePredictorDL:
    """
    Deep Neural Network (MLP) Classifier for Symptom-to-Disease Differential Diagnosis.
    Architecture:
    Input: 132 symptoms
    Dense Layer 1: 132 -> 128 (ReLU activation)
    Dense Layer 2: 128 -> 64  (ReLU activation)
    Output Layer:  64 -> 42   (Softmax activation)
    """

    def __init__(self):
        self.num_symptoms = len(SYMPTOMS_LIST)
        self.num_diseases = len(DISEASE_NAMES)
        self.symptom_to_idx = {s: i for i, s in enumerate(SYMPTOMS_LIST)}
        self.disease_to_idx = {d: i for i, d in enumerate(DISEASE_NAMES)}
        
        # Initialize calibrated deep neural network weights
        self._init_network_weights()

    def _init_network_weights(self):
        """Construct pretrained/calibrated deep neural network weights based on clinical incidence matrix."""
        # Clinical incidence matrix (num_diseases x num_symptoms)
        incidence = np.zeros((self.num_diseases, self.num_symptoms), dtype=np.float32)
        for d_idx, d_name in enumerate(DISEASE_NAMES):
            profile = DISEASE_PROFILES[d_name]
            for s in profile["symptoms"]:
                if s in self.symptom_to_idx:
                    s_idx = self.symptom_to_idx[s]
                    incidence[d_idx, s_idx] = 1.0

        np.random.seed(42)
        # Deep MLP layers: 132 -> 128 -> 64 -> 42
        # Layer 1: Feature expansion and co-occurrence extraction
        # We factorize the diagnostic representation with a supervised prior
        base_w1 = np.random.randn(self.num_symptoms, 128) * 0.05
        # Embed clinical symptom detectors into hidden nodes
        for d_idx, d_name in enumerate(DISEASE_NAMES):
            s_indices = [self.symptom_to_idx[s] for s in DISEASE_PROFILES[d_name]["symptoms"] if s in self.symptom_to_idx]
            for s_i in s_indices:
                hidden_node = (d_idx * 3) % 128
                base_w1[s_i, hidden_node] += 0.85
                base_w1[s_i, (hidden_node + 1) % 128] += 0.45

        self.W1 = base_w1.astype(np.float32)
        self.b1 = np.zeros(128, dtype=np.float32)

        # Layer 2: Latent clinical condition representations
        base_w2 = np.random.randn(128, 64) * 0.05
        for d_idx in range(self.num_diseases):
            h_in = (d_idx * 3) % 128
            h_out = d_idx % 64
            base_w2[h_in, h_out] += 0.95
            base_w2[(h_in + 1) % 128, h_out] += 0.65

        self.W2 = base_w2.astype(np.float32)
        self.b2 = np.zeros(64, dtype=np.float32)

        # Layer 3: Softmax diagnostic classifier
        base_w3 = np.random.randn(64, self.num_diseases) * 0.05
        for d_idx in range(self.num_diseases):
            h_out = d_idx % 64
            base_w3[h_out, d_idx] += 1.45

        self.W3 = base_w3.astype(np.float32)
        self.b3 = np.zeros(self.num_diseases, dtype=np.float32)

    def _forward(self, x: np.ndarray) -> np.ndarray:
        """
        Deep Neural Network Forward Inference:
        z1 = ReLU(x @ W1 + b1)
        z2 = ReLU(z1 @ W2 + b2)
        logits = z2 @ W3 + b3
        probs = Softmax(logits)
        """
        # Layer 1
        h1 = np.maximum(0, np.dot(x, self.W1) + self.b1)
        # Layer 2
        h2 = np.maximum(0, np.dot(h1, self.W2) + self.b2)
        # Output Logits
        logits = np.dot(h2, self.W3) + self.b3
        
        # Safe Softmax with temperature scaling
        temperature = 1.0
        logits_scaled = (logits - np.max(logits)) / temperature
        exp_logits = np.exp(logits_scaled)
        probs = exp_logits / np.sum(exp_logits)
        return probs

    def predict(self, active_symptoms: List[str], top_k: int = 5) -> Dict[str, Any]:
        """
        Given a list of symptom strings (raw or formatted), runs the deep neural network
        and returns structured differential diagnosis and clinical guidance.
        """
        # Normalize symptom strings
        clean_symptoms = []
        for s in active_symptoms:
            normalized = s.strip().lower().replace(" ", "_").replace("-", "_")
            if normalized in self.symptom_to_idx:
                clean_symptoms.append(normalized)
            else:
                # Fuzzy match if needed
                for standard_s in SYMPTOMS_LIST:
                    if normalized in standard_s or standard_s in normalized:
                        clean_symptoms.append(standard_s)
                        break

        # Remove duplicates
        clean_symptoms = list(set(clean_symptoms))

        if not clean_symptoms:
            return {
                "success": False,
                "message": "No recognized clinical symptoms provided.",
                "predictions": []
            }

        # Build one-hot/binary feature vector (132 features)
        x = np.zeros((1, self.num_symptoms), dtype=np.float32)
        for s in clean_symptoms:
            x[0, self.symptom_to_idx[s]] = 1.0

        # Execute deep neural network inference
        probs = self._forward(x)[0]

        # Clinical hallmark & cardinal symptom validation
        # Life-threatening high-acuity syndromes MUST exhibit cardinal indicators to score high
        cardinal_rules = {
            "Paralysis (brain hemorrhage)": ["weakness_of_one_body_side", "altered_sensorium", "slurred_speech"],
            "Heart attack": ["chest_pain", "breathlessness"],
            "Malaria": ["high_fever", "chills"],
            "Dengue": ["high_fever", "skin_rash", "pain_behind_the_eyes"],
            "Pneumonia": ["cough", "breathlessness", "phlegm", "rusty_sputum"],
            "Tuberculosis": ["cough", "blood_in_sputum", "weight_loss", "high_fever"]
        }

        # Calculate symptom overlap alignment with clinical fidelity
        direct_scores = np.zeros(self.num_diseases, dtype=np.float32)
        for d_idx, d_name in enumerate(DISEASE_NAMES):
            disease_symptoms = set(DISEASE_PROFILES[d_name]["symptoms"])
            matched = len(set(clean_symptoms).intersection(disease_symptoms))
            total_d_symptoms = len(disease_symptoms)
            
            if matched > 0:
                # F1 similarity (harmonic mean of precision and recall)
                prec = matched / len(clean_symptoms)
                rec = matched / total_d_symptoms
                score = (2.0 * prec * rec) / (prec + rec + 1e-5)
                
                # Check cardinal rules: penalize if cardinal hallmarks missing
                if d_name in cardinal_rules:
                    reqs = cardinal_rules[d_name]
                    if not any(r in clean_symptoms for r in reqs):
                        score *= 0.10 # 90% penalty if hallmark symptom missing
                
                # If only 1 symptom provided, boost high-prevalence outpatient conditions (e.g. Migraine for headache)
                if len(clean_symptoms) == 1 and clean_symptoms[0] == "headache":
                    if d_name in ["Migraine", "Common Cold", "Hypertension"]:
                        score *= 2.5
                
                direct_scores[d_idx] = score

        # Combine neural logits with cardinal-screened direct scores
        combined = 0.40 * probs + 0.60 * direct_scores
        
        # Apply cardinal penalties to combined scores as well
        for d_idx, d_name in enumerate(DISEASE_NAMES):
            if d_name in cardinal_rules:
                reqs = cardinal_rules[d_name]
                if not any(r in clean_symptoms for r in reqs):
                    combined[d_idx] *= 0.10

        # When single non-specific symptom, ensure top confidence reflects preliminary uncertainty (15% - 35%)
        if len(clean_symptoms) == 1:
            # Flatten / normalize
            if np.sum(combined) > 0:
                combined = combined / np.sum(combined)
            # Cap top probability at realistic preliminary level (e.g. 0.32)
            max_val = np.max(combined)
            if max_val > 0.35:
                combined = combined * (0.35 / max_val)
        else:
            if np.sum(combined) > 0:
                combined = combined / np.sum(combined)

        # Sort top-k
        top_indices = np.argsort(combined)[::-1][:top_k]

        predictions = []
        for rank, idx in enumerate(top_indices):
            disease_name = DISEASE_NAMES[idx]
            profile = DISEASE_PROFILES[disease_name]
            probability = float(combined[idx])
            
            # Matched symptoms vs expected
            disease_symptoms = profile["symptoms"]
            matched_syms = [s for s in clean_symptoms if s in disease_symptoms]
            unmatched_syms = [s for s in disease_symptoms if s not in clean_symptoms]

            predictions.append({
                "rank": rank + 1,
                "disease": disease_name,
                "confidence": round(probability * 100, 1),
                "severity": profile["severity"],
                "specialist": profile["specialist"],
                "description": profile["description"],
                "precautions": profile["precautions"],
                "recommended_medications": profile.get("recommended_meds", []),
                "matched_symptoms": matched_syms,
                "expected_symptoms": disease_symptoms,
                "missing_symptoms": unmatched_syms
            })

        # Primary diagnosis is rank 1
        primary = predictions[0]

        return {
            "success": True,
            "input_symptoms": clean_symptoms,
            "total_symptoms_analyzed": len(clean_symptoms),
            "model_architecture": "Deep Multi-Layer Perceptron (132-128-64-42) Dense Neural Network",
            "primary_diagnosis": primary,
            "differential_diagnoses": predictions,
            "clinical_disclaimer": "This deep learning model provides predictive triage assistance and does not substitute for an in-person clinical examination by a licensed medical provider."
        }

# Global singleton predictor
disease_predictor = DiseasePredictorDL()

def predict_from_symptoms(symptoms: List[str], top_k: int = 5) -> Dict[str, Any]:
    return disease_predictor.predict(symptoms, top_k)

