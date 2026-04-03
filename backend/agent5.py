
# AGENT 5: Cost Estimator Agent (Upgraded)
# New: Real insurance API integration,
#      pre-authorization check,
#      payment link generation,
#      cheaper alternative suggestion


import json
import os
import uuid
import requests
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()
client = Anthropic()

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")           # Payment gateway
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
INSURANCE_API_URL = os.getenv("INSURANCE_API_URL")        # Real insurance API endpoint
INSURANCE_API_KEY = os.getenv("INSURANCE_API_KEY")



# COST BENCHMARKS


COST_BENCHMARKS = {
    "General Physician": {
        "consultation_min": 400, "consultation_max": 1200,
        "tests": {"blood_test": 600, "urine_test": 250, "xray": 900, "cbc": 550},
        "medicines_avg": 500
    },
    "Cardiologist": {
        "consultation_min": 1200, "consultation_max": 3000,
        "tests": {"ecg": 500, "echo": 2800, "stress_test": 4000},
        "medicines_avg": 1800
    },
    "Emergency Medicine": {
        "consultation_min": 2000, "consultation_max": 6000,
        "tests": {"blood_panel": 2500, "ct_scan": 8500, "xray": 1000},
        "medicines_avg": 2500
    },
    "Orthopedic": {
        "consultation_min": 900, "consultation_max": 2500,
        "tests": {"xray": 900, "mri": 6500},
        "medicines_avg": 1000
    },
    "Dermatologist": {
        "consultation_min": 600, "consultation_max": 1800,
        "tests": {"skin_biopsy": 2500},
        "medicines_avg": 700
    },
    "Gastroenterologist": {
        "consultation_min": 800, "consultation_max": 2000,
        "tests": {"endoscopy": 5000, "ultrasound": 1500},
        "medicines_avg": 900
    },
    "Ophthalmologist": {
        "consultation_min": 500, "consultation_max": 1500,
        "tests": {"eye_exam": 800, "fundoscopy": 1200},
        "medicines_avg": 600
    }
}

INSURANCE_PLANS = {
    "standard_tourist": {
        "plan_name": "Standard Tourist Cover",
        "deductible_inr": 2000,
        "coverage_percent": 80,
        "max_claim_inr": 100000,
        "covers": ["consultation", "tests", "medicines", "hospitalization"],
        "preauth_required_above_inr": 10000
    },
    "premium_tourist": {
        "plan_name": "Premium Tourist Cover",
        "deductible_inr": 500,
        "coverage_percent": 95,
        "max_claim_inr": 500000,
        "covers": ["consultation", "tests", "medicines", "hospitalization", "emergency_transport"],
        "preauth_required_above_inr": 25000
    },
    "no_insurance": {
        "plan_name": "No Insurance",
        "deductible_inr": 0,
        "coverage_percent": 0,
        "max_claim_inr": 0,
        "covers": [],
        "preauth_required_above_inr": None
    }
}

CURRENCY_RATES = {
    "USD": 83.5, "EUR": 90.2, "GBP": 105.0, "AUD": 54.0,
    "CAD": 61.5, "JPY": 0.56, "SGD": 62.0, "AED": 22.7
}

