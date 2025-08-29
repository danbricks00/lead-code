export default async function handler(req, res) {
  const { address } = req.query;
  res.status(200).json({ ok: true, zone: "Test Zone", address: address || "N/A" });
}
