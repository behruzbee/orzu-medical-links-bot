/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'orzumed.uz',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
    // Разрешаем SVG (иногда требуется для безопасности)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;