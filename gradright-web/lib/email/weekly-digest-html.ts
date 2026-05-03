import type { WeeklyDigestPayload } from "@/lib/ai/generate-weekly-digest";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(origin: string, pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = origin.replace(/\/$/, "");
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
}

export function buildWeeklyDigestEmailHtml(input: {
  digest: WeeklyDigestPayload;
  appOrigin: string;
  unsubscribeUrl: string;
}): { html: string; textFallback: string } {
  const { digest, appOrigin, unsubscribeUrl } = input;

  const blocks = digest.items
    .map((item) => {
      const ctaHref = absoluteUrl(appOrigin, item.cta_url);
      const cta =
        item.cta_text && ctaHref
          ? `<p style="margin:16px 0 0"><a href="${escapeHtml(ctaHref)}" style="color:#2563eb;font-weight:600">${escapeHtml(item.cta_text)}</a></p>`
          : "";
      return `
      <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #e5e7eb">
        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">${escapeHtml(item.type.replace("_", " "))}</p>
        <h2 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#111827">${escapeHtml(item.title)}</h2>
        <p style="margin:0;font-size:15px;line-height:1.55;color:#374151">${escapeHtml(item.body)}</p>
        ${cta}
      </div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px 24px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
          <tr>
            <td>
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a">GradRight</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#374151">${escapeHtml(digest.greeting)}</p>
              ${blocks}
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline">Email preferences &amp; unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textFallback = [
    "GradRight",
    "",
    digest.greeting,
    "",
    ...digest.items.map(
      (i) =>
        `${i.type}: ${i.title}\n${i.body}${i.cta_text && i.cta_url ? `\n${i.cta_text}: ${absoluteUrl(appOrigin, i.cta_url) ?? ""}` : ""}\n`
    ),
    `Preferences: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, textFallback };
}
