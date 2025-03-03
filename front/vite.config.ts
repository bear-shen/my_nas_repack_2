import {fileURLToPath, URL} from 'node:url'

import {defineConfig, UserConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    server: {
        hmr: {
            // server: '192.168.112.161:8085',
            // port: 8085,
            clientPort: 8085,
        },
    },
    plugins: [vue()],
    resolve: {
        alias: {
            // src: path.resolve('./src'),
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                // additionalData: '@use "sass:map"; @use "@/assets/variables.scss" as *;',
                silenceDeprecations: ['legacy-js-api'],
            }
        }
    },
    optimizeDeps: {
        include: [],
    },
    // publicDir:'public',
    build: {
        rollupOptions: {
            input: {
                index:'/index.html',
                share:'/share.html',
            }
        }
    }
})
