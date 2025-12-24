/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "",
  },

  async rewrites() {
    // Only in local dev when you explicitly set: local="true"
    if (process.env.local === "true") {
      return [
        {
          source: "/uploads/:path*",
          destination: "http://localhost:4000/uploads/:path*",
        },
      ];
    }

    return [];
  },
};

export default nextConfig;
