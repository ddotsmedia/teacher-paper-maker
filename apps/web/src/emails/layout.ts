/** Minimal, inline-styled HTML shell shared by all transactional emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${title}</title></head>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:#2563eb;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;">Teacher Paper Maker</td></tr>
          <tr><td style="padding:24px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
          <tr><td style="padding:16px 24px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">You are receiving this email because an account action was requested on Teacher Paper Maker.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">${label}</a>`;
}
