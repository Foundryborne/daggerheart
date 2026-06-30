import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

/** @type {Partial<RulesConfig>} */
export const stylisticRules = {
    '@stylistic/indent': [
        'error',
        4,
        {
            SwitchCase: 1
        }
    ],
    '@stylistic/max-len': ['error', { 
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
    }],
    '@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: 'always' }],
    '@stylistic/arrow-parens': ['error', 'as-needed'],
    '@stylistic/quote-props': ['error', 'as-needed'],
    '@stylistic/array-bracket-newline': ['error', 'consistent'],
    '@stylistic/key-spacing': 'error',
    '@stylistic/comma-dangle': ['error', 'never'],
    '@stylistic/space-in-parens': ['error', 'never'],
    '@stylistic/space-infix-ops': 2,
    '@stylistic/keyword-spacing': 2,
    '@stylistic/semi-spacing': 2,
    '@stylistic/no-multi-spaces': 2,
    '@stylistic/no-extra-semi': 2,
    '@stylistic/no-whitespace-before-property': 2,
    '@stylistic/space-unary-ops': 2
};

export default defineConfig([
    globalIgnores(['foundry/**/*', 'build/**/*']),
    {
        files: ['gulpfile.js', 'postcss.config.js'],
        languageOptions: { globals: globals.node }
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: {
            '@stylistic': stylistic
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                CONFIG: 'readonly',
                CONST: 'readonly',
                // Global classes
                Color: 'readonly',
                Handlebars: 'readonly',
                Hooks: 'readonly',
                PIXI: 'readonly',
                ProseMirror: 'readonly',
                Roll: 'readonly',
                // global namespaces
                canvas: 'readonly',
                foundry: 'readonly',
                game: 'readonly',
                ui: 'readonly',
                // global functions
                fromUuid: 'readonly',
                fromUuidSync: 'readonly',
                getDocumentClass: 'readonly',
                _del: 'readonly',
                _replace: 'readonly',
                _loc: 'readonly',
                // Documents
                ActiveEffect: 'readonly',
                Actor: 'readonly',
                BaseScene: 'readonly',
                ChatMessage: 'readonly',
                Combat: 'readonly',
                Combatant: 'readonly',
                Item: 'readonly',
                Macro: 'readonly',
                Scene: 'readonly',
                TokenDocument: 'readonly',
                // Other
                Collection: 'readonly',
                FormDataExtended: 'readonly',
                TextEditor: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': [
                'error',
                {
                    args: 'none',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_[A-Z]',
                    ignoreRestSiblings: true
                }
            ],
            ...stylisticRules
        }
    },
    {
        files: ['**/*.ts'],
        extends: [js.configs.recommended, tseslint.configs.recommended],
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            ...stylisticRules
        }
    }
]);
