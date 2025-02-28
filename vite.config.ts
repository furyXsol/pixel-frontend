import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inject from '@rollup/plugin-inject'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    return {
      plugins: [react(), svgr()],
      build:
        mode === 'production'
          ? {
              rollupOptions: {
                plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
              },
            }
          : undefined,
      define:
        mode === 'development'
          ? {
            global: {},
          }
        : undefined,
    };
});
