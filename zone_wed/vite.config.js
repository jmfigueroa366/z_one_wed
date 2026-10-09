import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                app: resolve(projectRoot, 'index.html'),
            },
        },
    },
});
