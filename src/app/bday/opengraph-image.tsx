import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Six cats and a cake with 41 candles in an antique oak frame";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BirthdayImage() {
  const [painting, frame, plaster] = await Promise.all([
    readFile(join(process.cwd(), "src/app/bday/cake-2026.png")),
    readFile(join(process.cwd(), "src/app/bday/frame-2026.png")),
    readFile(join(process.cwd(), "public/bday-plaster-2026.png")),
  ]);
  const image = (buffer: Buffer) =>
    `data:image/png;base64,${buffer.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5dfd1",
        backgroundImage: `url(${image(plaster)})`,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 510,
          height: 510,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse requires native images. */}
        <img
          src={image(painting)}
          alt=""
          width={382.5}
          height={382.5}
          style={{ position: "absolute", left: 63.75, top: 63.75 }}
        />
        {/* biome-ignore lint/performance/noImgElement: ImageResponse requires native images. */}
        <img
          src={image(frame)}
          alt=""
          width={510}
          height={510}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
      </div>
    </div>,
    size,
  );
}
