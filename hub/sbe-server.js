#!/usr/bin/env node
/**
 * SBE Local Server — serves both Downloads (HTML editors) and Pictures/SBE_Carousels (dashboard + PNGs).
 * Landing page at / with shortcuts.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const HOME = process.env.HOME;
const DL = path.join(HOME, 'storage/shared/Download');
const PICS = path.join(HOME, 'storage/shared/Pictures/SBE_Carousels');
const WELLNESS = path.join(HOME, 'storage/shared/Pictures/EnyaWellness');

// Détecte dynamiquement l'IP WiFi du téléphone
function getNetworkIP() {
  const nets = os.networkInterfaces();
  for (const infos of Object.values(nets)) {
    for (const i of infos) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
}
function getCurrentURL() { return `http://${getNetworkIP()}:8088`; }

const MIME = {
  '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript; charset=utf-8',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
  '.json':'application/json','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8',
  '.pdf':'application/pdf','.epub':'application/epub+zip','.zip':'application/zip'
};

function landingHtml(currentUrl) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store">
<title>Enya · Hub</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Bebas+Neue&family=DM+Sans:wght@500;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#1B2A4A 0%,#0A0A0A 100%);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.wrap{max-width:520px;width:100%;}
.head{text-align:center;margin-bottom:32px;}
.head h1{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;letter-spacing:-1px;font-style:italic;}
.head .tag{font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.5;margin-top:8px;}
.brand{display:block;text-decoration:none;color:#fff;padding:24px 22px;border-radius:14px;margin-bottom:14px;transition:transform .15s,box-shadow .15s;border:1px solid rgba(255,255,255,0.08);}
.brand:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,0.4);}
.brand.sbe{background:linear-gradient(135deg,rgba(45,91,227,0.15),rgba(201,168,76,0.05));border-color:#C9A84C;}
.brand.sbe:hover{border-color:#C9A84C;background:linear-gradient(135deg,rgba(45,91,227,0.25),rgba(201,168,76,0.1));}
.brand.wellness{background:linear-gradient(135deg,rgba(212,56,56,0.15),rgba(10,10,10,0.5));border-color:#D43838;}
.brand.wellness:hover{background:linear-gradient(135deg,rgba(212,56,56,0.25),rgba(10,10,10,0.7));}
.brand-head{display:flex;align-items:center;gap:14px;margin-bottom:10px;}
.brand-head .ico{font-size:36px;}
.brand-head .name{flex:1;}
.brand-head .name .ttl{font-size:22px;font-weight:700;letter-spacing:-0.3px;}
.brand.sbe .ttl{font-family:'Playfair Display',serif;font-style:italic;}
.brand.wellness .ttl{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;font-weight:400;font-size:24px;}
.brand-head .name .sub{font-size:11px;opacity:0.6;letter-spacing:2px;text-transform:uppercase;margin-top:3px;}
.brand-body{font-size:13px;opacity:0.7;line-height:1.5;}
.qr-block{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px;margin-top:24px;display:flex;align-items:center;gap:16px;}
.qr-block img{width:110px;height:110px;background:#fff;padding:6px;border-radius:8px;flex-shrink:0;}
.qr-info{font-size:12px;line-height:1.5;}
.qr-info b{color:#C9A84C;display:block;margin-bottom:4px;letter-spacing:2px;text-transform:uppercase;font-size:10px;}
.qr-url{font-family:monospace;font-size:10px;word-break:break-all;background:rgba(0,0,0,0.3);padding:5px 7px;border-radius:4px;margin-top:6px;display:inline-block;}
</style></head>
<body><div class="wrap">

<div class="head">
  <h1>Enya</h1>
  <div class="tag">Hub Carrousels · 2 marques</div>
</div>

<a class="brand sbe" href="/dashboard/">
  <div class="brand-head">
    <div class="ico">📋</div>
    <div class="name"><div class="ttl">SBE TikTok</div><div class="sub">Méthode · études · L1 / L2</div></div>
  </div>
  <div class="brand-body">Bleu / écru / or — académique éditorial</div>
</a>

<a class="brand wellness" href="/wellness/">
  <div class="brand-head">
    <div class="ico">🏋️‍♀️</div>
    <div class="name"><div class="ttl">ENYA WELLNESS</div><div class="sub">Sport · santé · alimentation</div></div>
  </div>
  <div class="brand-body">Noir / rouge / épuré — athletic editorial</div>
</a>

<div class="qr-block">
  <img src="/qr.png" alt="QR">
  <div class="qr-info">
    <b>📱 Téléphone / autre device</b>
    Scanne le QR avec l'appareil photo pour ouvrir le hub.
    <div class="qr-url">${currentUrl}</div>
  </div>
</div>

</div></body></html>`;
}

// ─── Old landing (gardée pour compat) ─────────────────────────────
function _oldLanding(currentUrl) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store">
<title>SBE TikTok · Accueil</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;background:linear-gradient(160deg,#1B2A4A 0%,#0E1B35 100%);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.wrap{max-width:520px;width:100%;}
h1{font-family:'Playfair Display',serif;font-size:42px;font-weight:900;letter-spacing:-1px;margin-bottom:6px;}
h1 span{color:#C9A84C;}
.tag{font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;margin-bottom:32px;}
.btn{display:flex;align-items:center;gap:14px;background:#fff;color:#1B2A4A;text-decoration:none;padding:18px 22px;border-radius:14px;margin-bottom:12px;transition:transform .15s,box-shadow .15s;}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3);}
.btn .ico{font-size:32px;}
.btn .ttl{font-weight:700;font-size:16px;margin-bottom:2px;}
.btn .sub{font-size:12px;opacity:0.7;}
.btn.primary{background:#C9A84C;color:#1B2A4A;}
.btn.ghost{background:rgba(255,255,255,0.07);color:#fff;border:1px solid rgba(255,255,255,0.15);}
.qr-block{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px;margin-top:20px;display:flex;align-items:center;gap:18px;}
.qr-block img{width:140px;height:140px;background:#fff;padding:8px;border-radius:8px;flex-shrink:0;}
.qr-info{font-size:13px;line-height:1.5;}
.qr-info b{color:#C9A84C;display:block;margin-bottom:6px;letter-spacing:2px;text-transform:uppercase;font-size:10px;}
.qr-url{font-family:monospace;font-size:11px;word-break:break-all;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:4px;margin-top:8px;display:inline-block;}
</style></head>
<body><div class="wrap">
<h1>SBE<span> TikTok</span></h1>
<div class="tag">Hub Carrousels · Mes brouillons</div>
<a class="btn primary" href="/dashboard">
  <div class="ico">📋</div>
  <div><div class="ttl">Tableau de bord</div><div class="sub">Tous mes carrousels · description · hashtags · PNG</div></div>
</a>
<a class="btn" href="/editor">
  <div class="ico">🎨</div>
  <div><div class="ttl">Éditeurs HTML</div><div class="sub">Modifier / re-télécharger les slides</div></div>
</a>
<div class="qr-block">
  <img src="/qr.png" alt="QR code">
  <div class="qr-info">
    <b>📱 Tablette / autre device</b>
    Scanne ce QR avec l'appareil photo pour ouvrir le hub. Pas besoin de retaper l'URL.
    <div class="qr-url">${currentUrl}</div>
  </div>
</div>
</div></body></html>`;
}

function listDir(dir, basePath) {
  const files = fs.readdirSync(dir).filter(f => /\.html$/i.test(f));
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SBE — Fichiers HTML</title>
<style>body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;background:#FAF6F1;color:#1B2A4A;}h1{margin-bottom:24px;font-family:Georgia,serif;}a{display:block;padding:14px 16px;background:#fff;margin:8px 0;border-radius:8px;text-decoration:none;color:#2D5BE3;border:1px solid #E8DFD3;font-weight:500;}a:hover{background:#EEF4FF;border-color:#2D5BE3;}.back{margin-bottom:20px;color:#8A7A6B;font-size:14px;}</style></head>
<body><a class="back" href="/">← Accueil</a><h1>📝 Éditeurs HTML</h1>${files.map(f=>`<a href="${basePath}/${f}">${f}</a>`).join('')}</body></html>`;
}

function serveFile(req, res, fp) {
  fs.stat(fp, (err, st) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    if (st.isDirectory()) {
      const candidates = ['00_DASHBOARD.html','index.html'];
      for (const c of candidates) {
        if (fs.existsSync(path.join(fp,c))) {
          return serveFile(req, res, path.join(fp,c));
        }
      }
      const files = fs.readdirSync(fp);
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
      return res.end(`<h1>${path.basename(fp)}</h1>${files.map(f=>`<p><a href="${f}">${f}</a></p>`).join('')}`);
    }
    fs.readFile(fp, (e, d) => {
      if (e) { res.writeHead(500); return res.end(e.message); }
      const ext = path.extname(fp).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      if (ext === '.html' || ext === '.md') {
        headers['Cache-Control'] = 'no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
      }
      // Si query ?dl=… ou /download/, force download attachment
      const reqUrl = req.url || '';
      if (/[?&]dl=/.test(reqUrl) && ext === '.png') {
        headers['Content-Disposition'] = `attachment; filename="${path.basename(fp)}"`;
      }
      res.writeHead(200, headers);
      res.end(d);
    });
  });
}

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);

  // Landing
  if (url === '/' || url === '') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    return res.end(landingHtml(getCurrentURL()));
  }

  // QR code de l'URL actuelle (regénéré dynamiquement)
  if (url === '/qr.png') {
    try {
      const png = execSync(`qrencode -t PNG -s 8 -m 2 -o - "${getCurrentURL()}"`, { encoding: 'buffer' });
      res.writeHead(200, {'Content-Type':'image/png','Cache-Control':'no-store'});
      return res.end(png);
    } catch (e) {
      res.writeHead(500); return res.end('qrencode error');
    }
  }

  // Endpoint texte : récupérer l'URL actuelle
  if (url === '/whoami' || url === '/url') {
    res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    return res.end(getCurrentURL());
  }

  // /editor → list HTML in Downloads
  if (url === '/editor' || url === '/editor/') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    return res.end(listDir(DL, '/editor'));
  }
  if (url.startsWith('/editor/')) {
    const sub = url.slice('/editor/'.length);
    const fp = path.join(DL, sub);
    if (!fp.startsWith(DL)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, fp);
  }

  // /dashboard → redirige vers /dashboard/ pour que les URLs relatives résolvent vers /dashboard/folder/img.png
  if (url === '/dashboard') {
    res.writeHead(301, { Location: '/dashboard/' });
    return res.end();
  }
  if (url === '/dashboard/') {
    return serveFile(req, res, path.join(PICS, '00_DASHBOARD.html'));
  }
  // ═══ WELLNESS routes ════════════════════════════════════════════
  if (url === '/wellness' || url === '/wellness/') {
    return serveFile(req, res, path.join(WELLNESS, '00_DASHBOARD.html'));
  }
  if (url === '/wellness/dashboard' || url === '/wellness/dashboard/') {
    res.writeHead(301, { Location: '/wellness/' });
    return res.end();
  }
  if (url.startsWith('/wellness/dashboard/')) {
    const sub = url.slice('/wellness/dashboard/'.length);
    if (sub.endsWith('/zip') || sub.endsWith('/zip/')) {
      const folder = sub.replace(/\/zip\/?$/, '');
      const folderPath = path.join(WELLNESS, folder);
      if (!folderPath.startsWith(WELLNESS) || !fs.existsSync(folderPath)) { res.writeHead(404); return res.end(); }
      const slides = fs.readdirSync(folderPath).filter(f=>/^slide_\d+\.png$/.test(f)).sort();
      if (slides.length === 0) { res.writeHead(404); return res.end(); }
      const { spawn } = require('child_process');
      const tmpZip = `${os.tmpdir()}/ew-${Date.now()}-${Math.floor(Math.random()*1e6)}.zip`;
      const zp = spawn('zip', ['-jq', tmpZip, ...slides.map(f=>path.join(folderPath,f))]);
      zp.on('close', code => {
        if (code !== 0 || !fs.existsSync(tmpZip)) { res.writeHead(500); return res.end(); }
        res.writeHead(200, { 'Content-Type':'application/zip', 'Content-Disposition':`attachment; filename="EW_${folder}.zip"`, 'Cache-Control':'no-store' });
        const stream = fs.createReadStream(tmpZip);
        stream.pipe(res);
        stream.on('end', () => { try { fs.unlinkSync(tmpZip); } catch(_){} });
      });
      return;
    }
    const fp = path.join(WELLNESS, sub);
    if (!fp.startsWith(WELLNESS)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, fp);
  }
  // Routes /wellness/<folder>/<file> (relative depuis /wellness/) — pour les images
  if (url.startsWith('/wellness/') && !url.startsWith('/wellness/editor')) {
    const sub = url.slice('/wellness/'.length);
    const fp = path.join(WELLNESS, sub);
    if (fp.startsWith(WELLNESS) && fs.existsSync(fp)) {
      return serveFile(req, res, fp);
    }
  }
  // Éditeur Wellness (sert les EW_*.html depuis Downloads)
  if (url === '/wellness/editor' || url === '/wellness/editor/') {
    const files = fs.readdirSync(DL).filter(f => /^EW_.*\.html$/i.test(f));
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    return res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Wellness · Éditeurs</title><style>body{font-family:Inter,sans-serif;max-width:600px;margin:40px auto;padding:20px;background:#0A0A0A;color:#F5F5F0;}h1{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;color:#D43838;}a{display:block;padding:14px;background:#161616;margin:8px 0;text-decoration:none;color:#F5F5F0;border:1px solid #2A2A2A;}a:hover{border-color:#D43838;}.back{margin-bottom:20px;font-size:13px;color:#6B6B6B;}</style></head><body><a class="back" href="/wellness/">← Dashboard</a><h1>Éditeurs Wellness</h1>${files.map(f=>`<a href="/wellness/editor/${f}">${f}</a>`).join('') || '<p>Aucun carrousel encore.</p>'}</body></html>`);
  }
  if (url.startsWith('/wellness/editor/')) {
    const sub = url.slice('/wellness/editor/'.length);
    const fp = path.join(DL, sub);
    if (!fp.startsWith(DL)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, fp);
  }

  if (url.startsWith('/dashboard/')) {
    const sub = url.slice('/dashboard/'.length);
    // Route spéciale : /dashboard/<folder>/zip → ZIP de toutes les slides
    if (sub.endsWith('/zip') || sub.endsWith('/zip/')) {
      const folder = sub.replace(/\/zip\/?$/, '');
      const folderPath = path.join(PICS, folder);
      if (!folderPath.startsWith(PICS) || !fs.existsSync(folderPath)) {
        res.writeHead(404); return res.end('Folder not found');
      }
      const slides = fs.readdirSync(folderPath).filter(f=>/^slide_\d+\.png$/.test(f)).sort();
      if (slides.length === 0) { res.writeHead(404); return res.end('No slides'); }
      const { spawn } = require('child_process');
      const tmpZip = `${os.tmpdir()}/sbe-${Date.now()}-${Math.floor(Math.random()*1e6)}.zip`;
      const zipName = `SBE_${folder}.zip`;
      const args = ['-jq', tmpZip, ...slides.map(f=>path.join(folderPath,f))];
      const zp = spawn('zip', args);
      zp.on('error', e => { console.error('zip spawn err', e); try{res.writeHead(500);}catch(_){} res.end(); });
      zp.on('close', code => {
        if (code !== 0 || !fs.existsSync(tmpZip)) {
          try { res.writeHead(500); } catch(_){}
          return res.end('zip failed');
        }
        res.writeHead(200, {
          'Content-Type':'application/zip',
          'Content-Disposition':`attachment; filename="${zipName}"`,
          'Cache-Control':'no-store'
        });
        const stream = fs.createReadStream(tmpZip);
        stream.pipe(res);
        stream.on('end', () => { try { fs.unlinkSync(tmpZip); } catch(_){} });
      });
      return;
    }
    const fp = path.join(PICS, sub);
    if (!fp.startsWith(PICS)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, fp);
  }

  // Legacy: direct file in Downloads (backwards compat with old absolute URLs)
  const legacyFp = path.join(DL, url);
  if (legacyFp.startsWith(DL) && fs.existsSync(legacyFp)) {
    return serveFile(req, res, legacyFp);
  }

  // Carousel folders direct (also handle URL-encoded folder names from dashboard relative links)
  const picsFp = path.join(PICS, url);
  if (picsFp.startsWith(PICS) && fs.existsSync(picsFp)) {
    return serveFile(req, res, picsFp);
  }

  res.writeHead(404);
  res.end('Not found');
});

// Bind explicitement sur 0.0.0.0 + écoute aussi sur ::1 pour compat Chrome Android
server.listen(8088, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  console.log('SBE server listening on:');
  console.log('  http://localhost:8088');
  console.log('  http://127.0.0.1:8088');
  for (const [name, infos] of Object.entries(nets)) {
    for (const i of infos) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`  http://${i.address}:8088  (${name})`);
      }
    }
  }
});
