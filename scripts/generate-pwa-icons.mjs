#!/usr/bin/env node
/**
 * App icon generator for Ruixe Blog.
 *
 * Reads the master source icon (`assets/app-icon.png`, a full-bleed opaque
 * 1184×1184 RGBA square) and produces every icon asset shipped by the site
 * using the `sharp` library:
 *
 *   - `app/icon.png`                 (rounded, transparent corners — browser
 *                                     tab, bookmarks, desktop PWA install)
 *   - `app/favicon.ico`              (multi-frame PNG-in-ICO 16/32/48, rounded,
 *                                     transparent corners; frame 32 leads the
 *                                     directory for first-frame consumers)
 *   - `app/apple-icon.png`           (opaque square — iOS applies its own mask
 *                                     and composites transparent corners onto
 *                                     black)
 *   - `public/icon-192.png`          (rounded `any`-purpose PWA icon)
 *   - `public/icon-512.png`          (rounded `any`-purpose PWA icon)
 *   - `public/icon-512-maskable.png` (opaque, content scaled into the central
 *                                     80% W3C safe zone over a navy canvas so
 *                                     Android adaptive masks do not clip it)
 *
 * Rounded outputs bake the corner radius in at generation time: an SVG
 * `<rect rx>` mask composited with `blend: 'dest-in'` keeps only the pixels
 * covered by the mask's anti-aliased alpha, dropping the corners. A single
 * `RATIO` (share of the canvas edge) keeps curvature consistent across sizes;
 * small ICO frames render at 4× and downsample with lanczos3 for smooth arcs.
 *
 * `app/favicon.ico` is assembled by a small hand-rolled ICO container
 * (6-byte ICONDIR + 16-byte directory entries + PNG payloads) with no extra
 * dependency, so it is rebuildable from the master source.
 *
 * `sharp` is a devDependency (already a transitive dep of `next` for
 * `next/image` optimization); pnpm's strict `node_modules` requires the
 * explicit declaration so this script can import it.
 *
 * Usage:
 *   pnpm generate-pwa-icons
 *
 * Output is deterministic: re-running with an unchanged source produces
 * byte-identical files. Generated icons are committed to git so Vercel builds
 * do not depend on the script running.
 *
 * @module generate-pwa-icons
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/** Absolute path to the project root (derived from this script's location). */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Absolute path to the master source icon (full-bleed opaque square). */
const SOURCE = path.join(root, 'assets', 'app-icon.png')

/** Absolute path to the Next.js file-convention icon directory (`app/`). */
const APP = path.join(root, 'app')

/** Absolute path to the static asset directory (`public/`). */
const PUBLIC = path.join(root, 'public')

/** Corner radius as a fraction of the canvas edge (rounded outputs only). */
const RATIO = 0.24

/** Supersampling factor for small ICO frames (rendered at 4×, then downscaled). */
const SCALE = 4

/** Dark navy background fill for the maskable safe-zone padding (`#03142E`). */
const BG = { r: 3, g: 20, b: 46, alpha: 1 }

/** W3C maskable safe-zone ratio (central 80% of the canvas). */
const SAFE_RATIO = 0.8

/** PWA icon sizes for the rounded `any` purpose (desktop install surfaces). */
const ANY_SIZES = [192, 512]

/**
 * ICO frame sizes; 32 leads the directory order for first-frame consumers
 * (webpack build path / `image-size`). Turbopack builds declare the largest
 * frame (48x48) in `<link sizes>`; the value is intentionally unconstrained.
 */
const ICO_FRAME_SIZES = [32, 16, 48]

/** Canvas size for the maskable icon. */
const MASKABLE_SIZE = 512

/**
 * Builds the rounded-rectangle SVG mask for a square canvas of `size` px.
 *
 * The SVG is transparent outside the rounded rect; composited with `dest-in`
 * it keeps the destination only where the mask has alpha (the fill color is
 * irrelevant — only the alpha channel is read), and the anti-aliased arc edge
 * yields smooth sub-pixel corners.
 *
 * @param {number} size - Canvas edge length in pixels the mask must cover.
 * @returns {Buffer} SVG document buffer sized exactly `size`×`size`.
 */
