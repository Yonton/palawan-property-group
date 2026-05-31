import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://palawanpropertygroup.com',
  compressHTML: true,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    defaultQuality: 82,
  },
});