// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import tseslint from 'typescript-eslint';
import * as mdx from 'eslint-plugin-mdx';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  {
    ignores: [
      '**/*.d.ts',
      '*.{js,jsx}',
      '*.svg',
      'src/tsconfig.json',
      'src/stories',
      '**/*.css',
      'node_modules/**/*',
      'out',
      'cdk.out',
      'dist',
      '.astro/*',
    ],
    files: ['src/**/*.{js,ts,mdx,md,astro}'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  {
    files: ['src/**/*.{md,mdx}'],
    ...mdx.flat,
    ...mdx.flatCodeBlocks,
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      languageMapper: {},
    }),
    rules: {
      ...mdx.flatCodeBlocks.rules,
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.{js,ts}'],
    plugins: {
      '@stylistic': stylistic,
      '@stylistic/ts': stylisticTs,
    },
    rules: {
      '@stylistic/semi': 'error',
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/quates': ['error', 'single'],
    },
  },
);
