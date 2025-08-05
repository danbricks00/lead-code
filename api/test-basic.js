export default function handler(req, res) {
  res.json({
    success: true,
    message: 'Basic API working!',
    timestamp: new Date().toISOString()
  });
} 