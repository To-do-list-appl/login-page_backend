import js from '@eslint/js';
import globals from 'globals';
import googleConfig from 'eslint-config-google';

export default [
  googleConfig, 
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];