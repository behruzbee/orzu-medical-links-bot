/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'orzumed.uz', // 👈 Разрешаем загрузку картинок с этого сайта
        port: '',
        pathname: '/wp-content/uploads/**', // Разрешаем папку uploads
      },
    ],
    // Разрешаем SVG (так как логотип в формате .svg)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;