"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createBooking,
  type BookingRequest,
  type HospitalResult,
} from "@/lib/api";
import Link from "next/link";

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams?.get("reportId");

  const [hospital, setHospital] = useState<HospitalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "male",
    patientBloodType: "",
    patientAllergies: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
    appointmentDate: "",
    appointmentTime: "",
    ambulanceRequested: false,
  });

  useEffect(() => {
    const storedHospital = sessionStorage.getItem("selectedHospital");
    const storedTriage = sessionStorage.getItem("triageResult");

    if (storedHospital) {
      setHospital(JSON.parse(storedHospital));
    }

    if (storedTriage) {
      try {
        const triage = JSON.parse(storedTriage);
        if (triage.severity_score >= 8) {
          setFormData((prev) => ({ ...prev, ambulanceRequested: true }));
        }
      } catch (e) {
        console.error("Failed to parse triage", e);
      }
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hospital) {
      setError("No hospital selected. Please go back to results.");
      return;
    }

    if (
      !formData.patientName ||
      !formData.patientAge ||
      !formData.emergencyContactName ||
      !formData.emergencyContactPhone
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.appointmentDate || !formData.appointmentTime) {
      setError("Please select appointment date and time.");
      return;
    }

    setLoading(true);

    try {
      const storedTriage = sessionStorage.getItem("triageResult");
      let symptoms = "";
      let severityScore = 5;
      let recommendedSpecialty = "General Physician";

      if (storedTriage) {
        const triage = JSON.parse(storedTriage);
        symptoms = triage.ai_summary || "";
        severityScore = triage.severity_score || 5;
        recommendedSpecialty =
          triage.recommended_specialty || "General Physician";
      }

      const appointmentDateTime = new Date(
        `${formData.appointmentDate}T${formData.appointmentTime}`,
      ).toISOString();

      const bookingData: BookingRequest = {
        symptom_report_id: reportId ? parseInt(reportId) : undefined,
        hospital_place_id: hospital.place_id,
        hospital_name: hospital.name,
        hospital_address: hospital.address,
        hospital_phone: hospital.phone || undefined,
        patient_name: formData.patientName,
        patient_age: parseInt(formData.patientAge),
        patient_gender: formData.patientGender,
        patient_blood_type: formData.patientBloodType || undefined,
        patient_allergies: formData.patientAllergies || undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_email: formData.emergencyContactEmail || undefined,
        appointment_time: appointmentDateTime,
        ambulance_requested: formData.ambulanceRequested,
        symptoms,
        severity_score: severityScore,
        recommended_specialty: recommendedSpecialty,
      };

      const response = await createBooking(bookingData);

      sessionStorage.setItem("bookingConfirmation", JSON.stringify(response));
      router.push(`/confirmation?bookingId=${response.booking_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setLoading(false);
    }
  };

  if (!hospital) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "2rem",
          background: "var(--background)",
        }}
      >
        <div
          style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}
        >
          <h1
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              color: "var(--foreground)",
            }}
          >
            No Hospital Selected
          </h1>
          <p style={{ color: "var(--foreground-dim)", marginBottom: "2rem" }}>
            Please select a hospital from the results page first.
          </p>
          <Link href="/triage" className="btn-primary">
            Back to Triage
          </Link>
        </div>
      </div>
    );
  }

  const todayDate = new Date().toISOString().split("T")[0];
  const minTime = "08:00";
  const maxTime = "20:00";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "var(--background)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/results"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            ← Back to Results
          </Link>
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "0.5rem",
            color: "var(--foreground)",
            fontFamily: "var(--font-bebas)",
          }}
        >
          Book Appointment
        </h1>

        <div
          className="card"
          style={{
            padding: "1.5rem",
            marginBottom: "2rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              marginBottom: "0.5rem",
              color: "var(--primary)",
            }}
          >
            {hospital.name}
          </h3>
          <p
            style={{
              color: "var(--foreground-dim)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            📍 {hospital.address}
          </p>
          {hospital.phone && (
            <p style={{ color: "var(--foreground-dim)", fontSize: "0.9rem" }}>
              📞 {hospital.phone}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="card"
            style={{
              padding: "2rem",
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
                color: "var(--foreground)",
                fontFamily: "var(--font-bebas)",
              }}
            >
              Patient Information
            </h2>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label
                  htmlFor="patientName"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    htmlFor="patientAge"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Age *
                  </label>
                  <input
                    type="number"
                    id="patientAge"
                    name="patientAge"
                    value={formData.patientAge}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="patientGender"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Gender *
                  </label>
                  <select
                    id="patientGender"
                    name="patientGender"
                    value={formData.patientGender}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    htmlFor="patientBloodType"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Blood Type
                  </label>
                  <input
                    type="text"
                    id="patientBloodType"
                    name="patientBloodType"
                    value={formData.patientBloodType}
                    onChange={handleInputChange}
                    placeholder="e.g., A+, O-"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="patientAllergies"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Allergies
                  </label>
                  <input
                    type="text"
                    id="patientAllergies"
                    name="patientAllergies"
                    value={formData.patientAllergies}
                    onChange={handleInputChange}
                    placeholder="e.g., Penicillin"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              </div>
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                marginTop: "2rem",
                marginBottom: "1.5rem",
                color: "var(--foreground)",
                fontFamily: "var(--font-bebas)",
              }}
            >
              Emergency Contact
            </h2>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label
                  htmlFor="emergencyContactName"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                  }}
                >
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    htmlFor="emergencyContactPhone"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="emergencyContactEmail"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--foreground)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="emergencyContactEmail"
                    name="emergencyContactEmail"
                    value={formData.emergencyContactEmail}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              </div>
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                marginTop: "2rem",
                marginBottom: "1.5rem",
                color: "var(--foreground)",
                fontFamily: "var(--font-bebas)",
              }}
            >
              Appointment Details
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <label
                  htmlFor="appointmentDate"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                  }}
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  min={todayDate}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="appointmentTime"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                  }}
                >
                  Time *
                </label>
                <input
                  type="time"
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  min={minTime}
                  max={maxTime}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: formData.ambulanceRequested
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(0,212,168,0.05)",
                border: `1px solid ${formData.ambulanceRequested ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <input
                type="checkbox"
                id="ambulanceRequested"
                name="ambulanceRequested"
                checked={formData.ambulanceRequested}
                onChange={handleInputChange}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <label
                htmlFor="ambulanceRequested"
                style={{
                  color: "var(--foreground)",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                {formData.ambulanceRequested ? "🚨 " : ""}Request Ambulance
                Transportation
                {formData.ambulanceRequested && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "var(--foreground-dim)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Additional $300 fee applies
                  </span>
                )}
              </label>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "1rem",
                fontSize: "1.1rem",
                fontFamily: "var(--font-bebas)",
                letterSpacing: "0.05em",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Confirming Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
