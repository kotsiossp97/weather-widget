import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    ignores: [
      "**/.history/**",
      "**/.husky/**",
      "**/.vscode/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, prettier },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    rules: {
      "prettier/prettier": "error",
    },
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
]);
