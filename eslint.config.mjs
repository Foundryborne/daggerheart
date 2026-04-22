import globals from 'globals';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';

export default defineConfig([
    { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.browser } },
    { plugins: { prettier } },
    {
        files: ['**/*.{js,mjs,cjs}'],
        rules: {
            'prettier/prettier': 'error'
        }
    }
]);
