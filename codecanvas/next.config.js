/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    async rewrites() {
        return [{
            source: '/json/:path*.json',
            destination: '/json/:path*.json/',
        }, ];
    },
}

module.exports = nextConfig