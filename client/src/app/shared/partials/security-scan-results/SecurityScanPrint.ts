import { UrlScanMeta, UrlScanThreatItem } from "../../model/security-scan/security.scan.results.model";

export class SecurityScanPrint {
  static print(meta: UrlScanMeta | null, categories: { name: string; total: number; items: UrlScanThreatItem[] }[]): void {
    if (!meta) return;

    const esc = (s: any) =>
      String(s ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');

    const riskClass = (risk: string) => {
      const r = (risk||'').toLowerCase();
      if (r === 'high' || r === 'critical') return 'risk-high';
      if (r === 'medium') return 'risk-medium';
      if (r === 'low') return 'risk-low';
      return 'risk-info';
    };

    const rows = (categories||[]).flatMap(cat =>
      (cat.items||[]).map((it, i) => ({
        n: i+1,
        category: cat.name,
        header: it.header || '',
        description: it.description || '',
        proof: (it as any)['proof'] ? String((it as any)['proof']) : '',
        risk: it.risk || '',
        confidence: it.confidence || ''
      }))
    );

    const trimProof = (p: string) => {
      if (!p) return '';
      const lines = p.split(/\r?\n/);
      return (lines.length <= 15) ? p : lines.slice(0,15).join('\n') + '\n…';
    };

    const metaTable = `
      <table class="meta">
        <tbody>
          <tr><th>URL</th><td>${esc(meta.URL)}</td><th>Host</th><td>${esc(meta.Host||'')}</td></tr>
          <tr><th>Port</th><td>${esc(meta.Port||'')}</td><th>Scanned on</th><td>${esc(meta.Scanned_on_date||'')}</td></tr>
          <tr><th>Scanned by</th><td>${esc(meta.Scanned_by||'')}</td><th>Printed</th><td>${esc(new Date().toLocaleString())}</td></tr>
        </tbody>
      </table>
    `;

    const findings = rows.length
      ? rows.map(r => {
          const rc = riskClass(r.risk);
          return `
            <section class="card ${rc}">
              <header class="card-head">
                <div class="title">
                  <span class="num">${r.n}.</span>
                  <span class="hdr">${esc(r.header)}</span>
                </div>
                <div class="riskwrap">
                  <span class="badge ${rc}">${esc(r.risk)}</span>
                  <span class="conf">${esc(r.confidence)}</span>
                </div>
              </header>
              <div class="meta-line"><span class="label">Category:</span> ${esc(r.category)}</div>
              <div class="desc"><span class="label">Description:</span><div class="prewrap">${esc(r.description)}</div></div>
              ${r.proof ? `<div class="proof"><span class="label">Proof (first 15 lines):</span><pre>${esc(trimProof(r.proof))}</pre></div>` : ``}
            </section>
          `;
        }).join('')
      : `<div class="empty">No findings.</div>`;

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Security Scan Report</title>
  <style>
    :root{
      --ink:#0f172a;
      --muted:#475569;
      --line:#cbd5e1;
      --hi:#ef4444;
      --hi-ink:#fff;
      --md:#f59e0b;
      --md-ink:#1f2937;
      --lo:#3b82f6;
      --lo-ink:#fff;
      --info:#64748b;
      --info-ink:#fff;
      --bg:#ffffff;
      --head:#0ea5e9;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font:13px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif}
    .container{max-width:1100px;margin:12px auto;padding:12px}
    h1{margin:4px 0 10px 0;font-size:20px;color:var(--head)}
    h2{margin:10px 0 8px 0;font-size:16px;color:var(--head)}
    .meta{width:100%;border-collapse:collapse;margin:0 0 10px 0;border:1px solid var(--line)}
    .meta th,.meta td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
    .meta th{background:#f8fafc;color:var(--muted);width:150px}

    .card{border:1px solid var(--line);border-radius:8px;padding:10px;margin:8px 0;page-break-inside:avoid}
    .card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
    .title{display:flex;align-items:center;gap:8px;min-width:0}
    .num{font-weight:700;color:var(--muted)}
    .hdr{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .riskwrap{display:flex;align-items:center;gap:8px;flex-shrink:0}

    .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800}
    .badge.risk-high{background:var(--hi);color:var(--hi-ink)}
    .badge.risk-medium{background:var(--md);color:var(--md-ink)}
    .badge.risk-low{background:var(--lo);color:var(--lo-ink)}
    .badge.risk-info{background:var(--info);color:var(--info-ink)}

    .card.risk-high{border-left:6px solid var(--hi)}
    .card.risk-medium{border-left:6px solid var(--md)}
    .card.risk-low{border-left:6px solid var(--lo)}
    .card.risk-info{border-left:6px solid var(--info)}

    .conf{font-size:11px;color:var(--muted)}
    .meta-line{font-size:12px;color:var(--muted);margin:4px 0}
    .label{font-weight:800;color:var(--ink);margin-right:6px}
    .desc{margin:6px 0}
    .prewrap{white-space:pre-wrap;word-wrap:break-word}
    .proof{margin-top:6px}
    pre{
      margin:4px 0 0 0;
      background:#0b1020;
      color:#e6edf3;
      padding:10px;
      border-radius:6px;
      border:1px solid #1f2a44;
      white-space:pre-wrap;
      word-break:break-word;
      max-height:360px;
      overflow:auto;
      font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace
    }
    .empty{color:var(--muted);text-align:center;padding:18px;border:1px dashed var(--line);border-radius:8px}

    @page{margin:10mm}
    @media print{
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .container{padding:4mm}
      h1,h2{color:var(--head)}
      .badge.risk-high{background:var(--hi) !important;color:var(--hi-ink) !important}
      .badge.risk-medium{background:var(--md) !important;color:var(--md-ink) !important}
      .badge.risk-low{background:var(--lo) !important;color:var(--lo-ink) !important}
      .badge.risk-info{background:var(--info) !important;color:var(--info-ink) !important}
      .card.risk-high{border-left-color:var(--hi) !important}
      .card.risk-medium{border-left-color:var(--md) !important}
      .card.risk-low{border-left-color:var(--lo) !important}
      .card.risk-info{border-left-color:var(--info) !important}
      pre{background:#0b1020 !important;color:#e6edf3 !important;border-color:#1f2a44 !important}
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Security Scan Report</h1>
    ${metaTable}
    <h2>Findings</h2>
    ${findings}
  </div>
  <script>
    window.addEventListener('load',()=>{
      document.title='Security Scan Report';
      setTimeout(()=>{window.print()},30);
    });
  </script>
</body>
</html>
    `;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
