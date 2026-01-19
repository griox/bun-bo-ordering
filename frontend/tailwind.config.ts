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
                background: "#FFCC33", // Vivid Yellow
                paper: "#FFFFFF", // White for cards
                primary: "#000000", // Black for strong contrast buttons
                secondary: "#2D2D2D", // Dark Gray
                text: "#000000", // Black Text
            },
            fontFamily: {
                display: ["var(--font-edu-sa)", "cursive"],
                main: ["var(--font-edu-sa)", "cursive"],
            },
            backgroundImage: {
                'paper-pattern': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
                'retro-paper': "url('/images/retro-paper-texture.png')",
            },
            animation: {
                blob: "blob 7s infinite",
            },
            keyframes: {
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
