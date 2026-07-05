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
  async rewrites() {
    // Uploads are stored on the API server's disk and served at `<api>/uploads/*`, but every
    // stored URL is RELATIVE (`/uploads/<key>`) so it resolves against the FRONTEND origin
    // (e.g. https://eng-crm...). Proxy that path to the API origin so images load through the
    // frontend domain (CDN-cacheable) while the files physically live on the API host.
    //
    // Set UPLOADS_ORIGIN to the API origin (e.g. https://eng-api.abdallaabdelsabour.com).
    // Falls back to NEXT_PUBLIC_API / NEXT_PUBLIC_URL, then to the local dev API port.
    const uploadsOrigin = (
      process.env.UPLOADS_ORIGIN ||
      process.env.NEXT_PUBLIC_API ||
      process.env.NEXT_PUBLIC_URL ||
      (process.env.local === "true" ? "http://localhost:4001" : "")
    ).replace(/\/+$/, "");

    if (!uploadsOrigin) return [];

    return [
      {
        source: "/uploads/:path*",
        destination: `${uploadsOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
