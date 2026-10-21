/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/record.html", destination: "/record", permanent: true },
      { source: "/faq.html", destination: "/faq", permanent: true },
      { source: "/terms.html", destination: "/terms", permanent: true },
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};
export default nextConfig;
