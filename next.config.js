/** @type {import('next').NextConfig} */

// Define Content Security Policy
// Added 'self' to most directives for local resources.
// Added data: for img-src and font-src for inline data.
// 'unsafe-eval' and 'unsafe-inline' are often needed for dev and some libraries, review for production.
const ContentSecurityPolicy = `
  default-src 'self';
  img-src 'self' *.commercecloud.salesforce.com data:;
  script-src 'self' 'unsafe-eval' 'unsafe-inline' storage.googleapis.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  connect-src 'self' api.cquotient.com *.c360a.salesforce.com;
  frame-ancestors 'self';
  form-action 'self';
  object-src 'none';
  base-uri 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=15552000; includeSubDomains' // 6 months
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
          // You can add more headers here if needed
        ],
      },
    ];
  },
}

module.exports = nextConfig
