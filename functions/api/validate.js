export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const password = url.searchParams.get('password');

  // Master password: access without token (for demos, meetings, etc.)
  if (!token && password && env.MASTER_PASSWORD && password === env.MASTER_PASSWORD) {
    return Response.json({ valid: true });
  }

  if (!token) return Response.json({ valid: false });

  const raw = await env.PARTNERS_KV.get(`token:${token}`);
  if (!raw) return Response.json({ valid: false });

  const invite = JSON.parse(raw);

  // If invite has a password, require it
  if (invite.password) {
    if (!password) return Response.json({ valid: false, requires_password: true });
    if (password !== invite.password) return Response.json({ valid: false, wrong_password: true });
  }

  if (!invite.accessed) {
    invite.accessed = true;
    invite.first_access = new Date().toISOString();
    await env.PARTNERS_KV.put(`token:${token}`, JSON.stringify(invite));
    await _updateListItem(env, invite);
  }

  return Response.json({ valid: true, name: invite.name });
}

async function _updateListItem(env, updated) {
  const raw = await env.PARTNERS_KV.get('invites:all');
  if (!raw) return;
  const list = JSON.parse(raw);
  const idx = list.findIndex(i => i.id === updated.id);
  if (idx >= 0) {
    list[idx] = updated;
    await env.PARTNERS_KV.put('invites:all', JSON.stringify(list));
  }
}
