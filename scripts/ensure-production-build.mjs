import { existsSync, readFileSync } from 'node:fs'

const buildIdPath = '.next/BUILD_ID'
const manifestPath = '.next/server/app-paths-manifest.json'

if (!existsSync(buildIdPath)) {
  console.error('No production build found. Run: npm run build')
  process.exit(1)
}

const routes = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (!routes['/api/chat/route']) {
  console.error('Production build is missing /api/chat. Run: npm run build')
  process.exit(1)
}
