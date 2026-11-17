import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Vitra — Thoughtful, ATS-Friendly CV Studio for Nigeria & Global Careers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#161B26",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Accent Top Border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "10px",
            backgroundColor: "#F8D849",
          }}
        />

        {/* Brand Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#242A3D",
            padding: "8px 24px",
            borderRadius: "999px",
            border: "2px solid #333C52",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#34D399",
            marginBottom: "24px",
            letterSpacing: "2px",
          }}
        >
          <span>●</span>
          <span>NIGERIAN &amp; GLOBAL CAREER STUDIO</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "900",
            letterSpacing: "-1px",
            margin: "0 0 16px 0",
            textAlign: "center",
            color: "#FFFFFF",
            display: "flex",
          }}
        >
          VITRA ATS CV BUILDER
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "850px",
            margin: "0 0 36px 0",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          Thoughtful, ATS-compliant CV creation tailored for Nigerian graduates, NYSC corp members, experienced professionals &amp; international applicants.
        </div>

        {/* Feature Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#1E2333",
              border: "2px solid #333C52",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#F8D849",
              display: "flex",
            }}
          >
            9 ATS-Conscious Templates
          </div>
          <div
            style={{
              backgroundColor: "#1E2333",
              border: "2px solid #333C52",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#38BDF8",
              display: "flex",
            }}
          >
            Vector PDF &amp; Word (.docx)
          </div>
          <div
            style={{
              backgroundColor: "#1E2333",
              border: "2px solid #333C52",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#4ADE80",
              display: "flex",
            }}
          >
            Paystack Naira Payments
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
