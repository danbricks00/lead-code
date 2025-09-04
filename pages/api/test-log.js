export default function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] --- LOG TEST --- This message should appear in Vercel runtime logs.`);
  res.status(200).json({ 
    status: "success", 
    message: "Log test executed. Please check your Vercel Function Logs for a message.",
    timestamp: timestamp 
  });
}
