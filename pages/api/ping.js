// A simple endpoint to verify deployment and API routing.

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  console.log('Ping received at:', new Date().toISOString());

  res.status(200).json({ success: true, message: 'Ping received' });
}
