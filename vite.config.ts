import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, lazyPlugins } from 'vite-plus'

export default defineConfig({
  fmt: {
    printWidth: 120,
    tabWidth: 2,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    sortImports: {
      groups: [
        'type-import',
        ['value-builtin', 'value-external'],
        'type-internal',
        'value-internal',
        ['type-parent', 'type-sibling', 'type-index'],
        ['value-parent', 'value-sibling', 'value-index'],
        'unknown',
      ],
    },
    sortTailwindcss: {
      stylesheet: './src/styles.css',
      functions: ['clsx', 'cn', 'cva', 'twMerge'],
    },
    sortPackageJson: true,
    ignorePatterns: ['pnpm-lock.yaml'],
  },
  staged: {
    '*': 'vp lint --fix',
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react', 'import'],
    jsPlugins: [
      'eslint-plugin-react-you-might-not-need-an-effect',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    categories: {
      correctness: 'warn',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    env: {
      builtin: true,
      es2026: true,
      browser: true,
      node: true,
    },
    rules: {
      curly: ['error', 'all'],
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: false,
        },
      ],
      'import/namespace': 'off',
      'no-console': 'off',
      'no-useless-escape': 'off',
      'prefer-arrow-callback': [
        'error',
        {
          allowNamedFunctions: true,
        },
      ],
      'react/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/no-array-index-key': 'off',
      'react/no-danger': 'off',
      'react/only-export-components': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-invalid-fetch-options': 'off',
      'unicorn/no-useless-fallback-in-spread': 'off',
      'unicorn/prefer-string-starts-ends-with': 'off',
      'vitest/require-mock-type-parameters': 'off',
      'react-you-might-not-need-an-effect/no-adjust-state-on-prop-change': 'warn',
      'react-you-might-not-need-an-effect/no-chain-state-updates': 'warn',
      'react-you-might-not-need-an-effect/no-derived-state': 'warn',
      'react-you-might-not-need-an-effect/no-event-handler': 'warn',
      'react-you-might-not-need-an-effect/no-external-store-subscription': 'warn',
      'react-you-might-not-need-an-effect/no-initialize-state': 'warn',
      'react-you-might-not-need-an-effect/no-pass-data-to-parent': 'warn',
      'react-you-might-not-need-an-effect/no-pass-live-state-to-parent': 'warn',
      'react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change': 'warn',
    },
  },
  plugins: lazyPlugins(() => [react(), tailwindcss(), cloudflare()]),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
