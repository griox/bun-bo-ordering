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
                background: "#FFD700", // Vibrant Yellow
                paper: "#FFFFFF", // White for cards
                primary: "#D9381E", // Vibrant Red
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
                float: "float 6s ease-in-out infinite",
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
                float: {
                    "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                    "50%": { transform: "translateY(-10px) rotate(2deg)" },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
