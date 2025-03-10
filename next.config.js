/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   enableWebAuthn: true,
  // },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     // Don't bundle server-only modules on client-side
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       net: false,
  //       tls: false,
  //       crypto: false,
  //       os: false,
  //       path: false,
  //       stream: false,
  //       http: false,
  //       https: false,
  //       zlib: false,
  //     };
  //   }
  //   return config;
  // }
};

module.exports = nextConfig; 