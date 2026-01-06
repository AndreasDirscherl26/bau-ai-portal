export default function handler(req, res) {
  res.status(200).json({ demo: process.env.DEMO_MODE === 'true' });
}
