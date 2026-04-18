import { readFile } from "node:fs/promises";
import path from "node:path";
import { Geist } from "next/font/google";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "m3000.io — Senior Design Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const geistSans = Geist({
  subsets: ["latin"],
});

const COLORS = {
  background: "#000000",
  border: "rgba(255, 255, 255, 0.12)",
  textPrimary: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.72)",
  textSoft: "rgba(255, 255, 255, 0.42)",
};

async function getAvatarDataUrl() {
  const avatarPath = path.join(process.cwd(), "public/me-avatar-dither.png");
  const avatar = await readFile(avatarPath);

  return `data:image/png;base64,${avatar.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const avatarSrc = await getAvatarDataUrl();

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: COLORS.background,
        color: COLORS.textPrimary,
        fontFamily: geistSans.style.fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 24% 22%, rgba(255, 47, 0, 0.28), transparent 30%), radial-gradient(circle at 78% 24%, rgba(189, 161, 80, 0.18), transparent 22%), radial-gradient(circle at 50% 100%, rgba(255, 47, 0, 0.2), transparent 36%), linear-gradient(180deg, #0a0a0a 0%, #050505 52%, #000000 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 36,
          border: `1px solid ${COLORS.border}`,
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 36,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.15) 68%, transparent)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "54px",
          justifyContent: "space-between",
          gap: "44px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            minWidth: 0,
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              lineHeight: 1.4,
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            m3000.io
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "780px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxWidth: "760px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  lineHeight: 1.15,
                  fontWeight: 400,
                  letterSpacing: "-0.05em",
                }}
              >
                I am Markus.
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  lineHeight: 1.15,
                  fontWeight: 600,
                  letterSpacing: "-0.05em",
                }}
              >
                Senior Design Engineer &
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  lineHeight: 1.15,
                  fontWeight: 600,
                  letterSpacing: "-0.05em",
                }}
              >
                Full-Stack Developer.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "560px",
                fontSize: 20,
                lineHeight: 1.4,
                fontWeight: 400,
                color: COLORS.textMuted,
                letterSpacing: "-0.03em",
              }}
            >
              Building systems that make complexity understandable through
              thoughtful design, clear structure, and reliable engineering.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            width: 310,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255, 47, 0, 0.5) 0%, rgba(255, 47, 0, 0.14) 44%, rgba(255, 47, 0, 0) 72%)",
              filter: "blur(8px)",
            }}
          />
          {/* biome-ignore lint/performance/noImgElement: next/og renders plain image elements inside ImageResponse */}
          <img
            src={avatarSrc}
            width="220"
            height="220"
            alt=""
            style={{
              objectFit: "cover",
              borderRadius: "999px",
            }}
          />
        </div>
      </div>
    </div>,
    size,
  );
}
