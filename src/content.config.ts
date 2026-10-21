import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        /** Who the page is for, shown under its title (DocsPageTitle.astro). */
        audience: z.array(z.enum(['everyone', 'user', 'installer', 'integrator'])).optional(),
        /** About how long the task takes, for example "10 minutes". */
        time: z.string().optional(),
      }),
    }),
  }),
};
