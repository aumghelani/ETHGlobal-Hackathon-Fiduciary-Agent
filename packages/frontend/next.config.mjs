/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fiduciary/agents", "@fiduciary/hedera"],
  webpack: (config) => {
    // The agents package uses NodeNext-style ".js" extension imports in its TS
    // source; map them back to .ts/.tsx so Next's bundler can resolve them.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
