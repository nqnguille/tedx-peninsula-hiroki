function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_SECRET}`;
}

function emailHTML(name, accessUrl, password) {
  const passwordBlock = password ? `
    <div style="background:#0a0a0a;padding:24px 28px;margin:0 0 32px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:10px;">Tu contraseña personal</div>
      <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.06em;margin-bottom:12px;">${password}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">Guardala. No la compartas.<br>La vas a necesitar para ingresar a la propuesta.</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;padding:48px 44px;">
    <div style="margin-bottom:36px;">
      <img src="https://tedxpeninsulahiroki.com.ar/assets/brand/logo-black.png"
           alt="TEDx PenínsulahHiroki" width="260" height="41"
           style="display:block;border:0;outline:none;max-width:100%;height:auto;">
    </div>

    <p style="font-size:16px;line-height:1.8;color:#222;margin:0 0 20px;">${name},</p>

    <p style="font-size:16px;line-height:1.8;color:#222;margin:0 0 28px;">
      Tenés esta propuesta diseñada para quienes quieran involucrarse
      en la construcción de algo nuevo en Neuquén.
    </p>

    ${passwordBlock}

    <div style="text-align:center;margin:0 0 32px;">
      <a href="${accessUrl}"
         style="display:inline-block;background:#EB0028;color:#fff;font-size:15px;font-weight:700;
                letter-spacing:0.04em;text-decoration:none;padding:16px 40px;border-radius:2px;">
        Ver propuesta →
      </a>
    </div>

    <p style="font-size:12px;color:#bbb;word-break:break-all;margin:0 0 32px;">
      <a href="${accessUrl}" style="color:#bbb;text-decoration:none;">${accessUrl}</a>
    </p>

    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #eee;font-size:14px;color:#777;">
      <strong style="color:#111;display:block;font-size:15px;margin-bottom:4px;">Guillermo Sandoval</strong>
      Licenciatario · TEDx Península Hiroki<br>
      nqnguille@gmail.com
    </div>
  </div>
  <div style="text-align:center;padding:20px;font-size:11px;color:#bbb;">
    TEDx Península Hiroki · Neuquén · Patagonia
  </div>
</body>
</html>`;
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not configured. Add it in Cloudflare Pages → Settings → Environment variables.' }, { status: 503 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { token } = body;
  if (!token) return Response.json({ error: 'token required' }, { status: 400 });

  const raw = await env.PARTNERS_KV.get(`token:${token}`);
  if (!raw) return Response.json({ error: 'Invite not found' }, { status: 404 });

  const invite = JSON.parse(raw);
  const accessUrl = `https://tedxpeninsulahiroki.com.ar/partners.html?token=${token}`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Guillermo · TEDx Península Hiroki <noreply@tedxpeninsulahiroki.com.ar>',
      to: [invite.email],
      reply_to: 'nqnguille@gmail.com',
      subject: `${invite.name}, tenemos algo para construir juntos`,
      html: emailHTML(invite.name, accessUrl, invite.password || null)
    })
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    return Response.json({ error: `Resend error: ${errText}` }, { status: 500 });
  }

  invite.sent = true;
  invite.sent_at = new Date().toISOString();
  await env.PARTNERS_KV.put(`token:${token}`, JSON.stringify(invite));

  const listRaw = await env.PARTNERS_KV.get('invites:all');
  if (listRaw) {
    const list = JSON.parse(listRaw);
    const idx = list.findIndex(i => i.id === token);
    if (idx >= 0) { list[idx] = invite; await env.PARTNERS_KV.put('invites:all', JSON.stringify(list)); }
  }

  return Response.json({ ok: true, sent_to: invite.email });
}