# Cheaper alternatives mapping — pure Python lookup
CHEAPER_ALTERNATIVES = {
    "General Physician": [
        {
            "option": "Government Hospital OPD",
            "cost_range_inr": "₹0–100",
            "quality_note": "Long wait times but free/very cheap. Good for non-urgent cases.",
            "examples": ["SSKM Hospital", "RG Kar Medical College", "NRS Medical College"]
        },
        {
            "option": "Telemedicine Consultation",
            "cost_range_inr": "₹200–500",
            "quality_note": "Video call with certified doctor. Best for mild symptoms.",
            "examples": ["Practo", "Apollo 24x7", "mFine"]
        },
        {
            "option": "Clinic (non-hospital)",
            "cost_range_inr": "₹300–600",
            "quality_note": "Local GP clinic. Much cheaper than hospital consultation.",
            "examples": ["Local registered clinics in the area"]
        }
    ],
    "Cardiologist": [
        {
            "option": "Government Cardiac Center",
            "cost_range_inr": "₹200–500",
            "quality_note": "Subsidized rates. Longer wait but qualified cardiologists.",
            "examples": ["IPGMER Cardiology", "SSKM Cardiology OPD"]
        },
        {
            "option": "Medical College Hospital",
            "cost_range_inr": "₹500–1200",
            "quality_note": "Teaching hospitals offer good care at lower cost.",
            "examples": ["Calcutta Medical College", "NRS Medical College"]
        }
    ],
    "Dermatologist": [
        {
            "option": "Telemedicine Dermatology",
            "cost_range_inr": "₹300–700",
            "quality_note": "Photo-based diagnosis. Works well for skin conditions.",
            "examples": ["Practo Dermatology", "CureSkin App", "SkinQ"]
        }
    ],
    "Orthopedic": [
        {
            "option": "Government Orthopedic OPD",
            "cost_range_inr": "₹50–300",
            "quality_note": "Free X-rays available. Good for non-emergency fractures.",
            "examples": ["SSKM Ortho OPD", "NRS Orthopedics"]
        }
    ]
}



# INSURANCE API 


