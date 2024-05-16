/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        colors: {
            text: "#281301",
            background: "#f0edea",
            primary: "#834002",
            secondary: "#b7b79e",
            accent: "#b96c13",
            "dark-text": "#fee9d7",
            "dark-background": "#15120f",
            "dark-primary": "#fdbb7c",
            "dark-secondary": "#616148",
            "dark-accent": "#ec9f46",
        },
        extend: {
            fontFamily: {
                inter: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
