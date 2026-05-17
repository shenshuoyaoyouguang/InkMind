// 生成简单的占位图标 PNG (512x512，蓝色背景 + "91" 文字)
// 运行: node scripts/generate-icon.js
// 用户应替换为正式设计的图标

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = join(__dirname, '..', 'build')

if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true })
}

// 生成一个简单的 256x256 蓝色 PNG 图标
// 使用最少的 PNG 结构：IHDR + IDAT + IEND
function createSimplePNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Raw image data: each row = filter byte (0) + RGB pixels
  const rowSize = 1 + width * 3
  const rawData = Buffer.alloc(rowSize * height)
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    rawData[rowOffset] = 0 // no filter
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3
      // 简单渐变效果
      const factor = 1 - (y / height) * 0.3
      rawData[px] = Math.floor(r * factor)
      rawData[px + 1] = Math.floor(g * factor)
      rawData[px + 2] = Math.floor(b * factor)
    }
  }

  // Compress with zlib
  const compressed = deflateSync(rawData)

  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type)
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const combined = Buffer.concat([typeBuffer, data])
    const crc = crc32(combined)
    const crcBuffer = Buffer.alloc(4)
    crcBuffer.writeUInt32BE(crc >>> 0, 0)
    return Buffer.concat([length, combined, crcBuffer])
  }

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// CRC32 implementation
function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const crc32Table = new Int32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crc32Table[i] = c
}

// 生成图标（蓝色主题 #2B5CE6）
const png = createSimplePNG(256, 256, 43, 92, 230)
writeFileSync(join(buildDir, 'icon.png'), png)
console.log('build/icon.png 已生成 (256x256 占位图标)')
console.log('请替换为正式设计的图标（建议 512x512 或更大）')
