/** @type {import('next').NextConfig} */

// Cabeçalhos de segurança aplicados a todas as rotas (prompt §8 — Segurança nível alto).
// Observação sobre CSP: o Stripe Checkout roda em domínio próprio (redirect), então
// não precisamos liberar frame do Stripe aqui. Quando entrarem os snippets de tracking
// (skill conversion-tracking: GA4 / Meta Pixel), esta CSP será ajustada para permitir
// exatamente os domínios necessários — mantida restritiva por padrão até lá.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' em script cobre o snippet inline do Meta Pixel;
      // connect.facebook.net serve o fbevents.js.
      "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      // O Pixel usa um <img> de tracking em facebook.com (fallback noscript).
      "img-src 'self' data: blob: https://www.facebook.com",
      "font-src 'self' data:",
      // O Pixel envia eventos para facebook.com.
      "connect-src 'self' https://www.facebook.com",
      "frame-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
