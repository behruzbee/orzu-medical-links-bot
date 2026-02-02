/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'orzumed.uz',
      pathname: '/wp-content/uploads/**',
    },
  ],
  dangerouslyAllowSVG: true,
  contentDispositionType: 'attachment',
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}

};

export default nextConfig;