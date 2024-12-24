// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  trailingSlash: 'never',
	integrations: [
		starlight({
			title: {
        en: 'My Docs',
        ja: 'マイ ドキュメント',
      },
			social: {
				github: 'https://github.com/withastro/starlight',
			},

      defaultLocale: 'ja',
      locales: {
        // English docs in `src/content/docs/en/`
        en: {
          label: 'English',
        },
        // Simplified Chinese docs in `src/content/docs/zh-cn/`
        ja: {
          label: '日本語',
        },
      },
		}),
	],
});
