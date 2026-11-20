/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/carta',
  // El enlace viejo (y los QR ya impresos) siguen llegando a la carta.
  redirects: async () => [{ source: '/', destination: '/carta', basePath: false, permanent: false }],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [new URL('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/**')],
  },
}

export default nextConfig
