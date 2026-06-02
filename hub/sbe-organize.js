#!/usr/bin/env node
/**
 * SBE Carousels Organizer
 * - Parse les fichiers HTML SBE dans ~/storage/shared/Download/
 * - Extrait pour chaque épisode : numéro, titre, description, hashtags
 * - Crée ~/storage/shared/Pictures/SBE_Carousels/<série>_Ep<num>_<slug>/
 * - Déplace les PNG correspondants depuis Downloads
 * - Génère 00_DASHBOARD.html et 00_README.md
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME;
const DL = path.join(HOME, 'storage/shared/Download');
const ROOT = path.join(HOME, 'storage/shared/Pictures/SBE_Carousels');

fs.mkdirSync(ROOT, { recursive: true });

// ─── Slug helper ────────────────────────────────────────────────
function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .split('_').slice(0, 6).join('_')   // garde max 6 mots
    .slice(0, 40);                       // cap dur à 40 chars
}

// ─── Source files ───────────────────────────────────────────────
const SOURCES = [
  { file: 'SBE_Carousels_L1_Ep65_75.html',     series: 'L1',     pngPrefix: /^SBE_L1_ep(\d+)_(\d+)(?:\s*\(\d+\))?\.png$/i },
  { file: 'SBE_Carousels_L2_Ep02_08-1.html',   series: 'L2',     pngPrefix: /^SBE_L2_ep(\d+)_(\d+)(?:\s*\(\d+\))?\.png$/i },
  { file: 'SBE_Carousels_L2_Ep09_15.html',     series: 'L2',     pngPrefix: /^SBE_L2_ep(\d+)_(\d+)(?:\s*\(\d+\))?\.png$/i },
  { file: 'SBE_Serie_WakeUp_Ep01_06.html',     series: 'WakeUp', pngPrefix: /^SBE_WU_(?:ep|w)0?(\d+)_0?(\d+)(?:\s*\(\d+\))?\.png$/i },
  { file: 'SBE_Special_CV_Parcoursup_Alternance.html', series: 'Special', pngPrefix: /^SBE_Special_cv_0?(\d+)(?:\s*\(\d+\))?\.png$/i, isSpecial: true, specialSlug: 'CV_Parcoursup_Alternance' },
  { file: 'SBE_Special_2min.html',  series: 'Special', pngPrefix: /^SBE_2min_(\d+)(?:\s*\(\d+\))?\.png$/i,  isSpecial: true, specialSlug: 'Flash_2_Minutes' },
  { file: 'SBE_Special_elite.html', series: 'Special', pngPrefix: /^SBE_elite_(\d+)(?:\s*\(\d+\))?\.png$/i, isSpecial: true, specialSlug: 'Elite_15Plus_Moyenne' },
  { file: 'SBE_Special_mental.html',series: 'Special', pngPrefix: /^SBE_mental_(\d+)(?:\s*\(\d+\))?\.png$/i,isSpecial: true, specialSlug: 'Mental_Procrastination' },
  { file: 'SBE_Special_nuit.html',  series: 'Special', pngPrefix: /^SBE_nuit_(\d+)(?:\s*\(\d+\))?\.png$/i,  isSpecial: true, specialSlug: 'Nuit_Sommeil' },
  { file: 'SBE_Special_voix.html',  series: 'Special', pngPrefix: /^SBE_voix_(\d+)(?:\s*\(\d+\))?\.png$/i,  isSpecial: true, specialSlug: 'Voix_Amphi' },
  { file: 'SBE_Special_fondatrice.html', series: 'Special', pngPrefix: /^SBE_fondatrice_(\d+)(?:\s*\(\d+\))?\.png$/i, isSpecial: true, specialSlug: 'Fondatrice_Story' },
  { file: 'SBE_Special_prepaL1.html', series: 'Special', pngPrefix: /^SBE_prepaL1_(\d+)(?:\s*\(\d+\))?\.png$/i, isSpecial: true, specialSlug: 'Prepa_L1' },
  { file: 'SBE_Special_ruptureL2.html', series: 'Special', pngPrefix: /^SBE_ruptureL2_(\d+)(?:\s*\(\d+\))?\.png$/i, isSpecial: true, specialSlug: 'Rupture_L2' },
];

// ─── RESOURCES — contenus longs SBE qui ne sont PAS du TikTok ─────
// (ebooks, PDFs, guides, white papers, lettres, méthodes, etc.)
// Chaque ressource est une carte à part dans une section dédiée du dashboard.
const RESOURCES = [
  {
    slug: 'methode_arche',
    type: 'ebook',
    typeLabel: 'Ebook',
    title: 'Méthode ARCHE',
    subtitle: 'Édition fondatrice',
    description: 'Le système intégral pour apprendre vite, retenir longtemps, et reprendre confiance en sa propre intelligence. 26 pages — Analyser · Restructurer · Consolider · Habituer · Évaluer.',
    author: 'Enya, fondatrice SBE',
    pages: 26,
    htmlFile: 'SBE_Methode_ARCHE_Ebook.html',
    pdfFile: 'SBE_Methode_ARCHE_Ebook.pdf',
    initials: 'A',
    accent: '#B8954A',
    accentSoft: '#D4B574',
    bg: 'linear-gradient(165deg,#0E1B3A 0%,#1B2952 55%,#0A1530 100%)',
    tags: ['méthode', 'mindset', 'ARCHE', 'fondatrice'],
  },
];

// ─── HTML parser ────────────────────────────────────────────────
function parseEpisodes(html, series) {
  const eps = [];
  // Match ep-section blocks
  const sections = html.split(/<div class="ep-section"/);
  for (let i = 1; i < sections.length; i++) {
    const block = sections[i];

    // Episode number
    let epNum = null;
    const numMatch = block.match(/<div class="ep-num-big">(\d+)<\/div>/) ||
                     block.match(/<div class="ep-tag">([^<]+)<\/div>/);
    if (numMatch) epNum = numMatch[1].trim();

    // Title
    const titleMatch = block.match(/<div class="(?:ep-title|ep-title-txt)">([^<]+)<\/div>/);
    const title = titleMatch ? titleMatch[1].trim() : '(sans titre)';

    // Description
    let description = '';
    const descMatch = block.match(/<div class="desc-text"[^>]*>([\s\S]*?)<\/div>/);
    if (descMatch) {
      description = descMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Hashtags
    let hashtags = '';
    const hashMatch = block.match(/<div class="hashtag-wrap"[^>]*>([\s\S]*?)<\/div>/);
    if (hashMatch) {
      hashtags = hashMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Slide count : compte les <div class="slide ..."
    const slideCount = (block.match(/<div class="slide /g) || []).length;

    if (epNum) {
      eps.push({ series, epNum, title, description, hashtags, slideCount });
    }
  }
  return eps;
}

// ─── Process each source ────────────────────────────────────────
const allEps = [];
for (const src of SOURCES) {
  const filePath = path.join(DL, src.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Missing: ${src.file}`);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf-8');
  const eps = parseEpisodes(html, src.series);
  for (const ep of eps) {
    ep.sourceFile = src.file;
    ep.pngPrefix = src.pngPrefix;
    ep.isSpecial = !!src.isSpecial;
    ep.specialSlug = src.specialSlug;
    allEps.push(ep);
  }
  console.log(`✓ ${src.file} → ${eps.length} épisode(s)`);
}

// ─── Liste tous les PNG existants ───────────────────────────────
const allPngs = fs.readdirSync(DL).filter(f => /^SBE_.*\.png$/i.test(f));
console.log(`📸 ${allPngs.length} PNG trouvés dans Downloads`);

// ─── Create folders + move PNGs + write metadata ────────────────
let folderCount = 0;
let movedPngs = 0;

for (const ep of allEps) {
  let folderName;
  if (ep.isSpecial) {
    folderName = `Special_${ep.specialSlug || slug(ep.title)}`;
  } else {
    folderName = `${ep.series}_Ep${String(ep.epNum).padStart(2,'0')}_${slug(ep.title)}`;
  }
  const folderPath = path.join(ROOT, folderName);
  fs.mkdirSync(folderPath, { recursive: true });
  folderCount++;

  // metadata files
  fs.writeFileSync(path.join(folderPath, '_title.txt'), ep.title + '\n');
  fs.writeFileSync(path.join(folderPath, '_description.txt'), ep.description + '\n');
  fs.writeFileSync(path.join(folderPath, '_hashtags.txt'), ep.hashtags + '\n');
  fs.writeFileSync(path.join(folderPath, '_source.txt'),
    `Source: ${ep.sourceFile}\nLocal URL: http://localhost:8088/${ep.sourceFile}\n`);

  // Move matching PNGs
  for (const pngName of allPngs) {
    const m = pngName.match(ep.pngPrefix);
    if (!m) continue;
    let pngEp, pngSlide;
    if (ep.isSpecial) {
      pngEp = ep.epNum;
      pngSlide = m[1];
    } else {
      pngEp = m[1];
      pngSlide = m[2];
    }
    // Comparaison numérique (gère "01" vs "1")
    if (parseInt(pngEp, 10) !== parseInt(ep.epNum, 10)) continue;
    const newName = `slide_${String(pngSlide).padStart(2,'0')}.png`;
    const src = path.join(DL, pngName);
    const dst = path.join(folderPath, newName);
    try {
      fs.renameSync(src, dst);
      movedPngs++;
    } catch (e) {
      // Fallback : copie + suppression
      try {
        fs.copyFileSync(src, dst);
        fs.unlinkSync(src);
        movedPngs++;
      } catch (e2) {
        console.log(`  ⚠️  Échec déplacement ${pngName}: ${e2.message}`);
      }
    }
  }
}

console.log(`📁 ${folderCount} dossiers créés`);
console.log(`📷 ${movedPngs} PNG déplacés dans leurs dossiers`);

// ─── Generate Dashboard HTML ────────────────────────────────────
const seriesMeta = {
  L1: { name: 'Série L1', color: '#2D5BE3', bg: '#EEF4FF', desc: 'Étudiants L1 Éco-Gestion · découverte, première année' },
  L2: { name: 'Série L2', color: '#C9A84C', bg: '#1B2A4A', desc: 'Étudiants L2 Éco-Gestion · approfondissement, nuit studieuse' },
  WakeUp: { name: 'Série Wake Up', color: '#C0392B', bg: '#FAF8F4', desc: 'Erreurs qui ruinent ta réussite · viral, coup de poing' },
  Special: { name: 'Éditions spéciales', color: '#5C6B2C', bg: '#F4EEDE', desc: 'Carrousels uniques · branding propre par sujet' }
};

// Group eps by series
const grouped = {};
for (const ep of allEps) {
  const key = ep.series;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(ep);
}
// Sort each series by epNum
for (const k in grouped) {
  grouped[k].sort((a, b) => {
    const an = parseInt(a.epNum) || 0;
    const bn = parseInt(b.epNum) || 0;
    return an - bn;
  });
}

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

// ─── Resource card (ebooks / PDF / ressources longues SBE) ──────
function resourceCard(r) {
  const dlExists = (file) => file && fs.existsSync(path.join(HOME, 'storage/shared/Download', file));
  const hasHtml = dlExists(r.htmlFile);
  const hasPdf  = dlExists(r.pdfFile);
  const pdfSize = hasPdf
    ? (() => { try { return Math.round(fs.statSync(path.join(HOME, 'storage/shared/Download', r.pdfFile)).size / 1024 / 1024 * 10) / 10 + ' MB'; } catch(_){return '';} })()
    : '';
  const tagsHtml = (r.tags || []).map(t => `<span class="r-tag">${escapeHtml(t)}</span>`).join('');
  return `
  <article class="card r-card" data-series="Resource" data-resource-type="${escapeHtml(r.type)}" data-has-pngs="true" data-search="${escapeHtml((r.title + ' ' + (r.subtitle||'') + ' ' + r.description + ' ' + (r.tags||[]).join(' ')).toLowerCase())}">
    <div class="r-thumb" style="background:${r.bg || '#1B2A4A'}">
      <div class="r-initials" style="color:${r.accentSoft || '#D4B574'}">${escapeHtml(r.initials || r.title.slice(0,1))}</div>
      <div class="r-decor" style="background:radial-gradient(ellipse at top right,${r.accent}33 0%,transparent 60%)"></div>
      <div class="card-badge" style="background:${r.accent || '#B8954A'};color:#0E1B3A">${escapeHtml((r.typeLabel || r.type).toUpperCase())}</div>
      ${r.pages ? `<div class="r-pages">${r.pages} pages</div>` : ''}
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span>${escapeHtml(r.subtitle || '')}</span>
        ${r.author ? `<span style="text-transform:none;letter-spacing:0;font-style:italic;color:#8A7A6B">${escapeHtml(r.author)}</span>` : ''}
      </div>
      <h2 class="card-title" style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:22px">${escapeHtml(r.title)}</h2>
      <p style="font-size:13.5px;line-height:1.55;color:#4B4F60;margin-bottom:14px">${escapeHtml(r.description)}</p>
      ${tagsHtml ? `<div class="r-tags">${tagsHtml}</div>` : ''}
      <div class="card-actions">
        ${hasHtml ? `<a class="btn btn-primary" href="/${encodeURIComponent(r.htmlFile)}" target="_blank">📖 Lire en ligne</a>` : ''}
        ${hasPdf ? `<a class="btn btn-warning" href="/${encodeURIComponent(r.pdfFile)}" download>⬇ PDF${pdfSize ? ' (' + pdfSize + ')' : ''}</a>` : ''}
        ${!hasHtml && !hasPdf ? `<span class="btn btn-ghost" style="cursor:default;opacity:.5">Fichiers introuvables</span>` : ''}
      </div>
    </div>
  </article>`;
}

function epCard(ep) {
  const folderName = ep.isSpecial
    ? `Special_${ep.specialSlug || slug(ep.title)}`
    : `${ep.series}_Ep${String(ep.epNum).padStart(2,'0')}_${slug(ep.title)}`;
  const meta = seriesMeta[ep.series];
  // Find first slide PNG for thumbnail
  const folderPath = path.join(ROOT, folderName);
  let thumb = '';
  let pngCount = 0;
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath).filter(f => /^slide_\d+\.png$/.test(f)).sort();
    pngCount = files.length;
    if (files.length > 0) {
      // Cache-bust avec mtime pour que Chrome rafraîchisse les thumbnails après chaque re-export
      const mt = fs.statSync(path.join(folderPath, files[0])).mtimeMs | 0;
      thumb = `${encodeURIComponent(folderName)}/${encodeURIComponent(files[0])}?v=${mt}`;
    }
  }
  const hasPngs = pngCount > 0;
  const completionBadge = hasPngs
    ? `<div class="status-badge ready">✓ ${pngCount} PNG</div>`
    : `<div class="status-badge missing">⚠ À télécharger</div>`;
  return `
  <article class="card${hasPngs ? '' : ' incomplete'}" data-series="${ep.series}" data-has-pngs="${hasPngs}" data-search="${escapeHtml((ep.title + ' ' + ep.description).toLowerCase())}">
    <div class="card-thumb" style="background:${meta.bg}">
      ${thumb
        ? `<img src="${thumb}" loading="lazy" alt="">`
        : `<div class="thumb-placeholder">${ep.isSpecial ? 'CV' : ep.epNum}</div>`}
      <div class="card-badge" style="background:${meta.color}">${ep.isSpecial ? 'SPÉCIAL' : ep.series}</div>
      ${completionBadge}
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-num">${ep.isSpecial ? 'Édition spéciale' : 'Ép. ' + ep.epNum}</span>
        <span class="card-slides">${ep.slideCount} slides</span>
      </div>
      <h2 class="card-title">${escapeHtml(ep.title)}</h2>
      <details class="card-details">
        <summary>📝 Description &amp; hashtags</summary>
        <div class="detail-block">
          <div class="detail-label">Description <button class="cpy" data-copy="d_${ep.series}_${ep.epNum}">📋</button></div>
          <pre class="detail-text" id="d_${ep.series}_${ep.epNum}">${escapeHtml(ep.description)}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-label">Hashtags <button class="cpy" data-copy="h_${ep.series}_${ep.epNum}">📋</button></div>
          <pre class="detail-text hashtags" id="h_${ep.series}_${ep.epNum}">${escapeHtml(ep.hashtags)}</pre>
        </div>
      </details>
      <div class="card-actions">
        ${hasPngs
          ? `<a class="btn btn-primary" href="/dashboard/${encodeURIComponent(folderName)}/zip" download="SBE_${folderName}.zip">⬇ Télécharger ZIP (${pngCount} images)</a>`
          : `<a class="btn btn-warning" href="/editor/${ep.sourceFile}?autodl=1" target="_blank">⬇ Générer + télécharger</a>`}
        <a class="btn btn-ghost" href="/editor/${ep.sourceFile}" target="_blank">🎨 Éditer</a>
      </div>
    </div>
  </article>`;
}

const dashboardHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>SBE TikTok — Mes carrousels</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#FAF6F1;font-family:'DM Sans',sans-serif;color:#1B2A4A;}
header{background:#1B2A4A;color:#fff;padding:24px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 16px rgba(0,0,0,0.1);}
header h1{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;letter-spacing:-0.5px;}
header h1 span{color:#C9A84C;}
header .sub{font-size:12px;opacity:0.7;margin-top:4px;letter-spacing:1px;text-transform:uppercase;}
.controls{padding:16px 20px;background:#fff;border-bottom:1px solid #E8DFD3;position:sticky;top:80px;z-index:99;display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
.search{flex:1;min-width:200px;padding:10px 14px;border:1px solid #E8DFD3;border-radius:8px;font-family:inherit;font-size:14px;}
.filter{padding:8px 14px;border:1px solid #E8DFD3;background:#fff;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;cursor:pointer;transition:all .2s;color:#1B2A4A;}
.filter:hover{background:#1B2A4A;color:#fff;}
.filter.active{background:#1B2A4A;color:#fff;}
.filter[data-series="L1"].active{background:#2D5BE3;border-color:#2D5BE3;}
.filter[data-series="L2"].active{background:#C9A84C;border-color:#C9A84C;color:#1B2A4A;}
.filter[data-series="WakeUp"].active{background:#C0392B;border-color:#C0392B;}
.filter[data-series="Special"].active{background:#5C6B2C;border-color:#5C6B2C;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;padding:18px;max-width:1400px;margin:0 auto;}
.card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(27,42,74,0.08);transition:transform .2s,box-shadow .2s;}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(27,42,74,0.12);}
.card-thumb{aspect-ratio:4/5;position:relative;overflow:hidden;}
.card-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.thumb-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:900;font-size:60px;color:rgba(0,0,0,0.15);}
.card-badge{position:absolute;top:10px;right:10px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 9px;border-radius:100px;color:#fff;}
.card-body{padding:16px;}
.card-meta{display:flex;justify-content:space-between;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#8A7A6B;margin-bottom:8px;}
.card-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;line-height:1.25;letter-spacing:-0.2px;margin-bottom:12px;color:#1B2A4A;}
.card-details{margin-bottom:12px;border-top:1px solid #F0E8DD;padding-top:10px;}
.card-details summary{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8A7A6B;cursor:pointer;padding:4px 0;}
.card-details[open] summary{color:#1B2A4A;margin-bottom:8px;}
.detail-block{margin-bottom:10px;}
.detail-label{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8A7A6B;margin-bottom:4px;}
.detail-text{font-size:12px;line-height:1.5;color:#1B2A4A;white-space:pre-wrap;font-family:inherit;background:#FAF6F1;padding:8px 10px;border-radius:6px;border:1px solid #F0E8DD;}
.detail-text.hashtags{color:#2D5BE3;font-size:11px;}
.cpy{background:#fff;border:1px solid #E8DFD3;border-radius:5px;padding:3px 7px;cursor:pointer;font-size:12px;}
.cpy:hover{background:#1B2A4A;color:#fff;border-color:#1B2A4A;}
.cpy.copied{background:#0D9488;color:#fff;border-color:#0D9488;}
.card-actions{display:flex;gap:8px;flex-wrap:wrap;}
.btn{flex:1;min-width:120px;display:inline-block;text-align:center;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.5px;padding:9px 12px;border-radius:7px;transition:all .15s;text-transform:uppercase;}
.btn-primary{background:#1B2A4A;color:#fff;}
.btn-primary:hover{background:#2D5BE3;}
.btn-ghost{background:#FAF6F1;color:#1B2A4A;border:1px solid #E8DFD3;}
.btn-ghost:hover{background:#E8DFD3;}
.btn-warning{background:#C9A84C;color:#1B2A4A;}
.btn-warning:hover{background:#B89638;}
.status-badge{position:absolute;bottom:10px;left:10px;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 9px;border-radius:100px;}
.status-badge.ready{background:rgba(13,148,136,0.9);color:#fff;}
.status-badge.missing{background:rgba(201,168,76,0.95);color:#1B2A4A;}
.card.incomplete{outline:2px solid #C9A84C;outline-offset:-2px;}
.filter[data-series="Resource"].active{background:#B8954A;border-color:#B8954A;color:#0E1B3A;}
.r-card{border:1px solid #E5DFCF;}
.r-card .card-title{color:#0E1B3A;}
.r-thumb{aspect-ratio:4/5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.r-thumb .r-initials{font-family:'Playfair Display',serif;font-weight:900;font-size:160px;line-height:1;letter-spacing:-.04em;z-index:1;}
.r-thumb .r-decor{position:absolute;inset:0;pointer-events:none;z-index:0;}
.r-thumb .r-pages{position:absolute;bottom:10px;right:10px;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#D4B574;background:rgba(14,27,58,0.4);padding:4px 10px;border-radius:100px;backdrop-filter:blur(6px);}
.r-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.r-tag{font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;background:#FAF6EC;border:1px solid #E5DFCF;border-radius:100px;color:#8A7A6B;font-weight:600;}
.section-resources{background:linear-gradient(180deg,transparent 0%,rgba(184,149,74,0.04) 100%);padding-bottom:30px;border-top:1px solid #E5DFCF;margin-top:20px;}
.section-resources .section-heading h2{font-family:'Playfair Display',serif;font-style:italic;}
.section-resources .section-heading h2 .r-count{font-size:13px;color:#B8954A;letter-spacing:1px;font-style:normal;}
.section-resources .section-heading::before{content:'';display:block;width:40px;height:1px;background:#B8954A;margin-bottom:12px;}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(8px);background:#1B2A4A;color:#fff;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:600;opacity:0;transition:all .3s;z-index:200;pointer-events:none;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.section-heading{padding:24px 20px 4px;max-width:1400px;margin:0 auto;}
.section-heading h2{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:#1B2A4A;}
.section-heading p{font-size:13px;color:#8A7A6B;margin-top:4px;}
.empty{text-align:center;padding:60px 20px;color:#8A7A6B;font-size:14px;}
@media(max-width:600px){.grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:12px;}.card-title{font-size:13px;}.card-body{padding:12px;}}
</style>
</head>
<body>

<header>
  <h1>SBE<span> TikTok</span></h1>
  <div class="sub">${allEps.length} épisodes · ${Object.keys(grouped).length} séries${RESOURCES.length ? ` · ${RESOURCES.length} ebook${RESOURCES.length>1?'s':''}` : ''} · Tableau de bord</div>
</header>

<div class="controls">
  <input type="search" class="search" id="search" placeholder="🔍 Chercher un sujet, un mot-clé…">
  <button class="filter active" data-series="ALL">Tous</button>
  ${Object.entries(seriesMeta).filter(([k]) => grouped[k]).map(([k, m]) =>
    `<button class="filter" data-series="${k}">${m.name}</button>`
  ).join('')}
  ${RESOURCES.length ? `<button class="filter" data-series="Resource">📚 Ebooks &amp; Ressources</button>` : ''}
  <button class="filter" data-status="missing" id="filter-missing">⚠ À télécharger</button>
</div>

${Object.entries(grouped).map(([series, eps]) => `
<div class="section" data-series-section="${series}">
  <div class="section-heading">
    <h2>${seriesMeta[series].name} <span style="font-size:13px;color:${seriesMeta[series].color};letter-spacing:1px;">(${eps.length})</span></h2>
    <p>${seriesMeta[series].desc}</p>
  </div>
  <div class="grid">
    ${eps.map(epCard).join('')}
  </div>
</div>
`).join('')}

${RESOURCES.length ? `
<div class="section section-resources" data-series-section="Resource">
  <div class="section-heading">
    <h2>Ebooks &amp; Ressources <span class="r-count">(${RESOURCES.length})</span></h2>
    <p>Contenus longs SBE — éditoriaux, guides, méthodes. <em>Pas du contenu TikTok.</em></p>
  </div>
  <div class="grid">
    ${RESOURCES.map(resourceCard).join('')}
  </div>
</div>
` : ''}

<div class="toast" id="toast"></div>

<script>
const search = document.getElementById('search');
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');
let activeFilter = 'ALL';
let activeSearch = '';
let activeStatus = null;

function apply() {
  cards.forEach(c => {
    const matchSeries = activeFilter === 'ALL' || c.dataset.series === activeFilter;
    const matchSearch = !activeSearch || c.dataset.search.includes(activeSearch);
    const matchStatus = !activeStatus || (activeStatus === 'missing' && c.dataset.hasPngs === 'false');
    c.style.display = matchSeries && matchSearch && matchStatus ? '' : 'none';
  });
  document.querySelectorAll('[data-series-section]').forEach(sec => {
    const visible = sec.querySelectorAll('.card:not([style*="display: none"])').length;
    sec.style.display = visible > 0 ? '' : 'none';
  });
}

search.addEventListener('input', e => { activeSearch = e.target.value.toLowerCase().trim(); apply(); });
filters.forEach(f => f.addEventListener('click', () => {
  filters.forEach(x => x.classList.remove('active'));
  f.classList.add('active');
  if (f.dataset.status) {
    activeStatus = f.dataset.status;
    activeFilter = 'ALL';
  } else {
    activeStatus = null;
    activeFilter = f.dataset.series;
  }
  apply();
}));

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__tt);
  window.__tt = setTimeout(() => t.classList.remove('show'), 1800);
}

// ─── COPY (multi-méthode : clipboard / share / modal sélectionnable) ──
function copyText(txt, btn){
  const success = () => {
    showToast('✓ Copié !');
    if(btn){ btn.classList.add('copied'); setTimeout(()=>btn.classList.remove('copied'),1500); }
  };

  // Méthode 1 : Clipboard API (HTTPS / localhost)
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    navigator.clipboard.writeText(txt).then(success).catch(() => openCopyModal(txt, btn));
    return;
  }
  // Méthode 2 : Web Share API (HTTP mobile compatible)
  if (navigator.share) {
    navigator.share({ text: txt }).then(success).catch(() => openCopyModal(txt, btn));
    return;
  }
  // Méthode 3 : modal sélectionnable
  openCopyModal(txt, btn);
}

function openCopyModal(txt, btn){
  // Crée un overlay modal avec le texte dans un textarea pré-sélectionné
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(27,42,74,0.85);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:520px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4);"><div style="font-family:Georgia,serif;font-weight:700;margin-bottom:8px;color:#1B2A4A;">Sélectionne le texte ci-dessous</div><div style="font-size:12px;color:#8A7A6B;margin-bottom:14px;">Long-presse → Tout sélectionner → Copier</div><textarea id="__copytxt" readonly style="width:100%;min-height:200px;border:1px solid #E8DFD3;border-radius:8px;padding:12px;font:14px/1.5 system-ui;color:#1B2A4A;background:#FAF6F1;resize:vertical;-webkit-user-select:text;user-select:text;"></textarea><div style="display:flex;gap:8px;margin-top:14px;"><button id="__copyfermer" style="flex:1;padding:12px;border:none;border-radius:8px;background:#1B2A4A;color:#fff;font-weight:600;cursor:pointer;">Fermer</button></div></div>';
  document.body.appendChild(overlay);
  const ta = overlay.querySelector('#__copytxt');
  ta.value = txt;
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, txt.length);
  overlay.querySelector('#__copyfermer').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  // Tente quand même execCommand au passage
  try { if (document.execCommand('copy')) { showToast('✓ Copié !'); if(btn){btn.classList.add('copied');setTimeout(()=>btn.classList.remove('copied'),1500);}} } catch(_){}
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.cpy');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.copy;
  const el = document.getElementById(id);
  if (!el) return;
  copyText(el.textContent.trim(), btn);
});

// Téléchargement via ZIP : géré par les <a href="/dashboard/.../zip" download>
// (un seul fichier ZIP → fonctionne sur mobile sans demande d'autorisation multiple)

// ─── Force toutes les URLs relatives sur l'origin actuel (host:port d'où la page est chargée)
// Évite les redirections parasites vers Lunéa (service worker) ou ailleurs.
(function fixLinks(){
  const here = window.location.origin; // ex. http://192.168.100.121:8088
  document.querySelectorAll('a[href^="/"], img[src*=".png"]').forEach(el => {
    if (el.tagName === 'A') {
      const h = el.getAttribute('href');
      if (h && h.startsWith('/')) el.href = here + h;
      el.setAttribute('rel', 'noopener');
      el.setAttribute('target', '_blank');
    }
    if (el.tagName === 'IMG') {
      const s = el.getAttribute('src');
      if (s && !/^https?:/i.test(s)) {
        // Ajoute un timestamp unique à chaque chargement pour bypasser le cache disque agressif
        const sep = s.includes('?') ? '&' : '?';
        el.src = here + '/dashboard/' + s + sep + '_t=' + Date.now();
      }
    }
  });
  // Désinscrit tout service worker parasite (Lunéa) sur cette origin si jamais
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    }).catch(()=>{});
  }
})();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, '00_DASHBOARD.html'), dashboardHtml);
console.log(`🎨 Dashboard généré : ${path.join(ROOT, '00_DASHBOARD.html')}`);

// ─── README.md fallback ─────────────────────────────────────────
let readme = `# SBE — Mes carrousels TikTok

**${allEps.length} épisodes** organisés dans ce dossier.

Ouvre \`00_DASHBOARD.html\` (double-tap dans le gestionnaire de fichiers) pour une vue complète avec recherche, filtres et copie en 1 tap des descriptions/hashtags.

## Structure de chaque dossier
Chaque dossier contient :
- \`slide_01.png\` à \`slide_NN.png\` — les images dans l'ordre du carrousel
- \`_title.txt\` — titre éditorial
- \`_description.txt\` — caption TikTok
- \`_hashtags.txt\` — hashtags
- \`_source.txt\` — fichier HTML source

## Récap par série
`;
for (const [series, eps] of Object.entries(grouped)) {
  readme += `\n### ${seriesMeta[series].name} (${eps.length} épisodes)\n${seriesMeta[series].desc}\n\n`;
  for (const ep of eps) {
    readme += `- **${ep.isSpecial ? 'Spécial' : 'Ép. ' + ep.epNum}** — ${ep.title} _(${ep.slideCount} slides)_\n`;
  }
}
fs.writeFileSync(path.join(ROOT, '00_README.md'), readme);
console.log(`📖 README généré`);

console.log('\n✓ Tout est prêt');
console.log(`👉 Ouvre : ${path.join(ROOT, '00_DASHBOARD.html')}`);
