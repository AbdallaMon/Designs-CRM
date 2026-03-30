/**
 * Central configuration for all environment variables.
 * Always import env values from here — never read process.env directly in components or API files.
 *
 * Old key (v1): NEXT_PUBLIC_URL
 * New key (v2): NEXT_PUBLIC_API
 */
const config = {
  /** Base URL for all API requests (e.g. https://api.yourdomain.com) */
  apiUrl: process.env.NEXT_PUBLIC_API,
  legacyApiUrl: process.env.NEXT_PUBLIC_URL,
  /** App-level settings */
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Dream Studio",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  isDev: (process.env.NEXT_PUBLIC_APP_ENV ?? "development") === "development",
};

export default config;
