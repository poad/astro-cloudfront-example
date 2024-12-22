import { defineCollection, z } from "astro:content";

const docsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'ja']),
    // 他のフィールド
  })
});

export const collections = {
  'docs': docsCollection,
};
