import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#7CA590", // Sage Green
                paper: "#E6D7B9", // Beige Texture
                primary: "#D9381E", // Retro Red
                secondary: "#F2C94C", // Mustard Yellow
                text: "#2D2D2D", // Dark Charcoal
            },
            fontFamily: {
                display: ["var(--font-coiny)", "cursive"],
                main: ["var(--font-quicksand)", "sans-serif"],
            },
            backgroundImage: {
                'paper-pattern': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
            }
        },
    },
    plugins: [],
} satisfies Config;
