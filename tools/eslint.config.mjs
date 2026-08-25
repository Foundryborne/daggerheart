import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import { stylisticRules } from '../eslint.config.mjs';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    globalIgnores(['foundry/**/*']),
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: {
            '@stylistic': stylistic
        },
        languageOptions: { globals: globals.node },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': 0,
            ...stylisticRules
        }
    }
]);
