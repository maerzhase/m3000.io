import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "images");
fs.mkdirSync(dir, { recursive: true });

const colors = [
  "#ff2f00", "#ff4422", "#ff5a33", "#cc2600", "#e83300",
  "#bda150", "#d4b85c", "#c9a84c", "#a88e40", "#b89745",
  "#ff2f00", "#cc2600", "#ff5a33", "#e83300", "#bda150",
];

for (let i = 1; i <= 15; i++) {
  const c = colors[i - 1];
  // Create a subtle geometric pattern SVG
  const hue = parseInt(c.slice(1, 3), 16);
  const pattern = i % 3;

  let shapes = "";
  if (pattern === 0) {
    // Grid dots
    for (let x = 20; x < 400; x += 30) {
      for (let y = 20; y < 260; y += 30) {
        const opacity = (0.1 + Math.random() * 0.3).toFixed(2);
        const r = 1.5 + Math.random() * 2;
        shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${opacity}"/>`;
      }
    }
  } else if (pattern === 1) {
    // Diagonal lines
    for (let x = -260; x < 500; x += 18) {
      const opacity = (0.08 + Math.random() * 0.2).toFixed(2);
      shapes += `<line x1="${x}" y1="0" x2="${x + 260}" y2="260" stroke="${c}" stroke-width="1" opacity="${opacity}"/>`;
    }
  } else {
    // Concentric rectangles
    for (let s = 10; s < 200; s += 16) {
      const opacity = (0.05 + (s / 200) * 0.2).toFixed(2);
      shapes += `<rect x="${200 - s}" y="${130 - s * 0.65}" width="${s * 2}" height="${s * 1.3}" rx="4" fill="none" stroke="${c}" stroke-width="0.5" opacity="${opacity}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
  <rect width="400" height="260" fill="#0a0a0a"/>
  ${shapes}
  <text x="200" y="138" text-anchor="middle" fill="${c}" font-family="monospace" font-size="11" opacity="0.4">placeholder ${i}</text>
</svg>`;

  fs.writeFileSync(path.join(dir, `placeholder-${i}.svg`), svg);
  console.log(`[v0] Created placeholder-${i}.svg`);
}

console.log("[v0] All 15 placeholder images created");
