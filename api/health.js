export default (req, res) => {
  console.log('health ping', { t: Date.now() });
  res.status(200).json({ ok: true, t: Date.now() });
};
