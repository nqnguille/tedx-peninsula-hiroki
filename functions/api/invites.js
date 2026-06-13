function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_SECRET}`;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let t = '';
  for (let i = 0; i < 24; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return unauthorized();
  const raw = await env.PARTNERS_KV.get('invites:all');
  return Response.json(raw ? JSON.parse(raw) : []);
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, email } = body;
  if (!name || !email) return Response.json({ error: 'name and email required' }, { status: 400 });

  const token = generateToken();
  const invite = {
    id: token,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: body.password ? body.password.trim() : null,
    created: new Date().toISOString(),
    sent: false,
    sent_at: null,
    accessed: false,
    first_access: null,
    access_count: 0,
    last_access: null
  };

  await env.PARTNERS_KV.put(`token:${token}`, JSON.stringify(invite));

  const raw = await env.PARTNERS_KV.get('invites:all');
  const list = raw ? JSON.parse(raw) : [];
  list.push(invite);
  await env.PARTNERS_KV.put('invites:all', JSON.stringify(list));

  return Response.json(invite, { status: 201 });
}

export async function onRequestDelete({ request, env }) {
  if (!isAdmin(request, env)) return unauthorized();

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return Response.json({ error: 'token required' }, { status: 400 });

  await env.PARTNERS_KV.delete(`token:${token}`);

  const raw = await env.PARTNERS_KV.get('invites:all');
  if (raw) {
    const list = JSON.parse(raw).filter(i => i.id !== token);
    await env.PARTNERS_KV.put('invites:all', JSON.stringify(list));
  }

  return Response.json({ ok: true });
}
