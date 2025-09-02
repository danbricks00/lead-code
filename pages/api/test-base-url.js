export default function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (baseUrl) {
    res.status(200).json({
      success: true,
      message: 'Environment variable is available.',
      NEXT_PUBLIC_BASE_URL: baseUrl,
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Environment variable NEXT_PUBLIC_BASE_URL is not set or is undefined.',
    });
  }
}
