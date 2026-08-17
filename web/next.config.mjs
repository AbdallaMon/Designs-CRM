/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "",
  },
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "http://localhost:3000",
  ],
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
