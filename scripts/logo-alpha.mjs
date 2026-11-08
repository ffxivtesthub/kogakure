import sharp from 'sharp'
import { join } from 'node:path'

/**
 * For circular badges, find the actual outer gold ring before removing the
 * surrounding navy background. The artwork was not drawn at the canvas center:
 * simply cropping a centered square leaves the dark disk off-center.
 *
 * Wide logos keep their original edge-connected background removal.
 * Neither path changes the original source file.
 */
function detectGoldRing(data, width, height, channels) {
 const minSide = Math.min(width, height)
 const angles = Array.from({ length: 120 }, (_, i) => {
  const radians = i * Math.PI / 60
  return [Math.cos(radians), Math.sin(radians)]
 })
 function goldAt(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return false
  const k = (y * width + x) * channels
  const red = data[k], green = data[k + 1], blue = data[k + 2]
  return red > 158 && green > 100 && green < red * .91 && blue < green * .85
 }
 function score(cx, cy, radius) {
  let hits = 0
  for (const [cos, sin] of angles) {
   const x = Math.round(cx + radius * cos)
   const y = Math.round(cy + radius * sin)
   if (goldAt(x, y) || goldAt(x - 1, y) || goldAt(x + 1, y) ||
       goldAt(x, y - 1) || goldAt(x, y + 1)) hits++
  }
  return hits / angles.length
 }
 let best = { cx: 0, cy: 0, radius: 0, score: 0 }
 // Broad search, so slight shifts in the source image are still handled.
 for (let cx = Math.round(width * .46); cx <= width * .54; cx += 4) {
  for (let cy = Math.round(height * .42); cy <= height * .53; cy += 4) {
   for (let radius = Math.round(minSide * .37); radius <= minSide * .44; radius += 3) {
    const s = score(cx, cy, radius)
    if (s > best.score) best = { cx, cy, radius, score: s }
   }
  }
 }
 const coarse = best
 for (let cx = coarse.cx - 5; cx <= coarse.cx + 5; cx++) {
  for (let cy = coarse.cy - 5; cy <= coarse.cy + 5; cy++) {
   for (let radius = coarse.radius - 5; radius <= coarse.radius + 5; radius++) {
    const s = score(cx, cy, radius)
    if (s > best.score + .001) best = { cx, cy, radius, score: s }
   }
  }
 }
 if (best.score < .72) {
  throw new Error('Cannot identify a concentric gold ring. Verify the circular Logo source.')
 }
 return best
}

function cropCircularBadge(data, width, height, channels) {
 const ring = detectGoldRing(data, width, height, channels)
 // The navy disk is centered on the actual ring, not the PNG canvas.
 // Leave a restrained dark rim around the gold line.
 const diskRadius = ring.radius + Math.max(28, Math.round(ring.radius * .065))
 const halfSide = Math.ceil(diskRadius + 3)
 const left = Math.round(ring.cx - halfSide)
 const top = Math.round(ring.cy - halfSide)
 const side = halfSide * 2
 if (left < 0 || top < 0 || left + side > width || top + side > height) {
  throw new Error('Gold ring is too close to a source image boundary for a circular crop')
 }
 let transparent = 0
 for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
   const d = Math.hypot(x - ring.cx, y - ring.cy)
   // 2-pixel feather makes an antialiased circular edge, with no hard navy square.
   const a = Math.min(1, Math.max(0, (diskRadius - d) / 2))
   const i = (y * width + x) * channels + 3
   data[i] = Math.round(data[i] * a)
   if (data[i] === 0) transparent++
  }
 }
 console.log(`Badge ring: center (${ring.cx},${ring.cy}), radius ${ring.radius}px; source canvas center (${width / 2},${height / 2}); score ${ring.score.toFixed(2)}`)
 return { left, top, width: side, height: side, transparent }
}

function cropWideLogo(data, width, height, channels) {
 const count = width * height
 const visited = new Uint8Array(count)
 const queue = new Int32Array(count)
 let head = 0, tail = 0

 function background(at) {
  const i = at * channels
  const red = data[i], green = data[i + 1], blue = data[i + 2]
  return red < 56 && green < 52 && blue < 73 && blue >= red - 8
 }
 function enqueue(at) {
  if (at < 0 || at >= count || visited[at]) return
  visited[at] = 1
  if (background(at)) queue[tail++] = at
 }
 for (let x = 0; x < width; x++) {
  enqueue(x)
  enqueue((height - 1) * width + x)
 }
 for (let y = 0; y < height; y++) {
  enqueue(y * width)
  enqueue(y * width + width - 1)
 }
 let transparent = 0
 while (head < tail) {
  const at = queue[head++]
  const x = at % width, y = Math.floor(at / width)
  data[at * channels + 3] = 0
  transparent++
  if (x > 0) enqueue(at - 1)
  if (x < width - 1) enqueue(at + 1)
  if (y > 0) enqueue(at - width)
  if (y < height - 1) enqueue(at + width)
 }
 // Soften dark pixels immediately adjacent to the transparency.
 for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
   const at = y * width + x
   const i = at * channels
   if (data[i + 3] === 0) continue
   const adjacent = [-1, 1, -width, width].some(d => data[(at + d) * channels + 3] === 0)
   if (!adjacent) continue
   const brightness = Math.max(data[i], data[i + 1], data[i + 2])
   if (brightness < 125) data[i + 3] = Math.min(data[i + 3], Math.max(80, Math.round(brightness / 125 * 255)))
  }
 }
 let left = width, top = height, right = -1, bottom = -1
 for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
   if (data[(y * width + x) * channels + 3] === 0) continue
   left = Math.min(left, x); right = Math.max(right, x)
   top = Math.min(top, y); bottom = Math.max(bottom, y)
  }
 }
 if (right < left || bottom < top || transparent < count * .1) {
  throw new Error('Wide Logo background mask check failed')
 }
 const margin = 8
 left = Math.max(0, left - margin)
 top = Math.max(0, top - margin)
 right = Math.min(width - 1, right + margin)
 bottom = Math.min(height - 1, bottom + margin)
 return { left, top, width: right - left + 1, height: bottom - top + 1, transparent }
}

export async function buildTransparentLogo(root, sourceRelative, variants) {
 const source = join(root, sourceRelative)
 const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
 const { width, height, channels } = info
 const roundSeal = sourceRelative.includes('徽章')
 const crop = roundSeal
  ? cropCircularBadge(data, width, height, channels)
  : cropWideLogo(data, width, height, channels)

 for (const { path, maxWidth, quality } of variants) {
  let pipeline = sharp(data, { raw: { width, height, channels } }).extract({
   left: crop.left, top: crop.top, width: crop.width, height: crop.height,
  })
  if (maxWidth) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  const output = await pipeline.webp(
   quality ? { quality, alphaQuality: 100, effort: 6, smartSubsample: true }
           : { lossless: true, effort: 6 }
  ).toFile(join(root, 'public', 'images', path))
  console.log(`${path}: transparent ${output.width}x${output.height} / ${(output.size / 1024).toFixed(0)} KB / masked ${Math.round(crop.transparent / (width * height) * 100)}%`)
 }
}
