// Pure-JS subset of Electron's nativeImage (PNG and JPEG), enough for logo trimming in main.js.
let PNG = null, jpeg = null;
try { ({ PNG } = require('pngjs')); } catch {}
try { jpeg = require('jpeg-js'); } catch {}

class NativeImage {
  // rgba: Buffer of width*height*4 in RGBA order
  constructor(w = 0, h = 0, rgba = Buffer.alloc(0)) { this.w = w; this.h = h; this.rgba = rgba; }
  isEmpty() { return !this.w || !this.h; }
  getSize() { return { width: this.w, height: this.h }; }
  toBitmap() {
    const out = Buffer.from(this.rgba);
    for (let i = 0; i < out.length; i += 4) { const r = out[i]; out[i] = out[i + 2]; out[i + 2] = r; }
    return out; // BGRA like Electron
  }
  toPNG() {
    if (!PNG || this.isEmpty()) return Buffer.alloc(0);
    const png = new PNG({ width: this.w, height: this.h });
    this.rgba.copy(png.data);
    return PNG.sync.write(png);
  }
  crop({ x, y, width, height }) {
    x = Math.max(0, x | 0); y = Math.max(0, y | 0);
    width = Math.min(width | 0, this.w - x); height = Math.min(height | 0, this.h - y);
    if (width <= 0 || height <= 0) return new NativeImage();
    const out = Buffer.alloc(width * height * 4);
    for (let r = 0; r < height; r++) this.rgba.copy(out, r * width * 4, ((y + r) * this.w + x) * 4, ((y + r) * this.w + x + width) * 4);
    return new NativeImage(width, height, out);
  }
  // Box-filter downscale (area average), nearest for upscale.
  resize({ width, height }) {
    if (this.isEmpty()) return this;
    const W = Math.max(1, Math.round(width || (height ? this.w * height / this.h : this.w)));
    const H = Math.max(1, Math.round(height || this.h * W / this.w));
    const out = Buffer.alloc(W * H * 4);
    const sx = this.w / W, sy = this.h / H;
    for (let y = 0; y < H; y++) {
      const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (let x = 0; x < W; x++) {
        const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let yy = y0; yy < y1 && yy < this.h; yy++) {
          for (let xx = x0; xx < x1 && xx < this.w; xx++) {
            const i = (yy * this.w + xx) * 4;
            r += this.rgba[i]; g += this.rgba[i + 1]; b += this.rgba[i + 2]; a += this.rgba[i + 3]; n++;
          }
        }
        const o = (y * W + x) * 4;
        out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
      }
    }
    return new NativeImage(W, H, out);
  }
}

function createFromBuffer(buf) {
  try {
    if (PNG && buf[0] === 0x89 && buf[1] === 0x50) {
      const p = PNG.sync.read(buf);
      return new NativeImage(p.width, p.height, p.data);
    }
    if (jpeg && buf[0] === 0xff && buf[1] === 0xd8) {
      const j = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
      return new NativeImage(j.width, j.height, Buffer.from(j.data));
    }
  } catch {}
  return new NativeImage(); // other formats (webp, svg): empty, main.js skips the logo
}

module.exports = { createFromBuffer, createEmpty: () => new NativeImage() };
