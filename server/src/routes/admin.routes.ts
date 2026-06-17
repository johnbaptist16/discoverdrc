import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/admin';
import { adminListBusinesses, adminPatchBusiness } from '../controllers/admin.controller';

const router = Router();

// JSON API
router.get('/businesses', requireAdmin, adminListBusinesses);
router.patch('/businesses/:id', requireAdmin, adminPatchBusiness);

// Dashboard HTML — served at GET /admin
router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(DASHBOARD_HTML);
});

export default router;

const DASHBOARD_HTML = /* html */`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DiscoverDRC Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f5f5f5;color:#111}
  header{background:#25D366;color:#fff;padding:16px 24px;display:flex;align-items:center;gap:12px}
  header h1{font-size:18px;font-weight:700}
  header span{font-size:13px;opacity:.8}
  #login{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5}
  .card{background:#fff;border-radius:12px;padding:32px;width:320px;box-shadow:0 2px 12px rgba(0,0,0,.1)}
  .card h2{margin-bottom:20px;font-size:20px}
  input[type=password]{width:100%;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:14px;margin-bottom:12px}
  .btn{background:#25D366;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:14px;font-weight:600;width:100%}
  .btn:disabled{opacity:.5}
  .btn-sm{padding:4px 10px;font-size:12px;border-radius:6px;border:none;cursor:pointer;font-weight:600;width:auto}
  .btn-verify{background:#25D366;color:#fff}
  .btn-unverify{background:#f0f0f0;color:#333}
  .btn-deactivate{background:#ff4444;color:#fff}
  .btn-activate{background:#1976d2;color:#fff}
  #app{display:none}
  .stats{display:flex;gap:12px;padding:20px 24px;flex-wrap:wrap}
  .stat{background:#fff;border-radius:10px;padding:16px 20px;flex:1;min-width:120px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .stat-n{font-size:28px;font-weight:700;color:#25D366}
  .stat-l{font-size:12px;color:#888;margin-top:2px}
  .stat-n.orange{color:#ff9800}
  .stat-n.red{color:#f44336}
  .stat-n.blue{color:#1976d2}
  table{width:calc(100% - 48px);margin:0 24px 24px;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  th{background:#f9f9f9;text-align:left;padding:10px 14px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  td{padding:10px 14px;font-size:13px;border-top:1px solid #f0f0f0;vertical-align:middle}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .badge-verified{background:#e8f5e9;color:#2e7d32}
  .badge-pending{background:#fff3e0;color:#e65100}
  .badge-inactive{background:#fce4ec;color:#c62828}
  .actions{display:flex;gap:6px;flex-wrap:wrap}
  .filter{padding:0 24px 12px;display:flex;gap:8px;align-items:center}
  .filter select{border:1px solid #ddd;border-radius:8px;padding:6px 10px;font-size:13px}
  .filter input{border:1px solid #ddd;border-radius:8px;padding:6px 10px;font-size:13px;width:220px}
  .err{color:red;font-size:13px;margin-top:8px}
</style>
</head>
<body>
<div id="login">
  <div class="card">
    <h2>🔐 Admin DiscoverDRC</h2>
    <p style="font-size:13px;color:#888;margin-bottom:16px">Entrez votre clé d'administration</p>
    <input type="password" id="secretInput" placeholder="Admin secret" autocomplete="current-password">
    <button class="btn" id="loginBtn">Se connecter</button>
    <div class="err" id="loginErr"></div>
  </div>
</div>

<div id="app">
  <header>
    <span style="font-size:22px">🏢</span>
    <h1>DiscoverDRC Admin</h1>
    <span id="headerStats"></span>
    <button class="btn-sm btn-deactivate" style="margin-left:auto" onclick="logout()">Déconnexion</button>
  </header>
  <div class="stats" id="statsRow"></div>
  <div class="filter">
    <select id="filterStatus" onchange="render()">
      <option value="all">Tous les statuts</option>
      <option value="pending">En attente</option>
      <option value="verified">Vérifiés</option>
      <option value="inactive">Inactifs</option>
    </select>
    <input type="search" id="filterSearch" placeholder="Nom, commune, propriétaire…" oninput="render()">
  </div>
  <table>
    <thead><tr>
      <th>Commerce</th><th>Commune</th><th>Catégorie</th>
      <th>Propriétaire</th><th>Note</th><th>Vues</th><th>Statut</th><th>Actions</th>
    </tr></thead>
    <tbody id="tbody"></tbody>
  </table>
</div>

<script>
let SECRET = '';
let DATA = { businesses: [], stats: {} };

document.getElementById('loginBtn').onclick = async () => {
  SECRET = document.getElementById('secretInput').value.trim();
  document.getElementById('loginErr').textContent = '';
  try {
    const r = await apiFetch('/admin/businesses');
    if (!r.ok) throw new Error('Clé incorrecte');
    const d = await r.json();
    DATA = d;
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    renderStats();
    render();
  } catch(e) {
    document.getElementById('loginErr').textContent = e.message;
    SECRET = '';
  }
};
document.getElementById('secretInput').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('loginBtn').click(); });

function apiFetch(path, opts={}) {
  return fetch(path, { ...opts, headers: { 'x-admin-secret': SECRET, 'Content-Type': 'application/json', ...(opts.headers||{}) } });
}

function logout() { SECRET=''; location.reload(); }

function renderStats() {
  const s = DATA.stats;
  document.getElementById('statsRow').innerHTML = \`
    <div class="stat"><div class="stat-n">\${s.total}</div><div class="stat-l">Commerces actifs</div></div>
    <div class="stat"><div class="stat-n">\${s.verified}</div><div class="stat-l">Vérifiés ✅</div></div>
    <div class="stat"><div class="stat-n orange">\${s.pending}</div><div class="stat-l">En attente</div></div>
    <div class="stat"><div class="stat-n red">\${s.inactive}</div><div class="stat-l">Inactifs</div></div>
  \`;
}

function render() {
  const status = document.getElementById('filterStatus').value;
  const q = document.getElementById('filterSearch').value.toLowerCase();
  const rows = DATA.businesses.filter(b => {
    if (status === 'pending'  && (b.is_verified || !b.is_active)) return false;
    if (status === 'verified' && (!b.is_verified || !b.is_active)) return false;
    if (status === 'inactive' && b.is_active) return false;
    if (q && !([b.name, b.commune, b.owner, b.owner_phone].join(' ').toLowerCase().includes(q))) return false;
    return true;
  });
  document.getElementById('tbody').innerHTML = rows.map(b => \`
    <tr>
      <td><strong>\${esc(b.name)}</strong><br><span style="font-size:11px;color:#888">\${b.id.slice(0,8)}…</span></td>
      <td>\${esc(b.commune)}</td>
      <td>\${esc(b.category)}</td>
      <td>\${esc(b.owner)}<br><span style="font-size:11px;color:#888">\${esc(b.owner_phone)}</span></td>
      <td>\${b.avg_rating ? '⭐ '+b.avg_rating : '—'} <span style="color:#aaa;font-size:11px">(\${b.review_count})</span></td>
      <td>\${b.view_count}</td>
      <td>\${badge(b)}</td>
      <td><div class="actions">
        \${b.is_active && !b.is_verified ? \`<button class="btn-sm btn-verify" onclick="patch('\${b.id}',{is_verified:true})">✓ Vérifier</button>\` : ''}
        \${b.is_active && b.is_verified  ? \`<button class="btn-sm btn-unverify" onclick="patch('\${b.id}',{is_verified:false})">Retirer</button>\` : ''}
        \${b.is_active  ? \`<button class="btn-sm btn-deactivate" onclick="patch('\${b.id}',{is_active:false})">Désactiver</button>\` : ''}
        \${!b.is_active ? \`<button class="btn-sm btn-activate" onclick="patch('\${b.id}',{is_active:true})">Réactiver</button>\` : ''}
      </div></td>
    </tr>
  \`).join('');
}

function badge(b) {
  if (!b.is_active) return '<span class="badge badge-inactive">Inactif</span>';
  if (b.is_verified) return '<span class="badge badge-verified">✅ Vérifié</span>';
  return '<span class="badge badge-pending">En attente</span>';
}

async function patch(id, body) {
  const r = await apiFetch(\`/admin/businesses/\${id}\`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) { alert('Erreur'); return; }
  const biz = DATA.businesses.find(b => b.id === id);
  if (biz) Object.assign(biz, body);
  // recalculate stats
  const active = DATA.businesses.filter(b => b.is_active);
  DATA.stats = {
    total:    active.length,
    verified: active.filter(b => b.is_verified).length,
    pending:  active.filter(b => !b.is_verified).length,
    inactive: DATA.businesses.filter(b => !b.is_active).length,
  };
  renderStats();
  render();
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
</script>
</body>
</html>`;
