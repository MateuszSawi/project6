import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Static export. The page has no API routes, no server actions, no dynamic
   * routes and no revalidation — every route already prerenders — so there is
   * nothing for a server to do at runtime. Netlify serves the `out/` folder as
   * plain files: no functions, no cold starts, nothing to keep warm.
   *
   * If a form, an API route or ISR is ever added, delete this line and the
   * `images` block below; Netlify's Next.js runtime takes over automatically.
   */
  output: 'export',

  /* No next/image on this site — every photograph is a plain <img> so that a
     missing file can fail softly. Declared anyway, so the export never trips. */
  images: { unoptimized: true },

  /* Emits /index.html per route, which is what a static host expects. */
  trailingSlash: true,

  sassOptions: {
    // Lets every *.module.scss resolve `@use "variables" as *;` without ../../ chains.
    includePaths: [path.join(process.cwd(), 'styles')],
  },
};

export default nextConfig;
