import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import pkg from './package.json'

// Files in dist/ that should not be precached by the service worker.
// Legacy .woff fonts are skipped: every browser that can install a PWA uses the .woff2 copies.
const PRECACHE_EXCLUDE = [/^sw\.js$/, /\.map$/, /^vercel\.json$/, /\.woff$/]

function listFiles(dir: string, base = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full).split(path.sep).join('/')]
  })
}

/**
 * After the build, writes the list of every emitted file into dist/sw.js and stamps it
 * with a content hash. The service worker then caches the whole app on install (so the
 * first offline launch works), and each new build gets a new cache that replaces the old.
 */
function pwaPrecache(): Plugin {
  let outDir = 'dist'
  return {
    name: 'pwa-precache',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js')
      if (!fs.existsSync(swPath)) return

      const files = listFiles(outDir)
        .filter((file) => !PRECACHE_EXCLUDE.some((pattern) => pattern.test(file)))
        .sort()

      const template = fs.readFileSync(swPath, 'utf8')
      const hash = crypto.createHash('sha256').update(template)
      for (const file of files) {
        hash.update(file)
        hash.update(fs.readFileSync(path.join(outDir, file)))
      }
      const buildId = hash.digest('hex').slice(0, 12)

      const urls = ['/', ...files.map((file) => `/${file}`)]
      const source = template
        .replace('__BUILD_ID__', buildId)
        .replace('self.__PRECACHE_URLS__ ||', `${JSON.stringify(urls)} ||`)
      fs.writeFileSync(swPath, source)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pwaPrecache()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  }
})
