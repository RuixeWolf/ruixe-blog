#!/usr/bin/env node
/**
 * PWA icon generator for Ruixe Blog.
 *
 * Reads the source icon (`app/icon.png`, 1184×1184 RGBA) and produces three
 * PWA icon PNGs in `public/` using the `sharp` library:
 *
 *   - `icon-192.png`           (192×192, purpose: any)
 *   - `icon-512.png`           (512×512, purpose: any)
 *   - `icon-512-maskable.png`  (512×512, purpose: maskable, content scaled to
 *                               the central 80% safe zone with `#f4f5f6`
 *                               padding so Android adaptive masks do not clip
 *                               the logo)
 *
 * The maskable safe zone follows the W3C maskable spec (central 80%). The
 * background fill `#f4f5f6` is the sRGB hex of the light `--background` oklch
 * token (`oklch(97.02% 0.0015 243.6)`), matching the site's light theme.
 *
 * `sharp` is a devDependency (already a transitive dep of `next` for
 * `next/image` optimization); pnpm's strict `node_modules` requires the
 * explicit declaration so this script can import it.
 *
 * Usage:
 *   pnpm generate-pwa-icons
 *
 * Output is deterministic: re-running with an unchanged source produces
 * byte-identical files. Generated PNGs are committed to git so Vercel builds
 * do not depend on the script running.
 *
 * @module generate-pwa-icons
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/** Absolute path to the project root (derived from this script's location). */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Absolute path to the source icon (Next.js favicon file convention). */
const SOURCE = path.join(root, 'app', 'icon.png')

/** Absolute path to the `public/` output directory. */
const PUBLIC = path.join(root, 'public')

/** Light-theme background fill for the maskable safe-zone padding (`#f4f5f6`). */
const BG = { r: 244, g: 245, b: 246, alpha: 1 }

/** W3C maskable safe-zone ratio (central 80% of the canvas). */
const SAFE_RATIO = 0.8

/** PWA icon sizes for the `any` purpose (192 + 512). */
const ANY_SIZES = [192, 512]

/** Canvas size for the maskable icon. */
const MASKABLE_SIZE = 512

/**
 * Generates all PWA icons from the source image.
 *
 * @returns {Promise<void>} Resolves once all files are written.
 */
async function generatePwaIcons() {
  // `any` purpose icons: full-canvas resize, no padding (splash screens).
  await Promise.all(
    ANY_SIZES.map((size) =>
      sharp(SOURCE)
        .resize(size, size)
        .png()
        .toFile(path.join(PUBLIC, `icon-${size}.png`)),
    ),
  )

  // `maskable` purpose icon: scale content to the central 80% safe zone, then
  // composite onto a 512×512 background canvas so platform-shaped masks do
  // not clip the logo.
  const contentSize = Math.round(MASKABLE_SIZE * SAFE_RATIO)
  const content = await sharp(SOURCE).resize(contentSize, contentSize).toBuffer()
  await sharp({
    create: {
      width: MASKABLE_SIZE,
      height: MASKABLE_SIZE,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: content, gravity: 'center' }])
    .png()
    .toFile(path.join(PUBLIC, 'icon-512-maskable.png'))

  console.log('✓ PWA icons generated in public/')
}

generatePwaIcons().catch((error) => {
  console.error(error)
  process.exit(1)
})
