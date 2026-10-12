/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace', 'Consolas', '"Liberation Mono"'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        thermal: {
          paper: '#fbfbf9',
          ink: '#111827',
          faint: '#6b7280',
          feed: '#e5e7eb',
        }
      }
    },
  },
  plugins: [],
}
