import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // <--- Важно: сканирует папку app
    "./lib/**/*.{js,ts,jsx,tsx,mdx}", // <--- Важно: если у вас есть компоненты в lib
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;