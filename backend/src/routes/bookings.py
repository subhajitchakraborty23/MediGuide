from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import json
import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

from ..database.db import get_db
from ..models.models import Booking, SymptomReport
from sqlalchemy import select

load_dotenv()

router = APIRouter()
llm_client = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)


class BookingRequest(BaseModel):
    symptom_report_id: Optional[int] = None
    user_id: Optional[int] = None

    hospital_place_id: str
    hospital_name: str
    hospital_address: str
    hospital_phone: Optional[str] = None

    patient_name: str
    patient_age: int
    patient_gender: str
    patient_blood_type: Optional[str] = None
    patient_allergies: Optional[str] = None

    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_email: Optional[str] = None

    appointment_time: datetime
    ambulance_requested: bool = False

    symptoms: Optional[str] = None
    severity_score: Optional[int] = None
    recommended_specialty: Optional[str] = None


class BookingResponse(BaseModel):
    booking_id: int
    status: str
    hospital_name: str
    hospital_address: str
    appointment_time: str
    patient_name: str
    ambulance_requested: bool
    estimated_cost_usd: int
    intake_note: str
    created_at: str


class FamilyReportResponse(BaseModel):
    booking_id: int
    family_report_text: str
    generated_at: str


INTAKE_NOTE_PROMPT = """You are a medical intake note generator. Create a concise, professional clinical intake note for hospital staff based on the patient information provided.

The note should include:
- Patient demographics (name, age, gender, blood type)
- Chief complaint / symptoms
- Severity assessment
- Recommended specialty
- Known allergies
- Emergency contact information
- Ambulance status if requested

Format the note professionally for clinical staff. Be clear and concise.

Patient Information:
Name: {patient_name}
Age: {patient_age}
Gender: {patient_gender}
Blood Type: {blood_type}
Allergies: {allergies}

Symptoms: {symptoms}
Severity Score: {severity_score}/10
Recommended Specialty: {specialty}
Ambulance Requested: {ambulance}

Emergency Contact: {emergency_contact_name} ({emergency_contact_phone})

Generate a professional intake note (200-300 words max).
"""


FAMILY_REPORT_PROMPT = """You are a compassionate medical communicator. Generate a family report that explains the patient's medical situation in plain, non-medical language that their loved ones can understand.

Include:
- What happened and why care was needed
- Where the patient is being treated
- What kind of specialist is seeing them
- The appointment details
- Estimated cost breakdown
- Current status and next steps
- Reassuring tone while being factual

Patient Information:
Name: {patient_name}
Age: {patient_age}
Hospital: {hospital_name}
Address: {hospital_address}
Appointment: {appointment_time}

Medical Situation:
Symptoms: {symptoms}
Severity: {severity_level}
Specialist: {specialty}
Ambulance: {ambulance_status}

Cost Estimate: ${estimated_cost} USD
(Note: This is an estimate for consultation and basic assessment)

Emergency Contact: {emergency_contact_name}

Write a warm, reassuring family report (300-400 words). Avoid medical jargon. Be honest but compassionate.
"""


def estimate_cost(specialty: str, severity_score: int, ambulance: bool) -> int:
    """Simple cost estimation based on specialty and severity"""
    base_costs = {
        "General Physician": 100,
        "Cardiologist": 250,
        "Emergency Medicine": 400,
        "Orthopedic": 200,
        "Pediatrician": 150,
        "Gastroenterologist": 200,
        "Dermatologist": 150,
        "Ophthalmologist": 180,
        "Gynecologist": 200,
        "Psychiatrist": 180,
        "Dentist": 150,
    }

    base = base_costs.get(specialty, 150)

    if severity_score >= 8:
        base *= 2.5
    elif severity_score >= 6:
        base *= 1.8
    elif severity_score >= 4:
        base *= 1.3

    if ambulance:
        base += 300

    return int(base)


async def generate_intake_note(booking_data: BookingRequest) -> str:
    """Generate clinical intake note using Gemini"""
    prompt = INTAKE_NOTE_PROMPT.format(
        patient_name=booking_data.patient_name,
        patient_age=booking_data.patient_age,
        patient_gender=booking_data.patient_gender,
        blood_type=booking_data.patient_blood_type or "Unknown",
        allergies=booking_data.patient_allergies or "None reported",
        symptoms=booking_data.symptoms or "Not provided",
        severity_score=booking_data.severity_score or "Unknown",
        specialty=booking_data.recommended_specialty or "General Physician",
        ambulance="Yes" if booking_data.ambulance_requested else "No",
        emergency_contact_name=booking_data.emergency_contact_name,
        emergency_contact_phone=booking_data.emergency_contact_phone,
    )

    try:
        response = await llm_client.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return f"Clinical Intake Note\n\nPatient: {booking_data.patient_name}, {booking_data.patient_age}yo {booking_data.patient_gender}\nChief Complaint: {booking_data.symptoms or 'Not provided'}\nSeverity: {booking_data.severity_score or 'Unknown'}/10\nAllergies: {booking_data.patient_allergies or 'None'}\nEmergency Contact: {booking_data.emergency_contact_name} ({booking_data.emergency_contact_phone})"


