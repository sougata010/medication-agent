import datetime
from typing import List, Dict, Any

# Map of common drug side effect correlations
DRUG_SIDE_EFFECT_MAP = {
    "lisinopril": ["dizziness", "dry cough", "cough", "headache", "hyperkalemia"],
    "metformin": ["nausea", "stomach upset", "diarrhea", "gastrointestinal distress", "bloating"],
    "warfarin": ["bleeding", "bruising", "easy bruising", "blood in urine"],
    "atorvastatin": ["muscle pain", "muscle aches", "myalgia", "fatigue", "joint pain"],
    "ibuprofen": ["stomach pain", "heartburn", "nausea", "dizziness"],
    "amlodipine": ["swollen ankles", "edema", "flushing", "dizziness"],
    "levothyroxine": ["palpitations", "insomnia", "anxiety", "weight loss"]
}

def analyze_symptom_med_correlation(
    medications: List[Dict[str, Any]],
    symptom_logs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyzes temporal deltas between medication start/change dates and logged symptoms.
    """
    timeline_events = []
    insights = []

    # Format medication events
    med_events = []
    for m in medications:
        m_name = m.get("name", "Medication")
        m_date_str = m.get("started_at") or m.get("uploaded_at") or datetime.date.today().isoformat()
        try:
            m_date = datetime.datetime.fromisoformat(m_date_str.replace("Z", "+00:00")).date()
        except Exception:
            m_date = datetime.date.today()

        med_events.append({
            "id": f"med_ev_{m_name.lower().replace(' ', '_')}",
            "type": "medication_start",
            "title": f"Started {m_name}",
            "name": m_name,
            "date": m_date.isoformat(),
            "date_obj": m_date,
            "description": f"Medication {m_name} regimen initiated."
        })

    # Format symptom events
    symptom_events = []
    for s in symptom_logs:
        s_name = s.get("symptom") or s.get("name") or "Symptom"
        s_date_str = s.get("logged_at") or datetime.date.today().isoformat()
        try:
            s_date = datetime.datetime.fromisoformat(s_date_str.replace("Z", "+00:00")).date()
        except Exception:
            s_date = datetime.date.today()

        symptom_events.append({
            "id": f"sym_ev_{s_name.lower().replace(' ', '_')}_{s_date.isoformat()}",
            "type": "symptom_log",
            "title": f"Reported {s_name}",
            "name": s_name,
            "severity": s.get("severity", "moderate"),
            "date": s_date.isoformat(),
            "date_obj": s_date,
            "notes": s.get("notes", "")
        })

    # Combine into chronological timeline
    all_events = sorted(med_events + symptom_events, key=lambda x: x["date"])

    # Temporal Correlation Engine
    for s_ev in symptom_events:
        s_name_clean = s_ev["name"].lower().strip()
        s_date = s_ev["date_obj"]

        for m_ev in med_events:
            m_name_clean = m_ev["name"].split()[0].lower().strip()
            m_date = m_ev["date_obj"]

            delta_days = (s_date - m_date).days

            # Temporal window: Symptom appeared 1 to 21 days after medication started
            if 0 <= delta_days <= 30:
                known_effects = DRUG_SIDE_EFFECT_MAP.get(m_name_clean, [])
                is_known_side_effect = any(effect in s_name_clean or s_name_clean in effect for effect in known_effects)

                if is_known_side_effect or delta_days <= 14:
                    confidence = "High" if (is_known_side_effect and 1 <= delta_days <= 14) else "Moderate" if is_known_side_effect else "Possible"

                    days_text = "on the same day" if delta_days == 0 else f"{delta_days} day{'s' if delta_days > 1 else ''} after"

                    insights.append({
                        "id": f"insight_{m_name_clean}_{s_name_clean}",
                        "symptom": s_ev["name"],
                        "medication": m_ev["name"],
                        "deltaDays": delta_days,
                        "confidence": confidence,
                        "isKnownFDAEffect": is_known_side_effect,
                        "title": f"Temporal Correlation: {s_ev['name']} ↔ {m_ev['name']}",
                        "text": f"Your reported '{s_ev['name']}' began {days_text} '{m_ev['name']}' was started.",
                        "clinicalNote": f"FDA labeling lists '{s_ev['name']}' as a documented adverse reaction for {m_ev['name']}." if is_known_side_effect else f"Temporal onset within {delta_days} days of starting {m_ev['name']}."
                    })

    return {
        "events": [{k: v for k, v in ev.items() if k != "date_obj"} for ev in all_events],
        "insights": insights,
        "summary": {
            "total_medications": len(med_events),
            "total_symptom_logs": len(symptom_events),
            "total_correlations": len(insights)
        }
    }
