"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TriageResponse, HospitalResult } from "@/lib/api";

const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  low: {
    label: "LOW",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    icon: "✓",
  },
  medium: {
    label: "MEDIUM",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    icon: "!",
  },
  high: {
    label: "HIGH",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
    icon: "!!",
  },
  emergency: {
    label: "EMERGENCY",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    icon: "🚨",
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
      <span style={{ color: "var(--foreground-muted)", marginLeft: "0.25rem" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function HospitalCard({
  hospital,
  rank,
  reportId,
}: {
  hospital: HospitalResult;
  rank: number;
  reportId: number;
}) {
  const router = useRouter();
  const isFirst = rank === 1;

  const handleBook = () => {
    sessionStorage.setItem("selectedHospital", JSON.stringify(hospital));
    router.push(`/book?reportId=${reportId}`);
  };

  return (
    <div
      className="card card-hover"
      style={{
        padding: "1.5rem",
        border: isFirst
          ? "1px solid rgba(0,212,168,0.3)"
          : "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isFirst && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "rgba(0,212,168,0.12)",
            border: "1px solid rgba(0,212,168,0.25)",
            color: "var(--primary)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "0.2rem 0.6rem",
            borderRadius: "100px",
          }}
        >
          BEST MATCH
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {/* Rank */}
        <div
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2rem",
            color: isFirst ? "var(--primary)" : "var(--foreground-muted)",
            lineHeight: 1,
            minWidth: "2.5rem",
          }}
        >
          #{rank}
        </div>

        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: "0.25rem",
            }}
          >
            {hospital.name}
          </h3>
          <p
            style={{
              color: "var(--foreground-muted)",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            📍 {hospital.address}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "0.75rem",
              alignItems: "center",
            }}
          >
            {hospital.rating && <StarRating rating={hospital.rating} />}
            <span
              style={{ color: "var(--foreground-dim)", fontSize: "0.85rem" }}
            >
              🗺 {hospital.distance_km} km
            </span>
            {hospital.open_now === true && (
              <span
                style={{
                  color: "#22c55e",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                ● Open Now
              </span>
            )}
            {hospital.open_now === false && (
              <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                ● Closed
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--foreground-muted)",
              background: "var(--surface)",
              borderRadius: "6px",
              padding: "0.4rem 0.75rem",
              marginBottom: "1rem",
            }}
          >
            {hospital.match_reason}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleBook}
              className="btn-primary"
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
            >
              Book Appointment →
            </button>
            <a
              href={hospital.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                className="btn-ghost"
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                View on Maps ↗
              </button>
            </a>
            {hospital.phone && (
              <a href={`tel:${hospital.phone}`}>
                <button
                  className="btn-ghost"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                >
                  📞 Call
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("triageResult");
    if (stored) setResult(JSON.parse(stored));
  }, []);

  if (!result) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          className="spinner"
          style={{ width: 36, height: 36, borderWidth: 3 }}
        />
        <p style={{ color: "var(--foreground-muted)" }}>Loading results...</p>
        {mounted && (
          <Link href="/triage">
            <button className="btn-ghost" style={{ marginTop: "1rem" }}>
              ← Start New Assessment
            </button>
          </Link>
        )}
      </div>
    );
  }

  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const isEmergency = result.severity === "emergency";

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--background)",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div
          className={`${mounted ? "fade-up" : ""} ${isEmergency ? "pulse-emergency" : ""}`}
          style={{
            background: sev.bg,
            border: `1px solid ${sev.border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "3.5rem",
                color: sev.color,
                lineHeight: 1,
              }}
            >
              {result.severity_score}
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span
                  style={{
                    color: sev.color,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                  }}
                >
                  SEVERITY — {sev.label}
                </span>
                {isEmergency && <span style={{ fontSize: "1.2rem" }}>🚨</span>}
              </div>
              <p
                style={{
                  color: "var(--foreground-dim)",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem",
                }}
              >
                {result.escalation_message}
              </p>
            </div>
          </div>

          {isEmergency && (
            <a href="tel:112">
              <button
                className="btn-primary"
                style={{
                  background: "#ef4444",
                  fontSize: "1.05rem",
                  padding: "0.875rem 2rem",
                }}
              >
                📞 Call Emergency — 112
              </button>
            </a>
          )}
        </div>

        <div
          className={`card ${mounted ? "fade-up-delay-1" : ""}`}
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              AI Assessment
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  background: "rgba(0,212,168,0.08)",
                  border: "1px solid rgba(0,212,168,0.2)",
                  color: "var(--primary)",
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "100px",
                  fontWeight: 600,
                }}
              >
                {result.recommended_specialty}
              </span>
              <span
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground-dim)",
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "100px",
                }}
              >
                {result.estimated_visit_type}
              </span>
            </div>
          </div>

          <p
            style={{
              color: "var(--foreground)",
              lineHeight: 1.7,
              marginBottom: "1rem",
            }}
          >
            {result.ai_summary}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--foreground-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Confidence
            </span>
            <div
              style={{
                flex: 1,
                height: 6,
                background: "var(--border)",
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 3,
                  width: `${result.confidence_score * 100}%`,
                  background:
                    result.confidence_score > 0.7
                      ? "var(--primary)"
                      : "#f59e0b",
                  transition: "width 1s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--primary)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {Math.round(result.confidence_score * 100)}%
            </span>
          </div>

          {result.red_flags.length > 0 && (
            <div
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                padding: "0.875rem",
              }}
            >
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  marginBottom: "0.5rem",
                }}
              >
                ⚠ RED FLAGS DETECTED
              </p>
              {result.red_flags.map((flag) => (
                <p
                  key={flag}
                  style={{
                    color: "var(--foreground-dim)",
                    fontSize: "0.85rem",
                  }}
                >
                  • {flag}
                </p>
              ))}
            </div>
          )}
        </div>

        <div
          className={`card ${mounted ? "fade-up-delay-2" : ""}`}
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Doctor Card
              <span
                style={{
                  color: "var(--foreground-muted)",
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  marginLeft: "0.5rem",
                }}
              >
                — show this to your doctor
              </span>
            </h2>
            <button
              onClick={() =>
                navigator.clipboard?.writeText(result.symptom_card)
              }
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--foreground-muted)",
                padding: "0.25rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Copy
            </button>
          </div>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "8px",
              padding: "1rem",
              color: "var(--foreground)",
              lineHeight: 1.7,
              fontSize: "0.95rem",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            {result.symptom_card}
          </div>
        </div>

        {/* Pharmacy Option for Low Severity */}
        {result.severity === "low" && (
          <div
            className={`card ${mounted ? "fade-up-delay-2" : ""}`}
            style={{
              padding: "1.5rem",
              marginBottom: "1.5rem",
              background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  minWidth: "2.5rem",
                }}
              >
                💊
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: "0.5rem",
                  }}
                >
                  No Doctor Visit Needed
                </h3>
                <p
                  style={{
                    color: "var(--foreground-dim)",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                    lineHeight: 1.6,
                  }}
                >
                  Based on your assessment, you don't need to visit a doctor
                  right now. If you need any over-the-counter medications, you
                  can visit a nearby pharmacy to get what you need.
                </p>
                <Link href="/pharmacy">
                  <button
                    className="btn-primary"
                    style={{
                      background: "#22c55e",
                      color: "#ffffff",
                      padding: "0.75rem 1.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Find Nearby Pharmacies →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={mounted ? "fade-up-delay-3" : ""}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Nearby Hospitals
            </h2>
            <span
              style={{ color: "var(--foreground-muted)", fontSize: "0.85rem" }}
            >
              {result.total_hospitals_found} found · showing top{" "}
              {result.hospitals.length}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {result.hospitals.map((h, i) => (
              <HospitalCard
                key={h.place_id}
                hospital={h}
                rank={i + 1}
                reportId={result.report_id}
              />
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/triage">
            <button className="btn-ghost">← Start New Assessment</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