def _ensure_naive_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-aware datetime to naive UTC datetime for TIMESTAMP WITHOUT TIME ZONE columns"""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Strip timezone info, assuming the time is already in UTC
        return dt.replace(tzinfo=None)
    return dt


@router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    booking_request: BookingRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new booking with intake note generation
    """
    try:
        intake_note = await generate_intake_note(booking_request)

        estimated_cost = estimate_cost(
            booking_request.recommended_specialty or "General Physician",
            booking_request.severity_score or 5,
            booking_request.ambulance_requested
        )

        # Ensure appointment_time is naive UTC for TIMESTAMP WITHOUT TIME ZONE column
        appointment_time = _ensure_naive_datetime(booking_request.appointment_time)

        new_booking = Booking(
            user_id=booking_request.user_id,
            symptom_report_id=booking_request.symptom_report_id,
            hospital_place_id=booking_request.hospital_place_id,
            hospital_name=booking_request.hospital_name,
            hospital_address=booking_request.hospital_address,
            hospital_phone=booking_request.hospital_phone,
            patient_name=booking_request.patient_name,
            patient_age=booking_request.patient_age,
            patient_gender=booking_request.patient_gender,
            patient_blood_type=booking_request.patient_blood_type,
            patient_allergies=booking_request.patient_allergies,
            emergency_contact_name=booking_request.emergency_contact_name,
            emergency_contact_phone=booking_request.emergency_contact_phone,
            emergency_contact_email=booking_request.emergency_contact_email,
            appointment_time=appointment_time,
            status="confirmed",
            ambulance_requested=booking_request.ambulance_requested,
            notes=intake_note,
            estimated_cost_usd=estimated_cost,
            family_report_sent=False
        )

        db.add(new_booking)
        await db.commit()
        await db.refresh(new_booking)

        return BookingResponse(
            booking_id=new_booking.id,
            status=new_booking.status,
            hospital_name=new_booking.hospital_name,
            hospital_address=new_booking.hospital_address,
            appointment_time=new_booking.appointment_time.isoformat(),
            patient_name=new_booking.patient_name,
            ambulance_requested=new_booking.ambulance_requested,
            estimated_cost_usd=new_booking.estimated_cost_usd,
            intake_note=new_booking.notes,
            created_at=new_booking.created_at.isoformat()
        )

    except Exception as e:
        await db.rollback()
        logging.error(f"Failed to create booking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")


@router.post("/bookings/{booking_id}/family-report", response_model=FamilyReportResponse)
async def generate_family_report(
    booking_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a family report for an existing booking
    """
    try:
        result = await db.execute(
            select(Booking, SymptomReport)
            .outerjoin(SymptomReport, Booking.symptom_report_id == SymptomReport.id)
            .where(Booking.id == booking_id)
        )
        row = result.first()

        if not row:
            raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

        booking, symptom_report = row

        severity_label = "mild"
        if symptom_report and symptom_report.severity:
            severity_label = symptom_report.severity

        symptoms = "Medical attention needed"
        specialty = "General Physician"

        if symptom_report:
            symptoms = symptom_report.symptoms_raw or symptoms
            specialty = symptom_report.recommended_specialty or specialty

        prompt = FAMILY_REPORT_PROMPT.format(
            patient_name=booking.patient_name,
            patient_age=booking.patient_age,
            hospital_name=booking.hospital_name,
            hospital_address=booking.hospital_address,
            appointment_time=booking.appointment_time.strftime("%B %d, %Y at %I:%M %p"),
            symptoms=symptoms,
            severity_level=severity_label,
            specialty=specialty,
            ambulance_status="Ambulance was requested and dispatched" if booking.ambulance_requested else "Patient is traveling to hospital independently",
            estimated_cost=booking.estimated_cost_usd,
            emergency_contact_name=booking.emergency_contact_name
        )

        try:
            response = await llm_client.ainvoke([HumanMessage(content=prompt)])
            family_report = response.content
        except Exception as e:
            family_report = f"""Medical Update for {booking.patient_name}

Your loved one, {booking.patient_name}, is receiving medical care at {booking.hospital_name}.

Location: {booking.hospital_address}
Appointment: {booking.appointment_time.strftime("%B %d, %Y at %I:%M %p")}
Specialist: {specialty}

Situation: {symptoms}

The medical team is providing appropriate care. Estimated cost for consultation and assessment is approximately ${booking.estimated_cost_usd} USD.

{booking.emergency_contact_name} is listed as the emergency contact.

Please keep your phone available for any updates from the hospital."""

        booking.family_report_text = family_report
        booking.family_report_sent = True

        await db.commit()

        return FamilyReportResponse(
            booking_id=booking.id,
            family_report_text=family_report,
            generated_at=datetime.utcnow().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate family report: {str(e)}")
