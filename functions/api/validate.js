export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const password = url.searchParams.get('password');
  const visitor_id = url.searchParams.get('visitor_id') || '';
  const session_id = url.searchParams.get('session_id') || '';

  // Master password: access without token (for demos, meetings, etc.)
  if (!token && password && env.MASTER_PASSWORD && password === env.MASTER_PASSWORD) {
    contextWaitUntilGateEvent(context, {
      project: 'tedx-peninsula-hiroki',
      gate: 'partners-master',
      key: 'MASTER_PASSWORD',
      who: 'master',
      visitor_id,
      session_id,
      path: url.pathname,
    });
    return Response.json({ valid: true });
  }

  if (!token && password) {
    contextWaitUntilGateEvent(context, {
      project: 'tedx-peninsula-hiroki',
      gate: 'partners-master',
      event: 'fail',
      key: 'wrong-master',
      visitor_id,
      session_id,
      path: url.pathname,
    });
    return Response.json({ valid: false });
  }

  if (!token) return Response.json({ valid: false });

  const raw = await env.PARTNERS_KV.get(`token:${token}`);
  if (!raw) return Response.json({ valid: false });

  const invite = JSON.parse(raw);

  // If invite has a password, require it
  if (invite.password) {
    if (!password) return Response.json({ valid: false, requires_password: true });
    if (password !== invite.password) {
      contextWaitUntilGateEvent(context, {
        project: 'tedx-peninsula-hiroki',
        gate: 'partners-invite-password',
        event: 'fail',
        key: 'wrong-invite-password',
        who: invite.name || invite.email || invite.id || '',
        visitor_id,
        session_id,
        path: url.pathname,
      });
      return Response.json({ valid: false, wrong_password: true });
    }
  }

  // Engagement tracking: cuenta visitas reales (throttle de 30 min = una sesión)
  const now = new Date();
  const nowIso = now.toISOString();
  const SESSION_MS = 30 * 60 * 1000;
  const lastMs = invite.last_access ? new Date(invite.last_access).getTime() : 0;
  const isNewSession = !lastMs || (now.getTime() - lastMs) > SESSION_MS;

  let changed = false;
  if (!invite.accessed) {
    invite.accessed = true;
    invite.first_access = nowIso;
    changed = true;
  }
  if (isNewSession) {
    invite.access_count = (invite.access_count || 0) + 1;
    invite.last_access = nowIso;
    changed = true;
  }
  if (changed) {
    await env.PARTNERS_KV.put(`token:${token}`, JSON.stringify(invite));
    await _updateListItem(env, invite);
  }

  contextWaitUntilGateEvent(context, {
    project: 'tedx-peninsula-hiroki',
    gate: invite.password ? 'partners-invite-password' : 'partners-invite',
    key: invite.password ? 'invite-password' : 'invite-token',
    who: invite.name || invite.email || invite.id || '',
    visitor_id,
    session_id,
    path: url.pathname,
  });

  return Response.json({ valid: true, name: invite.name });
}

function contextWaitUntilGateEvent(context, payload) {
  try {
    // Reenviar el UA y el país del visitante real (este Worker valida server-side, así que
    // el central vería el UA del Worker si no lo pasamos → el filtro de bots ocultaría el ingreso).
    var ua = context.request.headers.get('user-agent') || '';
    var country = context.request.headers.get('cf-ipcountry') || '';
    // Fire-and-forget: el acceso no depende de analytics.
    context.waitUntil(fetch('https://gates-analytics.nqnguille.workers.dev/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-IPCountry': country },
      body: JSON.stringify({ event: 'unlock', ua: ua, ...payload }),
    }).catch(() => {}));
  } catch (e) {}
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
