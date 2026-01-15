/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Para exportación estática
  distDir: 'out',
  images: {
    unoptimized: true, // Para exportación estática
  },
  trailingSlash: true, // Opcional, ayuda con rutas
}

module.exports = nextConfig