/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./remotion/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        purpleGradient: 'linear-gradient(180deg, #8C7DFE 0%, #5C4AE5 100%)',

        greenGradient: 'linear-gradient(180deg, #34D399 0%, #059669 100%)',

        primaryGradient: 'linear-gradient(180deg, #6C5DE1 0%, #4D3EBF 100%)',
      }
    },
  },
  plugins: [],
}