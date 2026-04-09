import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "m3000.io — Senior Design Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const COLORS = {
  background: "#000000",
  border: "rgba(255, 255, 255, 0.12)",
  textPrimary: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.72)",
  textSoft: "rgba(255, 255, 255, 0.42)",
};

async function getIconDataUrl() {
  const iconPath = path.join(process.cwd(), "src/app/icon.png");
  const icon = await readFile(iconPath);

  return `data:image/png;base64,${icon.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const iconSrc = await getIconDataUrl();

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
        fontFamily:
          '"Geist", "Geist Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
              fontSize: 24,
              fontWeight: 600,
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
                fontSize: 62,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "-0.06em",
                maxWidth: "760px",
              }}
            >
              Senior Design Engineer & Full-Stack Developer.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "560px",
                fontSize: 26,
                lineHeight: 1.25,
                color: COLORS.textMuted,
                letterSpacing: "-0.03em",
              }}
            >
              Since 2011, working with data and information technology.
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
            src={iconSrc}
            width="220"
            height="220"
            alt=""
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>,
    size,
  );
}
