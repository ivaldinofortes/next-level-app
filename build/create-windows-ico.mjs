import fs from "node:fs";
import path from "node:path";

const iconsetDir = path.resolve("build/icon.iconset");
const outputPath = path.resolve("build/icon.ico");

const candidates = [
  { size: 16, file: "icon_16x16.png" },
  { size: 32, file: "icon_32x32.png" },
  { size: 64, file: "icon_64x64.png" },
  { size: 128, file: "icon_128x128.png" },
  { size: 256, file: "icon_256x256.png" },
];

const images = candidates
  .map(({ size, file }) => ({ size, data: fs.readFileSync(path.join(iconsetDir, file)) }))
  .filter(({ data }) => data.length > 0);

const headerSize = 6;
const entrySize = 16;
let offset = headerSize + images.length * entrySize;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

const entries = images.map(({ size, data }) => {
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

fs.writeFileSync(outputPath, Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]));
console.log(outputPath);
