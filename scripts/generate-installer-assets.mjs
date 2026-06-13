import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'src-tauri', 'installer');

const colors = {
  bg: [17, 17, 17],
  bg2: [10, 10, 10],
  panel: [25, 25, 25],
  border: [43, 43, 43],
  accent: [255, 204, 0],
  accentDim: [128, 102, 0],
  text: [255, 255, 255],
  muted: [160, 166, 176],
};

function createBitmap(width, height, paint) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelOffset = 54;
  const fileSize = pixelOffset + rowSize * height;
  const bmp = Buffer.alloc(fileSize);

  bmp.write('BM', 0);
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(pixelOffset, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(width, 18);
  bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(rowSize * height, 34);

  const image = new Uint8Array(width * height * 3);
  const set = (x, y, rgb) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 3;
    image[i] = rgb[0];
    image[i + 1] = rgb[1];
    image[i + 2] = rgb[2];
  };

  const rect = (x, y, w, h, rgb) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) set(xx, yy, rgb);
    }
  };

  const line = (x0, y0, x1, y1, rgb) => {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      set(x0, y0, rgb);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const circle = (cx, cy, radius, rgb) => {
    let x = radius;
    let y = 0;
    let err = 0;
    while (x >= y) {
      [
        [x, y],
        [y, x],
        [-y, x],
        [-x, y],
        [-x, -y],
        [-y, -x],
        [y, -x],
        [x, -y],
      ].forEach(([px, py]) => set(cx + px, cy + py, rgb));
      y += 1;
      if (err <= 0) err += 2 * y + 1;
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }
  };

  paint({ set, rect, line, circle, width, height });

  for (let y = 0; y < height; y += 1) {
    const targetY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const src = (targetY * width + x) * 3;
      const dst = pixelOffset + y * rowSize + x * 3;
      bmp[dst] = image[src + 2];
      bmp[dst + 1] = image[src + 1];
      bmp[dst + 2] = image[src];
    }
  }

  return bmp;
}

function paintBackground(ctx) {
  const { set, width, height } = ctx;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const t = (x + y) / (width + height);
      set(x, y, colors.bg.map((v, i) => Math.round(v * (1 - t) + colors.bg2[i] * t)));
    }
  }
}

function paintDawnMark({ rect, line, circle }, x, y, scale = 1) {
  const s = (value) => Math.round(value * scale);
  rect(x, y, s(38), s(38), colors.panel);
  rect(x, y, s(38), s(2), colors.accent);
  rect(x, y + s(36), s(38), s(2), colors.border);
  rect(x, y, s(2), s(38), colors.accent);
  rect(x + s(36), y, s(2), s(38), colors.border);
  circle(x + s(19), y + s(19), s(11), colors.accent);
  line(x + s(8), y + s(14), x + s(30), y + s(24), colors.text);
  line(x + s(10), y + s(25), x + s(27), y + s(11), colors.accent);
  circle(x + s(19), y + s(19), s(3), colors.text);
}

function sidebar() {
  return createBitmap(164, 314, (ctx) => {
    paintBackground(ctx);
    const { rect, line, circle, width, height } = ctx;

    rect(0, 0, width, 1, colors.border);
    rect(width - 1, 0, 1, height, colors.border);
    paintDawnMark(ctx, 22, 28, 1.35);

    rect(24, 102, 76, 3, colors.accent);
    rect(24, 114, 106, 2, colors.border);
    rect(24, 124, 88, 2, colors.border);

    for (let i = 0; i < 4; i += 1) {
      const y = 184 + i * 22;
      circle(32, y, 5, colors.accent);
      rect(48, y - 2, 74 - i * 7, 4, i === 0 ? colors.accent : colors.border);
    }

    line(-12, 258, 112, 134, colors.accentDim);
    line(-8, 262, 116, 138, colors.accent);
    line(34, 322, 174, 182, colors.border);
  });
}

function header() {
  return createBitmap(150, 57, (ctx) => {
    paintBackground(ctx);
    const { rect, line, circle, width, height } = ctx;

    rect(0, height - 1, width, 1, colors.border);
    paintDawnMark(ctx, 12, 11, 0.82);

    rect(52, 16, 72, 3, colors.accent);
    rect(52, 27, 54, 2, colors.text);
    rect(52, 35, 70, 2, colors.muted);

    line(118, 48, 150, 16, colors.accentDim);
    circle(134, 18, 6, colors.accent);
  });
}

function wixDialog() {
  return createBitmap(493, 312, (ctx) => {
    paintBackground(ctx);
    const { rect, line, circle, width, height } = ctx;

    rect(0, 0, width, 1, colors.border);
    rect(0, height - 1, width, 1, colors.border);
    paintDawnMark(ctx, 40, 36, 1.6);

    rect(48, 126, 104, 4, colors.accent);
    rect(48, 142, 152, 2, colors.border);
    rect(48, 153, 118, 2, colors.border);

    for (let i = 0; i < 4; i += 1) {
      const y = 214 + i * 20;
      circle(56, y, 5, colors.accent);
      rect(72, y - 2, 90 - i * 9, 4, i === 0 ? colors.accent : colors.border);
    }

    line(-42, 300, 196, 62, colors.accentDim);
    line(-38, 304, 200, 66, colors.accent);
    line(324, 312, 506, 130, colors.border);
    circle(430, 72, 12, colors.accent);
  });
}

function wixBanner() {
  return createBitmap(493, 58, (ctx) => {
    paintBackground(ctx);
    const { rect, line, circle, width, height } = ctx;

    rect(0, height - 1, width, 1, colors.border);
    paintDawnMark(ctx, 18, 10, 0.88);
    rect(64, 16, 102, 3, colors.accent);
    rect(64, 28, 76, 2, colors.text);
    rect(64, 37, 114, 2, colors.muted);
    line(width - 86, height, width - 28, 0, colors.accentDim);
    circle(width - 42, 20, 7, colors.accent);
  });
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sidebar.bmp'), sidebar());
writeFileSync(join(outDir, 'header.bmp'), header());
writeFileSync(join(outDir, 'wix-dialog.bmp'), wixDialog());
writeFileSync(join(outDir, 'wix-banner.bmp'), wixBanner());
