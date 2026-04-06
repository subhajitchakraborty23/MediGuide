"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateFamilyReport, type BookingResponse } from "@/lib/api";
import Link from "next/link";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get("bookingId");

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [familyReport, setFamilyReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedBooking = sessionStorage.getItem("bookingConfirmation");
    if (storedBooking) {
      setBooking(JSON.parse(storedBooking));
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!bookingId) {
      setReportError("No booking ID found");
      return;
    }

    setLoadingReport(true);
    setReportError("");

    try {
      const response = await generateFamilyReport(parseInt(bookingId));
      setFamilyReport(response.family_report_text);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (familyReport) {
      navigator.clipboard.writeText(familyReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (familyReport) {
      const encodedText = encodeURIComponent(familyReport);
      window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    }
  };

  if (!booking) {
    return (
      <div style={{ minHeight: "100vh", padding: "2rem", background: "var(--background)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "var(--foreground)" }}>
            No Booking Found
          </h1>
          <p style={{ color: "var(--foreground-dim)", marginBottom: "2rem" }}>
            Please complete a booking first.
          </p>
          <Link href="/triage" className="btn-primary">
            Start New Triage
          </Link>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(booking.appointment_time);
  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", background: "var(--background)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "3rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
          >
            ✅
          </div>
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "0.5rem",
              color: "var(--primary)",
              fontFamily: "var(--font-bebas)",
              letterSpacing: "0.05em",
            }}
          >
            Booking Confirmed
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--foreground-dim)" }}>
            Your appointment has been successfully scheduled
          </p>
        </div>

        <div className="card" style={{ padding: "2rem", marginBottom: "2rem", background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
              color: "var(--foreground)",
              fontFamily: "var(--font-bebas)",
              letterSpacing: "0.05em",
            }}
          >
            Appointment Details
          </h2>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div>
              <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Patient
              </div>
              <div style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: "500" }}>
                {booking.patient_name}
              </div>
            </div>

            <div>
              <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Hospital
              </div>
              <div style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: "500" }}>
                {booking.hospital_name}
              </div>
              <div style={{ color: "var(--foreground-dim)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                📍 {booking.hospital_address}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Date
                </div>
                <div style={{ color: "var(--foreground)", fontSize: "1rem" }}>
                  {formattedDate}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Time
                </div>
                <div style={{ color: "var(--foreground)", fontSize: "1rem" }}>
                  {formattedTime}
                </div>
              </div>
            </div>

            {booking.ambulance_requested && (
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🚨</span>
                <div>
                  <div style={{ color: "#ef4444", fontWeight: "600", marginBottom: "0.25rem" }}>
                    Ambulance Requested
                  </div>
                  <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem" }}>
                    Emergency transportation has been dispatched
                  </div>
                </div>
              </div>
            )}

            <div>
              <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Estimated Cost
              </div>
              <div style={{ color: "var(--primary)", fontSize: "1.5rem", fontWeight: "600" }}>
                ${booking.estimated_cost_usd} USD
              </div>
              <div style={{ color: "var(--foreground-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                This is an estimate. Actual costs may vary based on treatment.
              </div>
            </div>

            <div>
              <div style={{ color: "var(--foreground-dim)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                Booking Status
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "rgba(0,212,168,0.15)",
                  border: "1px solid rgba(0,212,168,0.3)",
                  borderRadius: "6px",
                  color: "var(--primary)",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {booking.status}
              </div>
            </div>
          </div>
        </div>

        {!familyReport ? (
          <div className="card" style={{ padding: "2rem", marginBottom: "2rem", background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "var(--foreground)",
                fontFamily: "var(--font-bebas)",
                letterSpacing: "0.05em",
              }}
            >
              Family Report
            </h2>
            <p style={{ color: "var(--foreground-dim)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Generate a plain-language medical summary to share with your family members.
              This report explains the situation in simple terms they can understand.
            </p>

            {reportError && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  color: "#ef4444",
                }}
              >
                {reportError}
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={loadingReport}
              className="btn-primary"
              style={{
                padding: "0.875rem 2rem",
                fontSize: "1rem",
                opacity: loadingReport ? 0.6 : 1,
                cursor: loadingReport ? "not-allowed" : "pointer",
              }}
            >
              {loadingReport ? "Generating Report..." : "Generate Family Report"}
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: "2rem", marginBottom: "2rem", background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
                color: "var(--foreground)",
                fontFamily: "var(--font-bebas)",
                letterSpacing: "0.05em",
              }}
            >
              Family Report
            </h2>

            <div
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                color: "var(--foreground)",
                fontSize: "0.95rem",
              }}
            >
              {familyReport}
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={handleCopyReport}
                style={{
                  padding: "0.875rem 1.5rem",
                  background: copied ? "rgba(0,212,168,0.15)" : "var(--surface)",
                  border: `1px solid ${copied ? "rgba(0,212,168,0.3)" : "var(--border)"}`,
                  borderRadius: "8px",
                  color: copied ? "var(--primary)" : "var(--foreground)",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: "500",
                }}
              >
                {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
              </button>

              <button
                onClick={handleWhatsAppShare}
                style={{
                  padding: "0.875rem 1.5rem",
                  background: "#25D366",
                  border: "1px solid #1da851",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
              >
                📱 Share via WhatsApp
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <Link
            href="/"
            className="btn-secondary"
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
