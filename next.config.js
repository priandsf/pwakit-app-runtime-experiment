/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Apply to all http/https requests for a broad NetworkFirst
      handler: 'NetworkFirst',
      options: {
        cacheName: 'network-first',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200], // Cache opaque responses and successful responses
        },
      },
    },
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp)$/, // Cache images
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/, // Cache JS and CSS files
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        },
      },
    },
    // Example: Caching Google Fonts (if used)
    // {
    //   urlPattern: /^https:\/\/fonts.googleapis.com\/.*/,
    //   handler: 'CacheFirst',
    //   options: {
    //     cacheName: 'google-fonts-stylesheets',
    //   },
    // },
    // {
    //   urlPattern: /^https:\/\/fonts.gstatic.com\/.*/,
    //   handler: 'CacheFirst',
    //   options: {
    //     cacheName: 'google-fonts-webfonts',
    //     expiration: {
    //       maxEntries: 30,
    //       maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
    //     },
    //   },
    // },
  ],
});

// Define Content Security Policy
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

module.exports = withPWA(nextConfig);
