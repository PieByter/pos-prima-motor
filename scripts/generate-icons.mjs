import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIZES = [16, 32, 48, 72, 96, 144, 192, 512];
const SRC = path.join(__dirname, "..", "public", "icons", "icon.svg");
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

async function generate() {
  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC).resize(size, size).png().toFile(outPath);
    console.log(`✅ icon-${size}.png`);
  }
  // favicon for browser tab
  await sharp(SRC)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, "..", "public", "favicon.ico"));
  console.log("✅ favicon.ico");
}

generate().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
