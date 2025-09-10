export default function handler(req, res) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BASE_URL || 'http://localhost:3000';

  res.status(200).json({
    baseUrl,
    vercelUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    baseUrlEnv: process.env.BASE_URL,
    defaultUrl: 'http://localhost:3000'
  });
}
