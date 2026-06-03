export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), { status: 405, headers: cors });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not configured in Vercel.' } }), { status: 500, headers: cors });

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: { message: 'Invalid request' } }), { status: 400, headers: cors }); }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return new Response(JSON.stringify(data), { status: upstream.status, headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message || 'Server error' } }), { status: 500, headers: cors });
  }
}
