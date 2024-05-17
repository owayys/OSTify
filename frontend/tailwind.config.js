import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        colors: {
            text: "#f4f1ef",
            background: "#0f0a08",
            primary: "#dbae98",
            secondary: "#83401f",
            accent: "#e36c32",
        },
        extend: {
            fontFamily: {
                inter: ["Roboto", "sans-serif"],
            },
        },
    },
    plugins: [tailwindScrollbar],
};
