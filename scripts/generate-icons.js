// Run: node scripts/generate-icons.js
// Requires: npm install canvas  (or bun add canvas)
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#2D6A4F";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${Math.round(size * 0.38)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("XB", size / 2, size / 2);

  return canvas.toBuffer("image/png");
}

const publicDir = path.join(__dirname, "..", "public");
fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateIcon(192));
fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateIcon(512));
console.log("Icons generated: public/icon-192.png, public/icon-512.png");
