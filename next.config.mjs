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
      // 'unsafe-inline' em script/style é temporário para o esqueleto; será substituído
      // por nonces/hashes quando o conteúdo real e os snippets de tracking forem adicionados.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
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