function buildRoundedMask(size) {
  const radius = size * RATIO
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>` +
      `</svg>`,
  )
}

/**
 * Renders the master source as a rounded PNG of exactly `size`×`size` px,
 * masking at the target size directly (192px and up need no supersampling).
 *
 * @param {number} size - Output edge length in pixels.
 * @returns {Promise<Buffer>} PNG image buffer with transparent corners.
 */
async function renderRoundedPng(size) {
  return sharp(SOURCE)
    .resize(size, size)
    .composite([{ input: buildRoundedMask(size), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/**
 * Renders a small rounded ICO frame at 4× and downsamples it with lanczos3 so
 * the arc stays smooth at 16–48px.
 *
 * @param {number} size - Target frame edge length in pixels.
 * @returns {Promise<Buffer>} PNG image buffer with transparent corners.
 */
async function renderRoundedFrame(size) {
  const canvas = size * SCALE
  const supersampled = await sharp(SOURCE)
    .resize(canvas, canvas)
    .composite([{ input: buildRoundedMask(canvas), blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(supersampled).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer()
}

/**
 * Assembles a PNG-in-ICO container from rendered frames.
 *
 * Layout: a 6-byte ICONDIR (reserved 0, type 1 = icon, frame count) followed
 * by one 16-byte ICONDIRENTRY per frame (edge length, palette size, color
 * planes, bit depth, payload length and offset) and the concatenated PNG
 * payloads. Multi-byte fields are little-endian; a directory edge of 0
 * encodes 256px.
 *
 * @param {Array<{ size: number, png: Buffer }>} frames - Frames in directory order.
 * @returns {Buffer} Complete `.ico` file contents.
 */
function buildIco(frames) {
  const directory = Buffer.alloc(6 + frames.length * 16)
  directory.writeUInt16LE(0, 0) // reserved
  directory.writeUInt16LE(1, 2) // resource type: icon
  directory.writeUInt16LE(frames.length, 4)
  let offset = directory.length
  frames.forEach(({ size, png }, index) => {
    const edge = size >= 256 ? 0 : size
    const entry = 6 + index * 16
    directory.writeUInt8(edge, entry) // width (0 = 256)
    directory.writeUInt8(edge, entry + 1) // height (0 = 256)
    directory.writeUInt8(0, entry + 2) // palette size (0 = default)
    directory.writeUInt8(0, entry + 3) // reserved
    directory.writeUInt16LE(1, entry + 4) // color planes
    directory.writeUInt16LE(32, entry + 6) // bits per pixel (RGBA)
    directory.writeUInt32LE(png.length, entry + 8) // payload size in bytes
    directory.writeUInt32LE(offset, entry + 12) // payload offset from file start
    offset += png.length
  })
  return Buffer.concat([directory, ...frames.map(({ png }) => png)])
}

/**
 * Generates all icon assets from the master source icon.
 *
 * @returns {Promise<void>} Resolves once all files are written.
 */
async function generateIcons() {
  const { width, height } = await sharp(SOURCE).metadata()
  if (!width || width !== height) {
    throw new Error(`Master icon must be a square image with a known size: ${SOURCE}`)
  }

  // Rounded browser icon at master resolution; the Next.js `icon` file
  // convention serves it for the tab, bookmarks and desktop install.
  await fs.writeFile(path.join(APP, 'icon.png'), await renderRoundedPng(width))

  // Rounded `any`-purpose PWA icons for unmasked desktop surfaces.
  for (const size of ANY_SIZES) {
    await fs.writeFile(path.join(PUBLIC, `icon-${size}.png`), await renderRoundedPng(size))
  }

  // Multi-frame rounded favicon, rebuilt into a PNG-in-ICO container.
  const frames = []
  for (const size of ICO_FRAME_SIZES) {
    frames.push({ size, png: await renderRoundedFrame(size) })
  }
  await fs.writeFile(path.join(APP, 'favicon.ico'), buildIco(frames))

  // Apple touch icon stays opaque and square: iOS applies its own rounded
  // mask and composites transparent corners onto black.
  await fs.writeFile(path.join(APP, 'apple-icon.png'), await sharp(SOURCE).png().toBuffer())

  // `maskable` stays opaque too: Android launchers apply their own shape
  // mask, so the content is scaled into the central 80% safe zone and padded
  // with the dark navy for a cohesive splash background.
  const contentSize = Math.round(MASKABLE_SIZE * SAFE_RATIO)
  const content = await sharp(SOURCE).resize(contentSize, contentSize).toBuffer()
  const maskable = await sharp({
    create: {
      width: MASKABLE_SIZE,
      height: MASKABLE_SIZE,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: content, gravity: 'center' }])
    .png()
    .toBuffer()
  await fs.writeFile(path.join(PUBLIC, 'icon-512-maskable.png'), maskable)

  console.log(
    '✓ Icons generated: app/icon.png, app/favicon.ico, app/apple-icon.png, public/icon-*.png',
  )
}

try {
  await generateIcons()
} catch (error) {
  console.error(error)
  process.exit(1)
}
