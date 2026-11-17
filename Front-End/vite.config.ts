import { defineConfig, loadEnv, type HtmlTagDescriptor, type PluginOption } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// Injected at build time only — the react plugin's dev preamble is an inline script
// that `script-src 'self'` would block, so dev mode must stay CSP-free.
// 'unsafe-inline' for styles is required by the codebase-wide inline style= usage.
// blob: frames + data:/blob: images serve the PDF previews and download links.
// NOTE: meta CSP can't express frame-ancestors — set that as a real header at the host.
function buildCsp(apiOrigin: string | null): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "frame-src 'self' blob:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function cspPlugin(apiOrigin: string | null): PluginOption {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(): HtmlTagDescriptor[] {
      return [{
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: buildCsp(apiOrigin) },
        injectTo: 'head-prepend',
      }]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_API_BASE_URL may be a relative path like /api (same-origin, already
  // covered by 'self') — only absolute URLs add a connect-src entry
  const apiOrigin = env.VITE_API_BASE_URL?.startsWith('http')
    ? new URL(env.VITE_API_BASE_URL).origin
    : null

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5171',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      tailwindcss(),
      react(),
      babel({
        presets: [reactCompilerPreset()],
        exclude: [/CandidatesPage\.tsx/],
      }),
      cspPlugin(apiOrigin),
    ],
  }
})
