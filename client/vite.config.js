import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use the modern JSX runtime consistently. Without this configuration the
// development server may compile JSX to React.createElement, requiring a
// global React identifier and causing a blank login page.
export default defineConfig({
  plugins: [react()],
  esbuild: { jsx: 'automatic' }
});
