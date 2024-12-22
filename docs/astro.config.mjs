// @ts-check
import { defineConfig } from 'astro/config';

import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales: ["ja", "en"],
    defaultLocale: "ja",
    routing: {
      prefixDefaultLocale: true,
      // fallbackType: "rewrite"
    },
    // fallback: {
    //   en: "ja"
    // },
  },
  integrations: [markdoc()]
});
