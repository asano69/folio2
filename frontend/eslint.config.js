import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/recommended";

// Flat config (ESLint 9+). Only src/ is linted; build output and
// node_modules are excluded by default (no need to list them here).
export default [
  js.configs.recommended,
  solid,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
