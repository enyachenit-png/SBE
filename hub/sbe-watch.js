#!/usr/bin/env node
/**
 * SBE Carousels Watcher
 * Surveille ~/storage/shared/Download/ et déplace automatiquement
 * les nouveaux PNG SBE_* dans le bon dossier de SBE_Carousels/.
 * Lance ce script en background une fois et oublie-le.
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME;
const DL = path.join(HOME, 'storage/shared/Download');
const ROOT = path.join(HOME, 'storage/shared/Pictures/SBE_Carousels');

function slug(s){
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')
    .split('_').slice(0,6).join('_').slice(0,40);
}

// Lookup table: prefix → { series, epNum extractor }
const PATTERNS = [
  { re: /^SBE_L1_ep(\d+)_(\d+)(?:\s*\(\d+\))?\.png$/i,        series:'L1' },
  { re: /^SBE_L2_ep(\d+)_(\d+)(?:\s*\(\d+\))?\.png$/i,        series:'L2' },
  { re: /^SBE_WU_(?:ep|w)0?(\d+)_0?(\d+)(?:\s*\(\d+\))?\.png$/i, series:'WakeUp' },
  { re: /^SBE_Special_cv_0?(\d+)(?:\s*\(\d+\))?\.png$/i,      series:'Special', special:'CV_Parcoursup_Alternance' },
  { re: /^SBE_2min_0?(\d+)(?:\s*\(\d+\))?\.png$/i,            series:'Special', special:'Flash_2_Minutes' },
  { re: /^SBE_elite_0?(\d+)(?:\s*\(\d+\))?\.png$/i,           series:'Special', special:'Elite_15Plus_Moyenne' },
  { re: /^SBE_mental_0?(\d+)(?:\s*\(\d+\))?\.png$/i,          series:'Special', special:'Mental_Procrastination' },
  { re: /^SBE_nuit_0?(\d+)(?:\s*\(\d+\))?\.png$/i,            series:'Special', special:'Nuit_Sommeil' },
  { re: /^SBE_voix_0?(\d+)(?:\s*\(\d+\))?\.png$/i,            series:'Special', special:'Voix_Amphi' },
  { re: /^SBE_fondatrice_0?(\d+)(?:\s*\(\d+\))?\.png$/i,      series:'Special', special:'Fondatrice_Story' },
  { re: /^SBE_prepaL1_0?(\d+)(?:\s*\(\d+\))?\.png$/i,         series:'Special', special:'Prepa_L1' },
  { re: /^SBE_ruptureL2_0?(\d+)(?:\s*\(\d+\))?\.png$/i,       series:'Special', special:'Rupture_L2' },
];

// Pour les PNG EnyaWellness, on délègue à wellness-organize.js qui scanne lui-même
// après chaque changement dans Downloads.

function findFolder(series, epNum, specialSlug) {
  const epPad = String(epNum).padStart(2,'0');
  const dirs = fs.readdirSync(ROOT).filter(d => {
    const full = path.join(ROOT,d);
    if (!fs.statSync(full).isDirectory()) return false;
    if (series === 'Special') return d === `Special_${specialSlug}`;
    return d.startsWith(`${series}_Ep${epPad}_`);
  });
  return dirs[0] ? path.join(ROOT, dirs[0]) : null;
}

function tryMove(fileName) {
  for (const p of PATTERNS) {
    const m = fileName.match(p.re);
    if (!m) continue;
    let epNum, slideNum, specialSlug;
    if (p.special) { epNum = p.special; slideNum = parseInt(m[1],10); specialSlug = p.special; }
    else { epNum = parseInt(m[1],10); slideNum = parseInt(m[2],10); }
    const folder = findFolder(p.series, epNum, specialSlug);
    if (!folder) {
      console.log(`  ⚠ Pas de dossier pour ${p.series} ep${epNum} — ignoré`);
      return false;
    }
    const dest = path.join(folder, `slide_${String(slideNum).padStart(2,'0')}.png`);
    const src = path.join(DL, fileName);
    try {
      fs.renameSync(src, dest);
      console.log(`✓ ${fileName} → ${path.basename(folder)}/slide_${String(slideNum).padStart(2,'0')}.png`);
      return true;
    } catch(e) {
      try {
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
        console.log(`✓ ${fileName} → ${path.basename(folder)}/slide_${String(slideNum).padStart(2,'0')}.png (copy+unlink)`);
        return true;
      } catch(e2) {
        console.log(`  ✗ ${fileName}: ${e2.message}`);
        return false;
      }
    }
  }
  return false;
}

// Sync initial : déplace tous les PNG matching qui sont déjà dans Downloads
let initial = 0;
for (const f of fs.readdirSync(DL)) {
  if (tryMove(f)) initial++;
}
console.log(`📦 Sync initial : ${initial} fichier(s) déplacé(s)`);

// Watcher
console.log(`👀 Surveille ${DL}…`);
fs.watch(DL, { persistent: true }, (event, fileName) => {
  if (!fileName) return;
  if (/^SBE_.*\.png$/i.test(fileName)) {
    setTimeout(() => {
      if (fs.existsSync(path.join(DL, fileName))) {
        tryMove(fileName);
        try { require('child_process').execSync(`node ${path.join(HOME,'sbe-organize.js')} > /dev/null 2>&1`); } catch(_) {}
      }
    }, 800);
  }
  if (/^EW_.*\.(png|html)$/i.test(fileName)) {
    setTimeout(() => {
      try { require('child_process').execSync(`node ${path.join(HOME,'wellness-organize.js')} > /dev/null 2>&1`); } catch(_) {}
    }, 800);
  }
});