def verify_insurance_coverage(plan_type: str, tourist_name: str,
                               policy_number: str = None) -> dict:
    """
    Call real insurance API to verify coverage.
    Falls back to local plan data if API unavailable.
    """
    # Try real insurance API 
    if INSURANCE_API_URL and INSURANCE_API_KEY and policy_number:
        try:
            headers = {
                "Authorization": f"Bearer {INSURANCE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "policy_number": policy_number,
                "patient_name": tourist_name,
                "query_type": "coverage_check"
            }
            resp = requests.post(
                f"{INSURANCE_API_URL}/verify-coverage",
                headers=headers,
                json=payload,
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()

            return {
                "verified": True,
                "source": "real_api",
                "policy_number": policy_number,
                "plan_name": data.get("plan_name"),
                "coverage_percent": data.get("coverage_percent"),
                "max_claim_inr": data.get("max_claim_inr"),
                "deductible_inr": data.get("deductible_inr"),
                "active": data.get("active", True),
                "expiry_date": data.get("expiry_date"),
                "covers": data.get("covered_services", [])
            }
        except Exception as e:
            print(f"  [Insurance API] Real API failed: {e} — using local plan data")

    # Fallback to local plan data 
    plan = INSURANCE_PLANS.get(plan_type, INSURANCE_PLANS["no_insurance"])
    return {
        "verified": False,
        "source": "local_benchmark",
        "policy_number": policy_number or "not provided",
        "plan_name": plan["plan_name"],
        "coverage_percent": plan["coverage_percent"],
        "max_claim_inr": plan["max_claim_inr"],
        "deductible_inr": plan["deductible_inr"],
        "active": True,
        "expiry_date": "unknown",
        "covers": plan["covers"],
        "note": "Coverage estimated from plan type — not verified with insurer"
    }


def check_preauthorization(plan_type: str, estimated_total_inr: float,
                            specialty: str, policy_number: str = None) -> dict:
    """
    Check if pre-authorization is required and request it.
    Pre-auth needed when estimated cost exceeds plan threshold.
    """
    plan = INSURANCE_PLANS.get(plan_type, INSURANCE_PLANS["no_insurance"])
    threshold = plan.get("preauth_required_above_inr")

    # No insurance or no threshold defined
    if not threshold or plan["coverage_percent"] == 0:
        return {
            "required": False,
            "reason": "No insurance or pre-auth not applicable",
            "status": "not_applicable"
        }

    # Cost is below threshold — no pre-auth needed
    if estimated_total_inr <= threshold:
        return {
            "required": False,
            "reason": f"Estimated cost ₹{estimated_total_inr} is below threshold ₹{threshold}",
            "status": "not_required"
        }

    # Pre-auth required — try to request via API
    preauth_ref = f"PA-{str(uuid.uuid4())[:8].upper()}"

    if INSURANCE_API_URL and INSURANCE_API_KEY and policy_number:
        try:
            headers = {
                "Authorization": f"Bearer {INSURANCE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "policy_number": policy_number,
                "specialty": specialty,
                "estimated_amount_inr": estimated_total_inr,
                "preauth_reference": preauth_ref
            }
            resp = requests.post(
                f"{INSURANCE_API_URL}/request-preauth",
                headers=headers,
                json=payload,
                timeout=10
            )
            data = resp.json()
            return {
                "required": True,
                "status": data.get("status", "pending"),
                "preauth_reference": data.get("reference", preauth_ref),
                "approved_amount_inr": data.get("approved_amount"),
                "valid_until": data.get("valid_until"),
                "note": "Pre-authorization submitted to insurer"
            }
        except Exception as e:
            print(f"  [Pre-auth API] Failed: {e} — returning mock pre-auth")

    # Mock pre-auth response (fallback)
    return {
        "required": True,
        "status": "pending",
        "preauth_reference": preauth_ref,
        "approved_amount_inr": None,
        "valid_until": None,
        "note": (
            f"Pre-authorization required for ₹{estimated_total_inr}. "
            f"Contact your insurer with reference: {preauth_ref}. "
            f"Threshold for {plan['plan_name']}: ₹{threshold}"
        )
    }



# PAYMENT LINK GENERATION — Razorpay / Mock fallback

def generate_payment_link(amount_inr: float, booking_id: str,
                           tourist_name: str, tourist_email: str = None,
                           tourist_phone: str = None) -> dict:
    """
    Generate a payment link via Razorpay API.
    Falls back to mock link if API keys not configured.
    """
    amount_paise = int(amount_inr * 100)  # Razorpay uses paise

    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        try:
            payload = {
                "amount": amount_paise,
                "currency": "INR",
                "description": f"MediGuide Medical Consultation - {booking_id}",
                "customer": {
                    "name": tourist_name,
                    "email": tourist_email or "",
                    "contact": tourist_phone or ""
                },
                "notify": {
                    "sms": bool(tourist_phone),
                    "email": bool(tourist_email)
                },
                "reminder_enable": True,
                "notes": {
                    "booking_id": booking_id,
                    "source": "MediGuide"
                },
                "callback_url": f"https://mediguide.app/payment-callback/{booking_id}",
                "callback_method": "get"
            }
            resp = requests.post(
                "https://api.razorpay.com/v1/payment_links",
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
                json=payload,
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()

            return {
                "payment_link_id": data["id"],
                "payment_url": data["short_url"],
                "amount_inr": amount_inr,
                "expires_at": data.get("expire_by"),
                "status": "active",
                "source": "razorpay"
            }
        except Exception as e:
            print(f"  [Razorpay] API failed: {e} — using mock link")

    # ── Mock payment link fallback ──────────────────────
    mock_link_id = f"pay_{str(uuid.uuid4())[:16]}"
    return {
        "payment_link_id": mock_link_id,
        "payment_url": f"https://pay.mediguide.app/{mock_link_id}",
        "amount_inr": amount_inr,
        "expires_at": None,
        "status": "mock",
        "source": "mock_gateway",
        "note": "Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for real payment links"
    }



# CHEAPER ALTERNATIVES — Pure Python lookup


def get_cheaper_alternatives(specialty: str, severity_score: int,
                              out_of_pocket_inr: float) -> list:
    """
    Return cheaper alternatives when out-of-pocket is high.
    Pure Python — no LLM needed.
    Only shown when:
    - Severity is low-medium (score <= 6)
    - Out-of-pocket > ₹1000
    """
    # Don't suggest alternatives for high severity
    if severity_score >= 7:
        return []

    # Only suggest if cost is significant
    if out_of_pocket_inr <= 1000:
        return []

    alternatives = CHEAPER_ALTERNATIVES.get(specialty, [])

    # Always add telemedicine for low severity if not already there
    if severity_score <= 3:
        tele_exists = any("tele" in a["option"].lower() for a in alternatives)
        if not tele_exists:
            alternatives = [{
                "option": "Telemedicine Consultation",
                "cost_range_inr": "₹200–500",
                "quality_note": "Video call with certified doctor. Best for mild symptoms.",
                "examples": ["Practo", "Apollo 24x7", "mFine"]
            }] + alternatives

    return alternatives[:3]  # Return top 3



# CORE COST CALCULATION — Pure Python


def get_hospital_price_level(hospital_name: str, city: str = "Kolkata") -> dict:
    """Get real-time hospital price level from Google Places."""
    if not GOOGLE_PLACES_API_KEY:
        return {"multiplier": 1.0, "note": "Using standard benchmarks"}

    try:
        url = "https://places.googleapis.com/v1/places:searchText"
        payload = {"textQuery": f"{hospital_name} {city}", "maxResultCount": 3}
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": "places.priceLevel"
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        data = resp.json()

        for place in data.get("places", []):
            level = place.get("priceLevel")
            if level is not None:
                multiplier = (0.8 if level <= 1 else
                              1.0 if level == 2 else
                              1.3 if level == 3 else 1.6)
                return {"multiplier": multiplier,
                        "note": f"Google Places price level {level}"}
    except Exception as e:
        print(f"  [Google Places] {e}")

    return {"multiplier": 1.0, "note": "Using standard benchmarks"}


def calculate_cost_breakdown(specialty: str, city: str,
                              hospital_name: str = None) -> dict:
    """Deterministic cost calculation — no LLM."""
    benchmark = COST_BENCHMARKS.get(specialty, COST_BENCHMARKS["General Physician"])

    city_multiplier = (1.35 if city in ["Mumbai", "Delhi", "Bangalore"]
                       else 1.15 if city == "Kolkata" else 1.0)
    price_info = get_hospital_price_level(hospital_name or "", city)
    final_multiplier = city_multiplier * price_info["multiplier"]

    consultation = int(
        ((benchmark["consultation_min"] + benchmark["consultation_max"]) / 2)
        * final_multiplier
    )
    tests_total = int((sum(benchmark["tests"].values()) / 2) * final_multiplier)
    medicines = int(benchmark["medicines_avg"] * final_multiplier)

    return {
        "consultation": consultation,
        "estimated_tests": tests_total,
        "estimated_medicines": medicines,
        "total_estimated": consultation + tests_total + medicines,
        "price_adjustment_note": price_info["note"]
    }


def calculate_insurance_coverage(insurance_data: dict, total_inr: float) -> dict:
    """Calculate what insurance actually covers — pure Python."""
    coverage_pct = insurance_data.get("coverage_percent", 0)
    deductible = insurance_data.get("deductible_inr", 0)
    max_claim = insurance_data.get("max_claim_inr", 0)

    if coverage_pct == 0:
        return {
            "plan": insurance_data.get("plan_name", "No Insurance"),
            "covered_inr": 0,
            "out_of_pocket_inr": round(total_inr, 2),
            "coverage_percent": 0
        }

    after_deductible = max(0, total_inr - deductible)
    covered = min(after_deductible * (coverage_pct / 100), max_claim)
    out_of_pocket = total_inr - covered

    return {
        "plan": insurance_data.get("plan_name", "Unknown Plan"),
        "covered_inr": round(covered, 2),
        "out_of_pocket_inr": round(out_of_pocket, 2),
        "coverage_percent": coverage_pct
    }


def convert_currency(amount_inr: float, target_currency: str) -> dict:
    rate = CURRENCY_RATES.get(target_currency.upper(), 83.5)
    return {
        "amount_inr": round(amount_inr, 2),
        "target_currency": target_currency.upper(),
        "converted_amount": round(amount_inr / rate, 2),
        "exchange_rate": f"1 {target_currency.upper()} = ₹{rate}"
    }



# LLM 


def generate_cost_summary(specialty: str, breakdown: dict,
                           insurance: dict, home_currency: str,
                           out_of_pocket_converted: float,
                           has_alternatives: bool) -> dict:
    """LLM writes the human-facing summary only."""
    prompt = f"""
Write a short, friendly cost summary for a tourist visiting a doctor in India.

Specialty: {specialty}
Total Estimated Cost: ₹{breakdown['total_estimated']}
Insurance Covered: ₹{insurance['covered_inr']}
Your Out of Pocket: ₹{insurance['out_of_pocket_inr']} (~{home_currency} {out_of_pocket_converted})
{"Cheaper alternatives are available for this case." if has_alternatives else ""}

Provide:
1. One warm, reassuring cost_summary sentence
2. Exactly 3 practical payment_tips for paying medical bills in India

Format:
SUMMARY: <one sentence>
TIP1: <tip>
TIP2: <tip>
TIP3: <tip>
"""
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()

        # Parse structured output
        lines = {line.split(":")[0].strip(): ":".join(line.split(":")[1:]).strip()
                 for line in text.split("\n") if ":" in line}

        return {
            "cost_summary": lines.get("SUMMARY", f"Estimated cost for {specialty} is ₹{breakdown['total_estimated']}."),
            "payment_tips": [
                lines.get("TIP1", "Carry cash — many clinics prefer cash payment"),
                lines.get("TIP2", "UPI apps like GPay and PhonePe are widely accepted"),
                lines.get("TIP3", "Keep all receipts for insurance reimbursement")
            ]
        }
    except Exception as e:
        print(f"  [Cost Summary LLM] {e} — using fallback")
        return {
            "cost_summary": f"Estimated total for {specialty} consultation is ₹{breakdown['total_estimated']}.",
            "payment_tips": [
                "Carry cash — many clinics prefer cash",
                "UPI (GPay, PhonePe) widely accepted",
                "Keep all receipts for insurance reimbursement"
            ]
        }



# MAIN AGENT CLASS


class CostEstimatorAgent:

    def estimate(self, triage_result: dict, matched_provider: dict,
                 tourist_info: dict) -> dict:
        """
        Full cost estimation pipeline:
        1. Calculate costs (Python)
        2. Verify insurance via API
        3. Pre-authorization check (Python)
        4. Generate payment link
        5. Find cheaper alternatives (Python)
        6. LLM writes summary
        """
        specialty = triage_result.get("recommended_specialty", "General Physician")
        severity = triage_result.get("severity_score", 5)
        city = tourist_info.get("city", "Kolkata")
        hospital_name = (matched_provider.get("hospital_name")
                         or matched_provider.get("provider_name", ""))
        home_currency = tourist_info.get("home_currency", "USD")
        plan_type = tourist_info.get("insurance_plan", "no_insurance")
        policy_number = tourist_info.get("policy_number")
        tourist_name = tourist_info.get("name", "Tourist")

        # ── Step 1: Cost calculation — pure Python ──────────────
        breakdown = calculate_cost_breakdown(specialty, city, hospital_name)
        print(f"  [Cost] Total estimated: ₹{breakdown['total_estimated']}")

        # ── Step 2: Verify insurance via API ────────────────────
        insurance_data = verify_insurance_coverage(
            plan_type, tourist_name, policy_number
        )
        print(f"  [Insurance] Source: {insurance_data['source']} | "
              f"Coverage: {insurance_data['coverage_percent']}%")

        # ── Step 3: Calculate coverage amounts — pure Python ────
        coverage = calculate_insurance_coverage(
            insurance_data, breakdown["total_estimated"]
        )

        # ── Step 4: Pre-authorization check — pure Python ───────
        preauth = check_preauthorization(
            plan_type, breakdown["total_estimated"],
            specialty, policy_number
        )
        if preauth["required"]:
            print(f"  [Pre-auth] Required — Reference: {preauth.get('preauth_reference')}")
        else:
            print(f"  [Pre-auth] {preauth['status']}")

        # ── Step 5: Generate payment link ────────────────────────
        payment_link = generate_payment_link(
            amount_inr=coverage["out_of_pocket_inr"],
            booking_id=matched_provider.get("slot_id", "UNKNOWN"),
            tourist_name=tourist_name,
            tourist_email=tourist_info.get("email"),
            tourist_phone=tourist_info.get("phone")
        )
        print(f"  [Payment] Link: {payment_link['payment_url']}")

        # ── Step 6: Currency conversion — pure Python ───────────
        currency_info = convert_currency(coverage["out_of_pocket_inr"], home_currency)

        # ── Step 7: Cheaper alternatives — pure Python ──────────
        alternatives = get_cheaper_alternatives(
            specialty, severity, coverage["out_of_pocket_inr"]
        )
        if alternatives:
            print(f"  [Alternatives] {len(alternatives)} cheaper options found")

        # ── Step 8: LLM writes human-facing summary only ────────
        summary = generate_cost_summary(
            specialty, breakdown, coverage,
            home_currency, currency_info["converted_amount"],
            has_alternatives=bool(alternatives)
        )

        return {
            "specialty": specialty,
            "cost_breakdown_inr": {
                "consultation": breakdown["consultation"],
                "estimated_tests": breakdown["estimated_tests"],
                "estimated_medicines": breakdown["estimated_medicines"],
                "total_estimated": breakdown["total_estimated"],
                "price_adjustment_note": breakdown["price_adjustment_note"]
            },
            "insurance": {
                "plan": coverage["plan"],
                "verified": insurance_data["verified"],
                "source": insurance_data["source"],
                "coverage_percent": coverage["coverage_percent"],
                "covered_inr": coverage["covered_inr"],
                "out_of_pocket_inr": coverage["out_of_pocket_inr"],
                "policy_number": policy_number or "not provided",
                "expiry_date": insurance_data.get("expiry_date", "unknown")
            },
            "preauthorization": preauth,
            "payment": {
                "out_of_pocket_inr": coverage["out_of_pocket_inr"],
                f"out_of_pocket_{home_currency.lower()}": currency_info["converted_amount"],
                "exchange_rate": currency_info["exchange_rate"],
                "payment_url": payment_link["payment_url"],
                "payment_link_id": payment_link["payment_link_id"],
                "payment_source": payment_link["source"]
            },
            "cheaper_alternatives": alternatives,
            "cost_summary": summary["cost_summary"],
            "payment_tips": summary["payment_tips"],
            "disclaimer": (
                "Costs are estimates only. Actual charges may vary "
                "based on tests ordered and treatment required."
            )
        }


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    triage_result = {
        "recommended_specialty": "General Physician",
        "severity_score": 5
    }
    matched_provider = {
        "provider_name": "Dr. Priya Sharma",
        "hospital_name": "Apollo Gleneagles Hospital",
        "slot_id": "slot-101"
    }
    tourist_info = {
        "name": "John Smith",
        "city": "Kolkata",
        "home_currency": "USD",
        "insurance_plan": "standard_tourist",
        "policy_number": "TRV-2025-99887",
        "email": "john@email.com",
        "phone": "+1-555-123-4567"
    }

    agent = CostEstimatorAgent()
    result = agent.estimate(triage_result, matched_provider, tourist_info)

    print("\n" + "=" * 60)
    print("COST ESTIMATE REPORT")
    print("=" * 60)
    print(json.dumps(result, indent=2))