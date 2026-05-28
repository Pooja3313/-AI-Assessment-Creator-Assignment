/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vedaai/types", "@react-pdf/renderer"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
