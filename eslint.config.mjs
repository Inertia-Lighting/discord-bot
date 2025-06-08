import stylistic from '@stylistic/eslint-plugin';
import { globalIgnores } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';


export default [
  { languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  globalIgnores(['dist/'], 'Build Folder'),
  globalIgnores(['.yarn/**/*'], 'Yarn Stuff'),
  globalIgnores(['src/types/zod/**/*', 'src/lib/prisma/**/*'], 'Prisma stuff'),
  /* -------------------------------------------------------------------------- */
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    }
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      // '@stylistic/indent': ['warn', 4],
      // '@stylistic/eol-last': ['warn', 'always'],
      // '@stylistic/linebreak-style': ['error', 'windows'],
      '@stylistic/quotes': ['warn', 'single'],
      '@stylistic/no-confusing-arrow': ['warn', { 'onlyOneSimpleParam': true }],
      '@stylistic/spaced-comment': ['warn', 'always']
    }
  },
  /* -------------------------------------------------------------------------- */
  {
    rules: {
      'no-duplicate-imports': 'warn',
      /* -------------------------------------------------------------------------- */
      'complexity': ['error', 20],
      'default-case': 'warn',
      'default-case-last': 'warn',
      'dot-notation': 'warn',
      'eqeqeq': 'warn',
      'id-length': ['off', { 'min': 2 }],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 2],
      'max-params': ['error', 5],
      'no-array-constructor': 'error',
      'no-delete-var': 'error',
      'no-empty': 'warn',
      'no-empty-function': 'warn',
      'no-eq-null': 'warn',
      'no-eval': 'error',
      'no-extra-label': 'warn',
      'no-implied-eval': 'warn',
      'no-invalid-this': 'error',
      'no-label-var': 'error',
      'no-lonely-if': 'warn',
      'no-negated-condition': 'error',
      'no-new-wrappers': 'warn',
      'no-param-reassign': 'error',
      'no-proto': 'warn',
      'no-redeclare': 'error',
      'no-return-assign': 'warn',
      'no-shadow': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      // 'no-useless-return': 'warn',
      'no-var': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-const': 'warn',
      'sort-vars': 'warn',
      'vars-on-top': 'warn',
      'yoda': 'warn'
    }
  }
];