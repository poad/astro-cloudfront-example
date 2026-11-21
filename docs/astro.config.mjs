// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import solidJs from '@astrojs/solid-js';
import tailwind from '@tailwindcss/vite';

import path from 'node:path';

// Solid v2 で削除されたレガシーな `solid-js` サブパス。
// Solid v1 時代のツールチェーン（vite-plugin-solid / @astrojs/solid-js-renderer）が
// これらのサブパスを参照するため、Vite の解決・最適化対象から除外する。
const LEGACY_SOLID_SUBPATHS = [
  'solid-js/web',
  'solid-js/store',
  'solid-js/html',
  'solid-js/h',
];

function isLegacySolidSubpath(entry) {
  return typeof entry === 'string' && LEGACY_SOLID_SUBPATHS.includes(entry);
}

function cleanLegacyEntries(list) {
  if (!Array.isArray(list)) return list;
  return list.filter((entry) => !isLegacySolidSubpath(entry));
}

function cleanResolve(resolve) {
  if (!resolve) return;
  resolve.dedupe = cleanLegacyEntries(
    Array.isArray(resolve.dedupe) ? resolve.dedupe : [],
  );
  resolve.noExternal = cleanLegacyEntries(
    Array.isArray(resolve.noExternal) ? resolve.noExternal : [],
  );
  resolve.external = cleanLegacyEntries(
    Array.isArray(resolve.external) ? resolve.external : [],
  );
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', slug: 'guides/example' },
          ],
        },
        {
          label: 'Reference',
          items: [{ autogenerate: { directory: 'reference' } }],
        },
      ],
    }),
    solidJs({
      devtools: false,
      include: ['src/components/**/*', '**/node_modules/@kobalte/**'],
    }),
  ],
    vite: {
    plugins: [
      {
        name: 'solid-v2-config-cleanup',
        enforce: 'pre',
        configResolved(config) {
          cleanResolve(config.resolve);

          config.optimizeDeps = {
            ...config.optimizeDeps,
            include: cleanLegacyEntries(
              Array.isArray(config.optimizeDeps?.include)
                ? config.optimizeDeps.include
                : [],
            ),
          };

          const cleanEnvironment = (environment) => {
            if (!environment) return;
            cleanResolve(environment.resolve);
            environment.optimizeDeps = {
              ...environment.optimizeDeps,
              include: cleanLegacyEntries(
                Array.isArray(environment.optimizeDeps?.include)
                  ? environment.optimizeDeps.include
                  : [],
              ),
            };
          };

          for (const key of Object.keys(config.environments ?? {})) {
            cleanEnvironment(config.environments[key]);
          }
        },
      },
      tailwind(),
    ],
    resolve: {
      alias: [
        {
          find: /^@solidjs\/solid-js-renderer\/client(\.js)?$/,
          replacement: path.resolve(
            './src/solid-v2/renderer-client.ts',
          ),
        },
        {
          find: /^@astrojs\/solid-js-renderer\/client(\.js)?$/,
          replacement: path.resolve('./src/solid-v2/renderer-client.ts'),
        },
        {
          find: /^@solidjs\/solid-js-renderer\/server(\.js)?$/,
          replacement: path.resolve('./src/solid-v2/renderer-server.ts'),
        },
        {
          find: /^@astrojs\/solid-js-renderer\/server(\.js)?$/,
          replacement: path.resolve('./src/solid-v2/renderer-server.ts'),
        },
        { find: /^solid-js\/web$/, replacement: '@solidjs/web' },
        { find: /^solid-js\/store$/, replacement: 'solid-js' },
      ],
    },
  },
});
