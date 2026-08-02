import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    // Lets every *.module.scss resolve `@use "variables" as *;` without ../../ chains.
    includePaths: [path.join(process.cwd(), 'styles')],
  },
};

export default nextConfig;
