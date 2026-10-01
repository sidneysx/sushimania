import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Versão do site (rodapé): "version" do package.json + commit do build.
// Na Vercel o commit vem da variável dela; no computador, do git.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))
const commit = (() => {
  try {
    return (process.env.VERCEL_GIT_COMMIT_SHA || execSync('git rev-parse HEAD').toString()).trim().slice(0, 7)
  } catch {
    return ''
  }
})()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __VERSAO__: JSON.stringify(version),
    __COMMIT__: JSON.stringify(commit),
  },
})
