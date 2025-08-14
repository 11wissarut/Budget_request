// Simple HTTP server to serve static files
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { extname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = 3001

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
}

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  let filePath = req.url === '/' ? '/index.html' : req.url
  filePath = join(__dirname, filePath)

  if (!existsSync(filePath)) {
    res.writeHead(404)
    res.end('File not found')
    return
  }

  const ext = extname(filePath).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  try {
    const content = readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } catch (error) {
    res.writeHead(500)
    res.end('Server error')
  }
})

server.listen(PORT, () => {
  console.log(`Web server running at http://localhost:${PORT}`)
})
