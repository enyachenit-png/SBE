#!/usr/bin/env node
/**
 * Generateur de carrousels SBE uniques (one-off).
 * Chaque config = une DA propre + 6 slides + desc + hashtags.
 */
const fs = require('fs');
const path = require('path');
const HOME = process.env.HOME;
const DL = path.join(HOME, 'storage/shared/Download');

// ─── Template universel ─────────────────────────────────────────────
function buildHTML(c) {
  const p = c.palette;
  const cssVars = Object.entries(p).map(([k,v]) => `  --${k}: ${v};`).join('\n');

  // CSS commun + couleurs custom
  const css = `
:root {
${cssVars}
  --gold: #C9A84C;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:${c.bodyBg};font-family:'DM Sans',sans-serif;color:${p.bodyText || p.paper};}

.topbar{background:${p.topbarBg || p.ink};color:${p.paper};padding:14px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;flex-wrap:wrap;gap:10px;box-shadow:0 2px 14px rgba(0,0,0,0.3);border-bottom:${c.topbarBorder || `1px solid rgba(255,255,255,0.08)`};}
.tb-logo{font-family:'Playfair Display',serif;font-weight:900;font-size:20px;color:${p.paper};letter-spacing:-0.5px;}
.tb-logo span.dot{color:${p.accent};}
.tb-badge{background:${p.accent};color:${p.accentText || p.ink};font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:4px 10px;margin-left:12px;border-radius:${c.radius || 3}px;}
.tb-info{font-size:11px;color:${p.ash};margin-left:8px;letter-spacing:0.5px;}
.btn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:8px 18px;border-radius:${c.radius || 5}px;border:none;cursor:pointer;text-transform:uppercase;transition:all .2s;}
.btn-primary{background:${p.accent};color:${p.accentText || p.ink};}
.btn-primary:hover{filter:brightness(1.1);}
.btn-ghost{background:rgba(255,255,255,0.07);color:${p.paper};border:1px solid rgba(255,255,255,0.15);}
.btn-ghost:hover{background:rgba(255,255,255,0.12);}
.btn-sm{padding:5px 12px;font-size:10px;}

.page{padding:32px;max-width:1600px;margin:0 auto;}
.ep-section{margin-bottom:60px;}
.ep-header{display:flex;align-items:center;gap:18px;margin-bottom:24px;padding:20px 26px;background:${p.ink};border:1px solid ${c.headerBorder || `rgba(255,255,255,0.08)`};border-left:4px solid ${p.accent};border-radius:${c.radius || 8}px;}
.ep-tag{font-family:'Playfair Display',serif;font-weight:900;font-size:32px;color:${p.accent};opacity:0.55;line-height:1;flex-shrink:0;letter-spacing:-1px;}
.ep-info{flex:1;}
.ep-serie{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${p.gold || '#C9A84C'};margin-bottom:6px;}
.ep-title-txt{font-family:'Playfair Display',serif;font-size:clamp(14px,1.9vw,19px);font-weight:700;color:${p.paper};letter-spacing:-0.2px;}
.ep-actions{display:flex;gap:8px;}

.slides-and-desc{display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start;}
.slides-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;}

.desc-panel{background:${p.ink};border:1px solid rgba(255,255,255,0.08);border-radius:${c.radius || 8}px;overflow:hidden;position:sticky;top:80px;}
.desc-panel-head{background:${p.accent};padding:12px 16px;}
.desc-panel-title{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${p.accentText || p.ink};}
.desc-section{padding:16px;border-bottom:1px solid rgba(255,255,255,0.06);}
.desc-section:last-child{border-bottom:none;}
.desc-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${p.ash};margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;}
.desc-text{font-size:12px;line-height:1.65;color:${p.paper};white-space:pre-wrap;cursor:text;user-select:all;}
.hashtag-wrap{font-size:11px;color:${p.gold || '#C9A84C'};line-height:1.8;cursor:text;user-select:all;}
.copy-btn{background:rgba(255,255,255,0.07);color:${p.paper};border:1px solid rgba(255,255,255,0.15);font-size:9px;font-weight:700;letter-spacing:0.6px;padding:3px 8px;border-radius:3px;cursor:pointer;text-transform:uppercase;}
.copy-btn:hover{background:${p.accent};color:${p.accentText || p.ink};border-color:${p.accent};}
.copy-btn.copied{background:rgba(13,148,136,0.2);color:#4ade80;border-color:#0D9488;}

.sw{display:flex;flex-direction:column;gap:8px;}
.sw-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${p.ash};display:flex;justify-content:space-between;align-items:center;}

.slide{width:100%;aspect-ratio:4/5;position:relative;overflow:hidden;container-type:inline-size;container-name:slide;border-radius:${c.radius || 8}px;box-shadow:${c.slideShadow || '0 12px 36px rgba(0,0,0,0.4),0 0 0 1px rgba(0,0,0,0.15)'};cursor:pointer;transition:transform .2s,box-shadow .2s;}
.slide:hover{transform:translateY(-3px);box-shadow:0 18px 48px rgba(0,0,0,0.5),0 0 0 2px ${p.accent};}

${c.bgClasses}

.si{width:100%;height:100%;padding:7% 8%;display:flex;flex-direction:column;position:relative;z-index:2;overflow-wrap:anywhere;word-break:normal;hyphens:auto;}
.slide *{word-wrap:break-word;overflow-wrap:anywhere;}
.dc{position:absolute;pointer-events:none;}

.s-logo{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(9px,2.5cqw,30px);letter-spacing:3px;text-transform:uppercase;margin-bottom:auto;}
.s-logo .dot{display:inline-block;width:5px;height:5px;border-radius:50%;margin:0 4px;vertical-align:middle;position:relative;top:-2px;}
.s-stamp{display:inline-flex;align-items:center;gap:6px;font-size:clamp(7px,1.5cqw,20px);font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:4px 11px;margin-bottom:5%;width:fit-content;border-radius:${c.radius === 0 ? 0 : 3}px;border:1.5px solid currentColor;background:transparent;}
.s-badge{display:inline-flex;align-items:center;font-size:clamp(7px,1.5cqw,20px);font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:${c.radius === 0 ? 0 : 100}px;margin-bottom:5%;width:fit-content;}
.s-eye{font-size:clamp(8px,1.7cqw,22px);font-weight:600;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:3%;opacity:.7;}
.s-h{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(13px,5cqw,66px);line-height:1.12;letter-spacing:-0.3px;margin-bottom:4%;}
.s-h em{font-style:italic;font-weight:700;}
.s-div{width:38px;height:2.5px;margin-bottom:4%;border-radius:2px;}
.s-body{font-size:clamp(9px,2cqw,28px);line-height:1.6;font-weight:300;opacity:0.88;}
.s-body strong{font-weight:600;opacity:1;}
.s-list{display:flex;flex-direction:column;gap:3%;}
.s-li{display:flex;align-items:flex-start;gap:8px;font-size:clamp(9px,1.9cqw,26px);line-height:1.4;}
.s-num{display:inline-flex;align-items:center;justify-content:center;width:clamp(18px,3.2cqw,42px);height:clamp(18px,3.2cqw,42px);border:1.5px solid currentColor;border-radius:50%;font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(9px,1.8cqw,24px);flex-shrink:0;line-height:1;}
.s-arr{font-size:clamp(11px,2.4cqw,30px);font-weight:700;flex-shrink:0;line-height:1;margin-top:1px;}
.s-box{border-radius:${c.radius || 6}px;padding:4% 5%;margin:3% 0;position:relative;}
.s-box p{font-size:clamp(9px,2cqw,26px);line-height:1.5;}
.s-cite{font-family:'Playfair Display',serif;font-style:italic;font-weight:400;}
.s-nbg{position:absolute;font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(60px,22cqw,300px);line-height:0.85;opacity:0.06;pointer-events:none;letter-spacing:-4px;}

.s-card{padding:3.5% 4.5%;border-radius:${c.radius || 4}px;border-left:3px solid ${p.accent};background:rgba(0,0,0,0.04);}
.s-card-head{font-size:clamp(9px,2cqw,26px);font-weight:600;margin-bottom:0.5%;display:flex;align-items:center;gap:8px;}
.s-card-num{font-family:'Playfair Display',serif;font-weight:900;color:${p.accent};font-size:clamp(11px,2.4cqw,30px);}
.s-card-sub{font-size:clamp(8px,1.6cqw,22px);opacity:0.65;font-style:italic;line-height:1.4;}

.s-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:4%;}
.s-foot.b-light{border-top:1px dashed rgba(0,0,0,0.15);}
.s-foot.b-dark{border-top:1px dashed rgba(255,255,255,0.18);}
.s-wm{font-size:clamp(7px,1.3cqw,18px);font-weight:600;letter-spacing:2px;text-transform:uppercase;opacity:0.35;}
.s-pg{font-size:clamp(7px,1.3cqw,18px);font-weight:700;letter-spacing:1.5px;opacity:0.4;}
.s-content{flex:1;display:flex;flex-direction:column;justify-content:center;}

.s-fold{position:absolute;top:0;right:0;width:clamp(24px,5cqw,70px);height:clamp(24px,5cqw,70px);background:linear-gradient(225deg,transparent 50%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.12));pointer-events:none;z-index:3;}

.cta-icon{font-size:clamp(22px,7cqw,90px);margin-bottom:4%;text-align:center;line-height:1;}
.cta-h{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(16px,6cqw,80px);line-height:1.05;letter-spacing:-0.3px;margin-bottom:5%;text-align:center;}
.cta-pill{display:inline-block;border-radius:${c.radius === 0 ? 0 : 100}px;padding:3% 7%;font-size:clamp(8px,1.8cqw,24px);font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-top:5%;border:1.5px solid currentColor;background:transparent;}

.toast{position:fixed;bottom:20px;right:20px;background:${p.ink};border:1.5px solid ${p.accent};color:${p.paper};padding:10px 18px;border-radius:4px;font-size:12px;font-weight:600;opacity:0;transform:translateY(8px);transition:all .3s;z-index:9999;pointer-events:none;}
.toast.show{opacity:1;transform:translateY(0);}

@media(max-width:1100px){.slides-and-desc{grid-template-columns:1fr;}.desc-panel{position:static;}}
@media(max-width:600px){.page{padding:16px;}.topbar{padding:12px 16px;}.slides-row{grid-template-columns:repeat(3,1fr);gap:10px;}}
`;

  // Génère chaque slide
  const slidesHTML = c.slides.map((s, i) => {
    const n = i + 1;
    const id = `${c.id}s${n}`;
    const total = c.slides.length;
    return `      <div class="sw"><div class="sw-label">${String(n).padStart(2,'0')} · ${s.label} <button class="btn btn-ghost btn-sm" onclick="dl('${id}','${c.id}_${String(n).padStart(2,'0')}')">⬇</button></div>
        <div class="slide ${s.bg}" id="${id}" onclick="dl('${id}','${c.id}_${String(n).padStart(2,'0')}')">${s.deco || ''}
          <div class="si"${s.padLeft ? ' style="padding-left:11%"' : ''}>
            <div class="s-logo" style="color:${s.logoColor};">SBE<span class="dot" style="background:${s.dotColor}"></span></div>
            ${s.badge}
            <div class="s-content">
              ${s.eye ? `<div class="s-eye" style="color:${s.eyeColor};">${s.eye}</div>` : ''}
              ${s.headline ? `<div class="s-h" style="color:${s.headColor};">${s.headline}</div>` : ''}
              ${s.divColor ? `<div class="s-div" style="background:${s.divColor};${s.divCenter ? 'margin:0 auto 5%;' : ''}"></div>` : ''}
              ${s.body || ''}
            </div>
            <div class="s-foot ${s.footBorder || 'b-dark'}"><div class="s-wm" style="color:${s.footColor};">@sbe · ${c.concept.toLowerCase()}</div><div class="s-pg" style="color:${s.footColor};">${String(n).padStart(2,'0')}/${String(total).padStart(2,'0')}</div></div>
          </div>
        </div>
      </div>`;
  }).join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SBE TikTok — ${c.concept} · ${c.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>${css}</style>
</head>
<body>

<div class="topbar">
  <div style="display:flex;align-items:center;gap:6px;">
    <div class="tb-logo">SBE<span class="dot">.</span><span class="tb-badge">${c.badge}</span></div>
    <div class="tb-info">${c.tagline}</div>
  </div>
  <button class="btn btn-primary" onclick="dlAll()">⬇ Tout télécharger</button>
</div>

<div class="page">
<div class="ep-section">
  <div class="ep-header">
    <div class="ep-tag">${c.tag}</div>
    <div class="ep-info">
      <div class="ep-serie">Carrousel unique · ${c.concept}</div>
      <div class="ep-title-txt">${c.title}</div>
    </div>
    <div class="ep-actions"><button class="btn btn-ghost btn-sm" onclick="dlAll()">⬇ ${c.slides.length} slides</button></div>
  </div>

  <div class="slides-and-desc">
    <div class="slides-row">
${slidesHTML}
    </div>

    <div class="desc-panel">
      <div class="desc-panel-head"><div class="desc-panel-title">📋 ${c.concept} — Description & Hashtags</div></div>
      <div class="desc-section">
        <div class="desc-label">📝 Description TikTok <button class="copy-btn" onclick="copyEl('d_${c.id}')">Copier</button></div>
        <div class="desc-text" id="d_${c.id}">${c.description}</div>
      </div>
      <div class="desc-section">
        <div class="desc-label"># Hashtags <button class="copy-btn" onclick="copyEl('h_${c.id}')">Copier</button></div>
        <div class="hashtag-wrap" id="h_${c.id}">${c.hashtags}</div>
      </div>
    </div>
  </div>
</div>
</div>

<div class="toast" id="toast"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__tt);window.__tt=setTimeout(()=>t.classList.remove('show'),2200);}
function copyEl(id){const el=document.getElementById(id);if(!el)return;const txt=el.textContent;navigator.clipboard.writeText(txt).then(()=>{showToast('✓ Copié !');const b=event.target;if(b){b.classList.add('copied');setTimeout(()=>b.classList.remove('copied'),1500);}}).catch(()=>{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast('✓ Copié !');}catch(_){}document.body.removeChild(ta);});}
async function captureSlide(id,filename){const orig=document.getElementById(id);if(!orig)return false;const wrap=document.createElement('div');wrap.style.cssText='position:fixed;top:0;left:-99999px;width:1080px;height:1350px;pointer-events:none;z-index:-1;background:transparent;';const clone=orig.cloneNode(true);clone.style.width='1080px';clone.style.height='1350px';clone.style.maxWidth='none';clone.style.aspectRatio='auto';clone.style.boxShadow='none';clone.style.transform='none';wrap.appendChild(clone);document.body.appendChild(wrap);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(document.fonts&&document.fonts.ready){try{await document.fonts.ready;}catch(_){}}try{const c=await html2canvas(clone,{scale:1,width:1080,height:1350,windowWidth:1080,windowHeight:1350,useCORS:true,allowTaint:true,backgroundColor:null,logging:false});const a=document.createElement('a');a.download='SBE_'+filename+'.png';a.href=c.toDataURL('image/png');a.click();return true;}catch(e){console.error(e);return false;}finally{document.body.removeChild(wrap);}}
async function dl(id,name){showToast('⏳ Génération…');const ok=await captureSlide(id,name);showToast(ok?'✓ '+name+'.png':'❌ Erreur');}
async function dlAll(){const slides=document.querySelectorAll('.slide[id]');showToast('⏳ Téléchargement ('+slides.length+')…');for(const el of slides){const id=el.id;const m=id.match(/^${c.id}s(\\d+)$/);const name=m?'${c.id}_'+String(m[1]).padStart(2,'0'):id;await captureSlide(id,name);await new Promise(r=>setTimeout(r,200));}showToast('✓ Tout téléchargé !');}
</script>
</body>
</html>`;
  return html;
}

// ─── 5 configs avec DA propres ──────────────────────────────────────
const CONFIGS = [
  // ════════════════════════════════════════════════════════════════
  // 1. FLASH — règle des 2 minutes
  // Palette : jaune moutarde + noir + blanc cassé + cyan
  // Ambiance : éclair, urgence positive, micro-action
  {
    id: '2min', concept: 'FLASH', tag: '2′',
    title: 'La règle des 2 minutes — la micro-règle qui change ta gestion du temps',
    badge: 'Flash · Productivité',
    tagline: 'Carrousel unique · Une règle, applicable immédiatement',
    bodyBg: '#1A1A1A',
    radius: 4,
    palette: {
      paper:'#F9F6EE', ink:'#0F0F0F', ink2:'#0A0A0A',
      accent:'#D4A017', accentText:'#0F0F0F',
      accent2:'#A37D0F', accentf:'#FDF5DC',
      cyan:'#0EA5A4', cyanf:'#DDFAF8',
      ash:'#7A766C',
    },
    bgClasses: `
.bg-paper{background:#F9F6EE;}
.bg-ink{background:#0F0F0F;}
.bg-mustard{background:#D4A017;}
.bg-mustardf{background:#FDF5DC;}
.bg-grad-ink{background:linear-gradient(160deg,#1A1A1A 0%,#000000 100%);}
.bg-cyanf{background:#DDFAF8;}
`,
    slides: [
      // 1. HOOK
      {label:'Hook', bg:'bg-grad-ink',
        deco:`<div class="dc" style="width:100%;height:4px;background:linear-gradient(90deg,#D4A017,#0EA5A4,transparent);top:0;left:0;"></div><div class="dc" style="width:60%;height:60%;background:radial-gradient(circle,rgba(212,160,23,0.15),transparent 70%);top:-12%;right:-15%;border-radius:50%;"></div><div class="s-nbg" style="color:#F9F6EE;right:5%;bottom:8%;">2′</div>`,
        logoColor:'#F9F6EE', dotColor:'#D4A017',
        badge:`<div class="s-stamp" style="color:#D4A017;">⚡ Règle Flash</div>`,
        eye:'La règle qui libère ton cerveau', eyeColor:'#0EA5A4',
        headline:'Une tâche de <em>moins de 2 minutes</em> ? Fais-la <em>maintenant</em>.',
        headColor:'#F9F6EE', divColor:'#D4A017',
        body:`<div class="s-body" style="color:rgba(249,246,238,0.8);">Cette règle seule peut te faire gagner <strong style="color:#D4A017;">1 heure par jour.</strong> 👇</div>`,
        footBorder:'b-dark', footColor:'#F9F6EE',
      },
      // 2. PROBLÈME
      {label:'Problème', bg:'bg-paper',
        deco:`<div class="dc" style="width:5px;height:60%;background:linear-gradient(180deg,#D4A017,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#0F0F0F', dotColor:'#D4A017',
        badge:`<div class="s-stamp" style="color:#A37D0F;background:#FDF5DC;border-color:#D4A017;">Le coût caché</div>`,
        eye:'Ton problème invisible', eyeColor:'#0EA5A4',
        headline:'Tu passes ta journée à "noter pour plus tard".',
        headColor:'#0F0F0F', divColor:'#D4A017',
        body:`<div class="s-body" style="color:#0F0F0F;">Relire ce chapitre. Répondre à ce mail. Chercher cette définition. Ces micro-tâches s'accumulent et créent une <strong>charge mentale invisible</strong> qui te fatigue avant d'avoir ouvert ton cours.</div>`,
        footBorder:'b-light', footColor:'#0F0F0F',
      },
      // 3. LA RÈGLE
      {label:'La règle', bg:'bg-ink',
        deco:`<div class="dc" style="width:100%;height:4px;background:#D4A017;top:0;left:0;"></div><div class="s-nbg" style="color:#D4A017;right:-2%;bottom:-5%;font-size:clamp(80px,30cqw,420px);opacity:0.08;">2</div>`,
        logoColor:'#F9F6EE', dotColor:'#D4A017',
        badge:`<div class="s-stamp" style="color:#D4A017;">⚡ La règle</div>`,
        eye:'En une phrase', eyeColor:'#0EA5A4',
        headline:'Moins de 2 minutes ? <em>Maintenant.</em> Sans noter. Sans reporter.',
        headColor:'#F9F6EE', divColor:'#D4A017',
        body:`<div class="s-box" style="background:rgba(212,160,23,0.1);border-left:3px solid #D4A017;margin-top:5%;"><p class="s-cite" style="color:#F9F6EE;">Si ta tâche te prend moins de 2 minutes — tu la fais immédiatement. Tout le reste va dans ton planning.</p></div>`,
        footBorder:'b-dark', footColor:'#F9F6EE',
      },
      // 4. APPLIQUÉ
      {label:'Appliqué', bg:'bg-mustardf',
        deco:`<div class="dc" style="width:100%;height:2px;background:#D4A017;top:0;left:0;"></div>`,
        logoColor:'#0F0F0F', dotColor:'#D4A017',
        badge:`<div class="s-stamp" style="color:#0EA5A4;background:#DDFAF8;border-color:#0EA5A4;">Pour tes études</div>`,
        eye:'4 exemples concrets', eyeColor:'#A37D0F',
        headline:'À partir de maintenant',
        headColor:'#0F0F0F', divColor:'#D4A017',
        body:`<div class="s-list">
          <div class="s-li" style="color:#0F0F0F;"><span class="s-arr" style="color:#D4A017;">⚡</span><span>Une définition floue → <strong>cherche-la maintenant</strong></span></div>
          <div class="s-li" style="color:#0F0F0F;"><span class="s-arr" style="color:#D4A017;">⚡</span><span>Un mail du prof → <strong>réponds maintenant</strong></span></div>
          <div class="s-li" style="color:#0F0F0F;"><span class="s-arr" style="color:#D4A017;">⚡</span><span>Une faute dans ta fiche → <strong>corrige maintenant</strong></span></div>
          <div class="s-li" style="color:#0F0F0F;"><span class="s-arr" style="color:#0EA5A4;">⚡</span><span>Tout le reste → <strong>dans ton planning</strong></span></div>
        </div>`,
        footBorder:'b-light', footColor:'#0F0F0F',
      },
      // 5. CONSEIL
      {label:'Conseil', bg:'bg-paper',
        deco:`<div class="dc" style="width:5px;height:55%;background:linear-gradient(180deg,#0EA5A4,transparent);left:0;top:22%;"></div>`,
        padLeft:true,
        logoColor:'#0F0F0F', dotColor:'#D4A017',
        badge:`<div class="s-stamp" style="color:#0EA5A4;background:#DDFAF8;border-color:#0EA5A4;">Pourquoi ça marche</div>`,
        eye:'La vraie raison', eyeColor:'#0EA5A4',
        headline:'Chaque tâche en attente est une <em>fenêtre ouverte</em> dans ton cerveau.',
        headColor:'#0F0F0F', divColor:'#0EA5A4',
        body:`<div class="s-body" style="color:#0F0F0F;">Ce qui reste dans ta tête prend de la place. La règle des 2 minutes <strong>ferme ces fenêtres</strong> — et libère de l'espace pour ce qui compte vraiment.</div>`,
        footBorder:'b-light', footColor:'#0F0F0F',
      },
      // 6. CTA
      {label:'CTA', bg:'bg-mustard',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,rgba(15,15,15,0.4),rgba(14,165,164,0.6),rgba(15,15,15,0.4));top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(15,15,15,0.08),transparent 70%);top:-15%;left:-10%;"></div>`,
        logoColor:'#0F0F0F', dotColor:'#0EA5A4',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="cta-icon">⚡</div>
          <div class="cta-h" style="color:#0F0F0F;">Une tâche de moins de 2 minutes en tête là ?</div>
          <div class="s-div" style="background:#0F0F0F;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:#0F0F0F;opacity:0.85;text-align:center;">Sauvegarde et fais-la <strong>maintenant</strong> 👇</div>
          <div class="cta-pill" style="color:#0F0F0F;">💾 Sauvegarde</div>
        </div>`,
        footBorder:'b-light', footColor:'#0F0F0F',
      },
    ],
    description: `Tu notes tout pour "plus tard" et tu finis la journée épuisé(e) sans avoir vraiment avancé.

Cette règle simple change la donne — et tu peux l'appliquer dans les 10 prochaines minutes. 💡

⚡ Une tâche de moins de 2 minutes ? Maintenant. Sans la noter. Sans la reporter.

💾 Sauvegarde et applique dès aujourd'hui.`,
    hashtags: `#methodedetravail #productivite #etudiant #organisation #reussitefac #regledes2minutes #gestiondutemps #sbe`,
  },

  // ════════════════════════════════════════════════════════════════
  // 2. ÉLITE — étudiants 15+ de moyenne
  // Palette : vert sapin + crème + champagne + charbon
  // Ambiance : académique premium, Ivy League, élégance contenue
  {
    id: 'elite', concept: 'ÉLITE', tag: '15+',
    title: 'Ce que les étudiants à 15+ de moyenne font différemment',
    badge: 'Édition · Excellence',
    tagline: 'Carrousel unique · Habitudes qui distinguent',
    bodyBg: '#0E1F18',
    radius: 6,
    palette: {
      paper:'#F5EBDC', ink:'#1A1A1A',
      accent:'#E2C275', accentText:'#1A1A1A',
      green:'#1B4332', green2:'#0E2A1E', greenf:'#E8EFE8',
      champagne:'#E2C275', champagnef:'#FAF3E0',
      ash:'#8A8474',
    },
    bgClasses: `
.bg-paper{background:#F5EBDC;}
.bg-ink{background:#1A1A1A;}
.bg-green{background:#1B4332;}
.bg-green2{background:#0E2A1E;}
.bg-greenf{background:#E8EFE8;}
.bg-champagne{background:#E2C275;}
.bg-champagnef{background:#FAF3E0;}
.bg-grad-green{background:linear-gradient(160deg,#1B4332 0%,#0E2A1E 100%);}
`,
    slides: [
      // 1. HOOK
      {label:'Hook', bg:'bg-grad-green',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#E2C275,rgba(245,235,220,0.4),transparent);top:0;left:0;"></div><div class="s-nbg" style="color:#F5EBDC;right:4%;bottom:6%;font-size:clamp(70px,26cqw,360px);">15+</div>`,
        logoColor:'#F5EBDC', dotColor:'#E2C275',
        badge:`<div class="s-stamp" style="color:#E2C275;">Édition · Excellence</div>`,
        eye:'La vérité que peu admettent', eyeColor:'#E2C275',
        headline:'Ils ne sont <em>pas plus intelligents</em>.',
        headColor:'#F5EBDC', divColor:'#E2C275',
        body:`<div class="s-body" style="color:rgba(245,235,220,0.85);">Ils ont juste compris quelque chose que les autres n'ont pas vu. <strong style="color:#E2C275;">Voici quoi.</strong> 👇</div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
      // 2. ANNALES SEMAINE 1
      {label:'Habitude n°1', bg:'bg-paper',
        deco:`<div class="dc" style="width:6px;height:65%;background:linear-gradient(180deg,#1B4332,transparent);left:0;top:18%;"></div>`,
        padLeft:true,
        logoColor:'#1B4332', dotColor:'#E2C275',
        badge:`<div class="s-stamp" style="color:#1B4332;background:#E8EFE8;border-color:#1B4332;">Habitude n°01</div>`,
        eye:'Sans attendre', eyeColor:'#1B4332',
        headline:'Ils lisent <em>les annales</em> dès la semaine 1.',
        headColor:'#1B4332', divColor:'#1B4332',
        body:`<div class="s-body" style="color:#1A1A1A;">Avant même d'avoir fini le premier cours, ils regardent les sujets d'examen des années précédentes. Pas pour tricher — pour savoir exactement ce qui est demandé et <strong>orienter leur attention dès le départ.</strong></div>`,
        footBorder:'b-light', footColor:'#1B4332',
      },
      // 3. QUESTIONS MOCHES
      {label:'Habitude n°2', bg:'bg-greenf',
        deco:`<div class="dc" style="width:100%;height:2px;background:#1B4332;top:0;left:0;"></div>`,
        logoColor:'#1B4332', dotColor:'#E2C275',
        badge:`<div class="s-stamp" style="color:#1B4332;background:#F5EBDC;border-color:#1B4332;">Habitude n°02</div>`,
        eye:'Sans peur du regard', eyeColor:'#1B4332',
        headline:'Ils posent <em>des questions moches</em>.',
        headColor:'#1B4332', divColor:'#1B4332',
        body:`<div class="s-body" style="color:#1A1A1A;">Ils lèvent la main même pour les questions "basiques". Ils restent après le cours. Ils envoient des mails. <strong>Ils ne font pas semblant de comprendre</strong> pour paraître bons — ils cherchent à l'être vraiment.</div>`,
        footBorder:'b-light', footColor:'#1B4332',
      },
      // 4. PETITS BLOCS
      {label:'Habitude n°3', bg:'bg-green',
        deco:`<div class="dc" style="width:100%;height:2px;background:#E2C275;top:0;left:0;"></div>`,
        logoColor:'#F5EBDC', dotColor:'#E2C275',
        badge:`<div class="s-stamp" style="color:#E2C275;border-color:#E2C275;">Habitude n°03</div>`,
        eye:'La constance discrète', eyeColor:'#E2C275',
        headline:'Pas de marathon. <em>45 minutes par jour.</em>',
        headColor:'#F5EBDC', divColor:'#E2C275',
        body:`<div class="s-body" style="color:rgba(245,235,220,0.85);">Pas de nuit blanche avant les partiels. Pas de week-end-massacre. 45 minutes par jour, tous les jours, sur chaque matière importante. <strong style="color:#E2C275;">La régularité construit ce que l'intensité ne peut pas créer.</strong></div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
      // 5. REFORMULER
      {label:'Habitude n°4', bg:'bg-champagnef',
        deco:`<div class="dc" style="width:6px;height:55%;background:linear-gradient(180deg,#E2C275,transparent);left:0;top:22%;"></div>`,
        padLeft:true,
        logoColor:'#1B4332', dotColor:'#E2C275',
        badge:`<div class="s-stamp" style="color:#1B4332;background:#FAF3E0;border-color:#E2C275;">Habitude n°04</div>`,
        eye:'La vraie compréhension', eyeColor:'#1B4332',
        headline:'Ils <em>reformulent</em> au lieu de recopier.',
        headColor:'#1B4332', divColor:'#E2C275',
        body:`<div class="s-box" style="background:rgba(27,67,50,0.06);border-left:3px solid #1B4332;"><p class="s-cite" style="color:#1A1A1A;">Ils réécrivent leur cours avec leurs propres mots. Ils l'expliquent à voix haute, seuls dans leur chambre. Cette habitude seule transforme la compréhension en maîtrise.</p></div>`,
        footBorder:'b-light', footColor:'#1B4332',
      },
      // 6. CTA
      {label:'CTA', bg:'bg-grad-green',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,rgba(245,235,220,0.3),#E2C275,rgba(245,235,220,0.3));top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(226,194,117,0.12),transparent 70%);top:-15%;left:-10%;"></div>`,
        logoColor:'#F5EBDC', dotColor:'#E2C275',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="cta-icon">🎯</div>
          <div class="cta-h" style="color:#F5EBDC;">Laquelle tu adoptes <em>cette semaine</em> ?</div>
          <div class="s-div" style="background:#E2C275;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:rgba(245,235,220,0.85);text-align:center;">Une seule habitude suffit pour commencer. Dis-moi en commentaire 👇</div>
          <div class="cta-pill" style="color:#E2C275;border-color:#E2C275;">💾 Sauvegarde</div>
        </div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
    ],
    description: `Ils n'ont pas un QI différent. Ils n'ont pas plus de temps.

Voici les 4 habitudes concrètes des étudiants à 15+ de moyenne — et que tu peux copier dès maintenant. 🎯

Annales en semaine 1. Questions moches assumées. Petits blocs quotidiens. Reformulation systématique.

Une seule de ces habitudes change déjà la donne.`,
    hashtags: `#reussitefac #habitudesetudiant #methodedetravail #partiels #licenceeco #excellence #sbe #moyenneuniversitaire`,
  },

  // ════════════════════════════════════════════════════════════════
  // 3. MENTAL — Procrastination
  // Palette : sage + rose poudré + indigo profond + ivoire
  // Ambiance : doux, sciences humaines, bienveillant
  {
    id: 'mental', concept: 'MENTAL', tag: 'Ψ',
    title: 'Pourquoi tu procrastines (et ce n\'est pas de la paresse)',
    badge: 'Mental · Neurosciences',
    tagline: 'Carrousel unique · Comprendre pour agir',
    bodyBg: '#1E2540',
    radius: 12,
    palette: {
      paper:'#FAF6F0', ink:'#2E3A5C', ink2:'#1E2540',
      accent:'#A8C4A2', accentText:'#1E2540',
      sage:'#A8C4A2', sagef:'#EBF1E9',
      rose:'#E4BBB1', rosef:'#FBEFEB',
      indigo:'#2E3A5C',
      ash:'#8A92AB',
    },
    bgClasses: `
.bg-paper{background:#FAF6F0;}
.bg-indigo{background:#2E3A5C;}
.bg-indigo2{background:#1E2540;}
.bg-sage{background:#A8C4A2;}
.bg-sagef{background:#EBF1E9;}
.bg-rosef{background:#FBEFEB;}
.bg-rose{background:#E4BBB1;}
.bg-grad-indigo{background:linear-gradient(165deg,#2E3A5C 0%,#1E2540 100%);}
.bg-grad-sage{background:linear-gradient(165deg,#EBF1E9 0%,#A8C4A2 100%);}
`,
    slides: [
      // 1. HOOK
      {label:'Hook', bg:'bg-grad-indigo',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#A8C4A2,#E4BBB1,transparent);top:0;left:0;"></div><div class="dc" style="width:65%;height:65%;background:radial-gradient(circle,rgba(168,196,162,0.15),transparent 70%);top:-15%;right:-15%;border-radius:50%;"></div><div class="s-nbg" style="color:#FAF6F0;right:5%;bottom:8%;">Ψ</div>`,
        logoColor:'#FAF6F0', dotColor:'#A8C4A2',
        badge:`<div class="s-stamp" style="color:#A8C4A2;">Ψ Mental · Neurosciences</div>`,
        eye:'Avant de te juger', eyeColor:'#E4BBB1',
        headline:'Tu procrastines. <em>Et si</em> ce n\'était pas de la paresse ?',
        headColor:'#FAF6F0', divColor:'#A8C4A2',
        body:`<div class="s-body" style="color:rgba(250,246,240,0.82);">Mais ton cerveau qui te <strong style="color:#A8C4A2;">protège d'une menace mal identifiée</strong>. 👇</div>`,
        footBorder:'b-dark', footColor:'#FAF6F0',
      },
      // 2. CE QUE LA SCIENCE DIT
      {label:'Science', bg:'bg-paper',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#2E3A5C,#A8C4A2,transparent);top:0;left:0;"></div>`,
        logoColor:'#2E3A5C', dotColor:'#A8C4A2',
        badge:`<div class="s-stamp" style="color:#2E3A5C;background:#EBF1E9;border-color:#A8C4A2;">Ce que dit la science</div>`,
        eye:'La vraie nature', eyeColor:'#2E3A5C',
        headline:'La procrastination n\'est pas un problème de <em>temps</em>.',
        headColor:'#2E3A5C', divColor:'#A8C4A2',
        body:`<div class="s-body" style="color:#2E3A5C;">C'est une <strong>réponse émotionnelle</strong>. Ton cerveau associe cette tâche à une émotion négative — ennui, peur de l'échec, incompétence ressentie — et il <em>fuit pour se protéger</em>.</div>`,
        footBorder:'b-light', footColor:'#2E3A5C',
      },
      // 3. LES 3 DÉCLENCHEURS
      {label:'3 déclencheurs', bg:'bg-sagef',
        deco:`<div class="dc" style="width:100%;height:2px;background:#2E3A5C;top:0;left:0;"></div>`,
        logoColor:'#2E3A5C', dotColor:'#A8C4A2',
        badge:`<div class="s-stamp" style="color:#2E3A5C;background:#FAF6F0;border-color:#2E3A5C;">3 déclencheurs</div>`,
        eye:'Identifie le tien', eyeColor:'#2E3A5C',
        headline:'Quand le cerveau fuit',
        headColor:'#2E3A5C', divColor:'#2E3A5C',
        body:`<div class="s-list">
          <div class="s-li" style="color:#2E3A5C;"><span class="s-num" style="color:#2E3A5C;">1</span><span><strong>Tâche floue</strong> — tu ne sais pas par où commencer</span></div>
          <div class="s-li" style="color:#2E3A5C;"><span class="s-num" style="color:#2E3A5C;">2</span><span><strong>Tâche trop grande</strong> — tu vois l'ensemble et tu te sens dépassé(e)</span></div>
          <div class="s-li" style="color:#2E3A5C;"><span class="s-num" style="color:#E4BBB1;">3</span><span><strong>Tâche à fort enjeu</strong> — tu as peur de mal faire</span></div>
        </div>`,
        footBorder:'b-light', footColor:'#2E3A5C',
      },
      // 4. SOLUTION
      {label:'Solution', bg:'bg-rosef',
        deco:`<div class="dc" style="width:6px;height:60%;background:linear-gradient(180deg,#E4BBB1,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#2E3A5C', dotColor:'#E4BBB1',
        badge:`<div class="s-stamp" style="color:#2E3A5C;background:#FBEFEB;border-color:#E4BBB1;">La solution concrète</div>`,
        eye:'Désamorcer la peur', eyeColor:'#2E3A5C',
        headline:'Rends-la <em>petite</em>. Rends-la <em>concrète</em>.',
        headColor:'#2E3A5C', divColor:'#E4BBB1',
        body:`<div class="s-body" style="color:#2E3A5C;">Pas <em>"réviser la macro"</em> mais <strong>"ouvrir mon cours et lire la première page"</strong>. Pas <em>"rédiger ma dissert"</em> mais <strong>"écrire une phrase d'introduction"</strong>. Le démarrage est le seul vrai problème.</div>`,
        footBorder:'b-light', footColor:'#2E3A5C',
      },
      // 5. CONSEIL
      {label:'Conseil', bg:'bg-grad-sage',
        deco:`<div class="dc" style="width:100%;height:2px;background:#2E3A5C;top:0;left:0;"></div>`,
        logoColor:'#2E3A5C', dotColor:'#2E3A5C',
        badge:`<div class="s-stamp" style="color:#2E3A5C;border-color:#2E3A5C;">La règle des 5 minutes</div>`,
        eye:'L\'astuce qui marche', eyeColor:'#2E3A5C',
        headline:'Dis-toi : <em>juste 5 minutes</em>.',
        headColor:'#2E3A5C', divColor:'#2E3A5C',
        body:`<div class="s-box" style="background:rgba(250,246,240,0.7);border-left:3px solid #2E3A5C;"><p class="s-cite" style="color:#2E3A5C;">5 minutes réelles, non négociables. Dans 80% des cas, tu continues. Parce que commencer était le seul vrai obstacle.</p></div>`,
        footBorder:'b-light', footColor:'#2E3A5C',
      },
      // 6. CTA
      {label:'CTA', bg:'bg-indigo',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,rgba(250,246,240,0.3),#A8C4A2,rgba(250,246,240,0.3));top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(168,196,162,0.12),transparent 70%);top:-15%;left:-10%;"></div>`,
        logoColor:'#FAF6F0', dotColor:'#A8C4A2',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="cta-icon">🧠</div>
          <div class="cta-h" style="color:#FAF6F0;">Sur quelle tâche tu procrastines <em>là</em> ?</div>
          <div class="s-div" style="background:#A8C4A2;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:rgba(250,246,240,0.85);text-align:center;">Dis-le en commentaire 👇</div>
          <div class="cta-pill" style="color:#A8C4A2;border-color:#A8C4A2;">💾 Sauvegarde</div>
        </div>`,
        footBorder:'b-dark', footColor:'#FAF6F0',
      },
    ],
    description: `La procrastination n'est pas de la paresse.

C'est une réponse émotionnelle que ton cerveau crée pour te protéger d'une menace qu'il a mal identifiée.

Comprendre ça change tout. 🧠

Voici les 3 déclencheurs + la règle des 5 minutes pour les désamorcer.`,
    hashtags: `#procrastination #etudiant #methodedetravail #psychologie #reussitefac #neurosciences #santementale #sbe`,
  },

  // ════════════════════════════════════════════════════════════════
  // 4. NUIT — Sommeil avant exam
  // Palette : indigo nocturne + lavande + crème lunaire + or pâle
  // Ambiance : cosmique, nuit étoilée, sciences douces
  {
    id: 'nuit', concept: 'NUIT', tag: '☾',
    title: 'Le vrai coût d\'une mauvaise nuit avant un partiel',
    badge: 'Nuit · Sommeil',
    tagline: 'Carrousel unique · Sommeil & performance',
    bodyBg: '#0B1133',
    radius: 8,
    palette: {
      paper:'#F4F0E8', ink:'#1A1F3A', ink2:'#0B1133',
      accent:'#D4B564', accentText:'#1A1F3A',
      lavender:'#9B8DC4', lavenderf:'#E8E4F2',
      gold:'#D4B564',
      ash:'#7F84A5',
    },
    bgClasses: `
.bg-paper{background:#F4F0E8;}
.bg-night{background:#1A1F3A;}
.bg-night2{background:#0B1133;}
.bg-lavender{background:#9B8DC4;}
.bg-lavenderf{background:#E8E4F2;}
.bg-gold{background:#D4B564;}
.bg-grad-night{background:radial-gradient(ellipse at 30% 20%,rgba(155,141,196,0.15),transparent 60%),linear-gradient(160deg,#1A1F3A 0%,#0B1133 100%);}
.bg-grad-lavender{background:linear-gradient(160deg,#E8E4F2 0%,#9B8DC4 100%);}
`,
    slides: [
      // 1. HOOK
      {label:'Hook', bg:'bg-grad-night',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#D4B564,#9B8DC4,transparent);top:0;left:0;"></div><div class="dc" style="width:8px;height:8px;background:#F4F0E8;border-radius:50%;top:15%;right:18%;box-shadow:0 0 12px #F4F0E8;"></div><div class="dc" style="width:4px;height:4px;background:#D4B564;border-radius:50%;top:30%;right:35%;box-shadow:0 0 8px #D4B564;"></div><div class="dc" style="width:3px;height:3px;background:#F4F0E8;border-radius:50%;top:22%;right:55%;"></div><div class="s-nbg" style="color:#F4F0E8;right:4%;bottom:4%;font-size:clamp(80px,28cqw,380px);">☾</div>`,
        logoColor:'#F4F0E8', dotColor:'#D4B564',
        badge:`<div class="s-stamp" style="color:#D4B564;">☾ Nuit · Sommeil</div>`,
        eye:'L\'erreur que tu paies cher', eyeColor:'#9B8DC4',
        headline:'Tu sacrifies ton sommeil pour réviser plus ?',
        headColor:'#F4F0E8', divColor:'#D4B564',
        body:`<div class="s-body" style="color:rgba(244,240,232,0.82);">Tu viens de perdre <strong style="color:#D4B564;">40% de tes capacités cognitives</strong> pour l'exam de demain. 👇</div>`,
        footBorder:'b-dark', footColor:'#F4F0E8',
      },
      // 2. CE QUI SE PASSE
      {label:'Le mécanisme', bg:'bg-paper',
        deco:`<div class="dc" style="width:6px;height:60%;background:linear-gradient(180deg,#9B8DC4,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#1A1F3A', dotColor:'#9B8DC4',
        badge:`<div class="s-stamp" style="color:#1A1F3A;background:#E8E4F2;border-color:#9B8DC4;">Dans ton cerveau</div>`,
        eye:'Pendant que tu dors', eyeColor:'#9B8DC4',
        headline:'Le sommeil <em>consolide</em> ce que tu as appris.',
        headColor:'#1A1F3A', divColor:'#9B8DC4',
        body:`<div class="s-body" style="color:#1A1F3A;">Ton cerveau transfère les informations de la mémoire à court terme vers la mémoire à long terme. <strong>Sans cette consolidation</strong>, tout ce que tu as appris la veille reste fragile — et disparaît sous stress.</div>`,
        footBorder:'b-light', footColor:'#1A1F3A',
      },
      // 3. LES CHIFFRES
      {label:'Les chiffres', bg:'bg-night',
        deco:`<div class="dc" style="width:100%;height:2px;background:#D4B564;top:0;left:0;"></div><div class="dc" style="width:5px;height:5px;background:#D4B564;border-radius:50%;top:18%;right:10%;"></div>`,
        logoColor:'#F4F0E8', dotColor:'#D4B564',
        badge:`<div class="s-stamp" style="color:#D4B564;border-color:#D4B564;">Les chiffres bruts</div>`,
        eye:'Moins de 6h de sommeil', eyeColor:'#9B8DC4',
        headline:'Ce que ça coûte vraiment',
        headColor:'#F4F0E8', divColor:'#D4B564',
        body:`<div class="s-list">
          <div class="s-li" style="color:#F4F0E8;"><span class="s-arr" style="color:#D4B564;">-40%</span><span>de mémoire de travail</span></div>
          <div class="s-li" style="color:#F4F0E8;"><span class="s-arr" style="color:#D4B564;">-30%</span><span>de raisonnement logique</span></div>
          <div class="s-li" style="color:#F4F0E8;"><span class="s-arr" style="color:#9B8DC4;">÷2</span><span>l'attention</span></div>
        </div>
        <div class="s-body" style="color:rgba(244,240,232,0.8);margin-top:5%;">Tu connais ton cours <em>parfaitement</em> ? Épuisé(e), ton cerveau n'y accède pas.</div>`,
        footBorder:'b-dark', footColor:'#F4F0E8',
      },
      // 4. STRATÉGIE
      {label:'Stratégie', bg:'bg-lavenderf',
        deco:`<div class="dc" style="width:100%;height:2px;background:#9B8DC4;top:0;left:0;"></div>`,
        logoColor:'#1A1F3A', dotColor:'#9B8DC4',
        badge:`<div class="s-stamp" style="color:#1A1F3A;background:#F4F0E8;border-color:#9B8DC4;">Ce que font les meilleurs</div>`,
        eye:'La vraie stratégie', eyeColor:'#1A1F3A',
        headline:'<em>7 à 8h</em> — même la veille des partiels.',
        headColor:'#1A1F3A', divColor:'#9B8DC4',
        body:`<div class="s-body" style="color:#1A1F3A;">Pas parce qu'ils sont zen — parce qu'ils savent que <strong>le sommeil est leur dernière session de révision</strong>. Le cerveau travaille pendant que tu dors.</div>`,
        footBorder:'b-light', footColor:'#1A1F3A',
      },
      // 5. CONSEIL
      {label:'Conseil', bg:'bg-grad-night',
        deco:`<div class="dc" style="width:6px;height:55%;background:linear-gradient(180deg,#D4B564,transparent);left:0;top:22%;"></div>`,
        padLeft:true,
        logoColor:'#F4F0E8', dotColor:'#D4B564',
        badge:`<div class="s-stamp" style="color:#D4B564;border-color:#D4B564;">Conseil SBE</div>`,
        eye:'Si tu dois choisir', eyeColor:'#9B8DC4',
        headline:'Entre 2h de révision <em>ou dormir</em> — dors.',
        headColor:'#F4F0E8', divColor:'#D4B564',
        body:`<div class="s-box" style="background:rgba(244,240,232,0.08);border-left:3px solid #D4B564;"><p class="s-cite" style="color:#F4F0E8;">2h de révision épuisé(e) valent moins qu'1h reposé(e) le lendemain matin. Sérieusement.</p></div>`,
        footBorder:'b-dark', footColor:'#F4F0E8',
      },
      // 6. CTA
      {label:'CTA', bg:'bg-night2',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,rgba(244,240,232,0.3),#D4B564,rgba(244,240,232,0.3));top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(212,181,100,0.12),transparent 70%);top:-15%;left:-10%;"></div><div class="dc" style="width:6px;height:6px;background:#F4F0E8;border-radius:50%;top:15%;left:20%;box-shadow:0 0 10px #F4F0E8;"></div>`,
        logoColor:'#F4F0E8', dotColor:'#D4B564',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="cta-icon">😴</div>
          <div class="cta-h" style="color:#F4F0E8;">Combien d'heures tu dors avant un partiel ?</div>
          <div class="s-div" style="background:#D4B564;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:rgba(244,240,232,0.85);text-align:center;">Envoie ça à quelqu'un qui révise encore à 2h du matin 💾</div>
          <div class="cta-pill" style="color:#D4B564;border-color:#D4B564;">💾 Partage</div>
        </div>`,
        footBorder:'b-dark', footColor:'#F4F0E8',
      },
    ],
    description: `Tu sacrifies ton sommeil pour réviser plus.

Voici pourquoi c'est exactement l'inverse de ce que tu devrais faire — et ce que disent les neurosciences là-dessus. 😴

-40% de mémoire de travail. -30% de raisonnement. ÷2 l'attention.

Le sommeil est ta dernière session de révision.`,
    hashtags: `#sommeil #partiels #neurosciences #etudiant #reussitefac #methodedetravail #santeetudiante #sbe`,
  },

  // ════════════════════════════════════════════════════════════════
  // 5. VOIX — Prise de parole en amphi
  // Palette : bordeaux + crème + or doux + charbon
  // Ambiance : théâtral, courage, voix qui porte
  {
    id: 'voix', concept: 'VOIX', tag: '🎤',
    title: 'Ce que personne ne t\'apprend sur la prise de parole en amphi',
    badge: 'Voix · Courage',
    tagline: 'Carrousel unique · Lever la main',
    bodyBg: '#2A0F18',
    radius: 6,
    palette: {
      paper:'#F4EDE3', ink:'#15110D', ink2:'#0D0907',
      accent:'#B69B5E', accentText:'#15110D',
      bordeaux:'#7A2333', bordeaux2:'#5A1726', bordeauxf:'#F0DCE0',
      gold:'#B69B5E', goldf:'#F5EBD1',
      ash:'#8A7770',
    },
    bgClasses: `
.bg-paper{background:#F4EDE3;}
.bg-ink{background:#15110D;}
.bg-ink2{background:#0D0907;}
.bg-bordeaux{background:#7A2333;}
.bg-bordeaux2{background:#5A1726;}
.bg-bordeauxf{background:#F0DCE0;}
.bg-gold{background:#B69B5E;}
.bg-goldf{background:#F5EBD1;}
.bg-grad-bordeaux{background:linear-gradient(160deg,#7A2333 0%,#3D0F1A 100%);}
.bg-grad-ink{background:linear-gradient(160deg,#15110D 0%,#0D0907 100%);}
`,
    slides: [
      // 1. HOOK
      {label:'Hook', bg:'bg-grad-bordeaux',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,#B69B5E,#F4EDE3,#B69B5E,transparent);top:0;left:0;"></div><div class="dc" style="width:60%;height:60%;background:radial-gradient(circle,rgba(182,155,94,0.18),transparent 70%);top:-12%;right:-15%;border-radius:50%;"></div><div class="s-nbg" style="color:#F4EDE3;right:5%;bottom:8%;font-size:clamp(80px,28cqw,380px);">🎤</div>`,
        logoColor:'#F4EDE3', dotColor:'#B69B5E',
        badge:`<div class="s-stamp" style="color:#B69B5E;">🎤 Voix · Courage</div>`,
        eye:'Ce silence qui coûte cher', eyeColor:'#B69B5E',
        headline:'Tu n\'oses <em>jamais</em> poser de question en amphi ?',
        headColor:'#F4EDE3', divColor:'#B69B5E',
        body:`<div class="s-body" style="color:rgba(244,237,227,0.85);">Et ça te coûte <strong style="color:#B69B5E;">bien plus qu'une réponse manquée.</strong> 👇</div>`,
        footBorder:'b-dark', footColor:'#F4EDE3',
      },
      // 2. CE QUE TU RATES
      {label:'Ce que tu rates', bg:'bg-paper',
        deco:`<div class="dc" style="width:6px;height:60%;background:linear-gradient(180deg,#7A2333,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#15110D', dotColor:'#7A2333',
        badge:`<div class="s-stamp" style="color:#7A2333;background:#F0DCE0;border-color:#7A2333;">Ce que tu rates</div>`,
        eye:'Chaque question = un ancrage', eyeColor:'#7A2333',
        headline:'Poser une question ancre une notion <em>3× plus vite</em>.',
        headColor:'#15110D', divColor:'#7A2333',
        body:`<div class="s-body" style="color:#15110D;">Quand tu formules une question, tu forces ton cerveau à identifier ce qu'il ne comprend pas. <strong>Ce seul acte déclenche une compréhension active</strong> que la passivité ne peut pas produire.</div>`,
        footBorder:'b-light', footColor:'#15110D',
      },
      // 3. POURQUOI TU N'OSES PAS
      {label:'Pourquoi', bg:'bg-bordeaux',
        deco:`<div class="dc" style="width:100%;height:2px;background:#B69B5E;top:0;left:0;"></div>`,
        logoColor:'#F4EDE3', dotColor:'#B69B5E',
        badge:`<div class="s-stamp" style="color:#B69B5E;border-color:#B69B5E;">Pourquoi tu te tais</div>`,
        eye:'Peur du regard', eyeColor:'#B69B5E',
        headline:'Tu redoutes 3 choses qui n\'arrivent <em>jamais</em>.',
        headColor:'#F4EDE3', divColor:'#B69B5E',
        body:`<div class="s-list">
          <div class="s-li" style="color:#F4EDE3;"><span class="s-arr" style="color:#B69B5E;">×</span><span>"On va me prendre pour quelqu'un qui n'a pas suivi"</span></div>
          <div class="s-li" style="color:#F4EDE3;"><span class="s-arr" style="color:#B69B5E;">×</span><span>"Ma question est sûrement bête"</span></div>
          <div class="s-li" style="color:#F4EDE3;"><span class="s-arr" style="color:#B69B5E;">×</span><span>"Tout le monde va me regarder"</span></div>
        </div>
        <div class="s-body" style="color:rgba(244,237,227,0.82);margin-top:5%;">Dans 200 personnes, <strong style="color:#B69B5E;">150 ont la même question</strong> — et ne la posent pas non plus.</div>`,
        footBorder:'b-dark', footColor:'#F4EDE3',
      },
      // 4. CE QUE ÇA CHANGE
      {label:'Ce que ça change', bg:'bg-goldf',
        deco:`<div class="dc" style="width:100%;height:2px;background:#B69B5E;top:0;left:0;"></div>`,
        logoColor:'#15110D', dotColor:'#B69B5E',
        badge:`<div class="s-stamp" style="color:#7A2333;background:#F0DCE0;border-color:#7A2333;">L'impact réel</div>`,
        eye:'Les chiffres', eyeColor:'#7A2333',
        headline:'Ceux qui posent des questions obtiennent <em>de meilleures notes</em>.',
        headColor:'#15110D', divColor:'#B69B5E',
        body:`<div class="s-body" style="color:#15110D;">Pas parce que les profs les favorisent — <strong>parce qu'ils comprennent mieux, retiennent mieux, et osent revenir demander</strong> ce qu'ils n'ont pas compris.</div>`,
        footBorder:'b-light', footColor:'#15110D',
      },
      // 5. CONSEIL
      {label:'Conseil', bg:'bg-bordeauxf',
        deco:`<div class="dc" style="width:6px;height:55%;background:linear-gradient(180deg,#B69B5E,transparent);left:0;top:22%;"></div>`,
        padLeft:true,
        logoColor:'#15110D', dotColor:'#7A2333',
        badge:`<div class="s-stamp" style="color:#7A2333;background:#F4EDE3;border-color:#7A2333;">La règle SBE</div>`,
        eye:'Pour briser le silence', eyeColor:'#7A2333',
        headline:'<em>Une question par semaine.</em>',
        headColor:'#15110D', divColor:'#B69B5E',
        body:`<div class="s-box" style="background:rgba(244,237,227,0.7);border-left:3px solid #7A2333;"><p class="s-cite" style="color:#15110D;">Une seule. Elle peut être basique. Elle peut sembler évidente. Pose-la quand même. L'inconfort se dissipe dès la deuxième fois.</p></div>`,
        footBorder:'b-light', footColor:'#15110D',
      },
      // 6. CTA
      {label:'CTA', bg:'bg-grad-ink',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,#7A2333,#B69B5E,#7A2333);top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(182,155,94,0.15),transparent 70%);top:-15%;left:-10%;"></div>`,
        logoColor:'#F4EDE3', dotColor:'#B69B5E',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="cta-icon">🎤</div>
          <div class="cta-h" style="color:#F4EDE3;">Au prochain cours — <em>une seule</em>.</div>
          <div class="s-div" style="background:#B69B5E;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:rgba(244,237,227,0.85);text-align:center;">Tu poses des questions ou tu gardes pour toi ? 👇</div>
          <div class="cta-pill" style="color:#B69B5E;border-color:#B69B5E;">💾 Sauvegarde</div>
        </div>`,
        footBorder:'b-dark', footColor:'#F4EDE3',
      },
    ],
    description: `Ne jamais oser poser de question en cours — c'est une habitude qui coûte cher.

Chaque question = une notion ancrée 3× plus vite. Chaque question évitée = un trou de compréhension qui reste.

Voici pourquoi tu te tais et comment briser ce réflexe dès cette semaine. 🎤

Une seule question. C'est tout.`,
    hashtags: `#amphi #etudiant #prendrelaparole #licenceeco #reussitefac #confiance #methodedetravail #sbe`,
  },

  // ════════════════════════════════════════════════════════════════
  // 6. FONDATRICE — Le parcours d'Enya derrière SBE
  // Palette : navy profond + bleu clair + écru + blanc
  // Ambiance : storytelling éditorial, intime, premier-rôle
  {
    id: 'fondatrice', concept: 'FONDATRICE', tag: 'Story',
    title: 'Mon parcours — pourquoi SBE est né',
    badge: 'Fondatrice · Story',
    tagline: 'Carrousel unique · Le parcours derrière SBE',
    bodyBg: '#0A1428',
    radius: 6,
    palette: {
      paper:'#F5EBDC', ink:'#1B2A4A', ink2:'#0A1428',
      accent:'#5B8DEF', accentText:'#FFFFFF',
      navy:'#1B2A4A', navy2:'#0A1428',
      sky:'#BDD3F5', sky2:'#5B8DEF', skyf:'#EEF4FF',
      ecru:'#F5EBDC', ecru2:'#EDE3CF', ecruf:'#FBF6EE',
      white:'#FFFFFF',
      gold:'#C9A84C',
      ash:'#8A92AB',
    },
    bgClasses: `
.bg-paper{background:#F5EBDC;}
.bg-ecru{background:#F5EBDC;}
.bg-ecruf{background:#FBF6EE;}
.bg-ecru2{background:#EDE3CF;}
.bg-white{background:#FFFFFF;}
.bg-navy{background:#1B2A4A;}
.bg-navy2{background:#0A1428;}
.bg-sky{background:#BDD3F5;}
.bg-skyf{background:#EEF4FF;}
.bg-grad-navy{background:linear-gradient(160deg,#1B2A4A 0%,#0A1428 100%);}
.bg-grad-sky{background:linear-gradient(160deg,#EEF4FF 0%,#BDD3F5 100%);}
.bg-grad-ecru{background:linear-gradient(160deg,#FBF6EE 0%,#F5EBDC 100%);}
`,
    slides: [
      // 1. HOOK — Pose le personnage
      {label:'Hook', bg:'bg-grad-navy',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#C9A84C,#5B8DEF,transparent);top:0;left:0;"></div><div class="dc" style="width:60%;height:60%;background:radial-gradient(circle,rgba(91,141,239,0.18),transparent 70%);top:-12%;right:-15%;border-radius:50%;"></div><div class="dc" style="position:absolute;font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:clamp(80px,28cqw,400px);color:#F5EBDC;opacity:0.05;line-height:0.85;right:5%;bottom:6%;">"</div>`,
        logoColor:'#F5EBDC', dotColor:'#C9A84C',
        badge:`<div class="s-stamp" style="color:#C9A84C;">Fondatrice · Story</div>`,
        eye:'Le parcours derrière SBE', eyeColor:'#5B8DEF',
        headline:'Première de classe. <em>Mais pas pour les raisons qu\'on imagine.</em>',
        headColor:'#F5EBDC', divColor:'#C9A84C',
        body:`<div class="s-body" style="color:rgba(245,235,220,0.82);">Depuis l'enfance, j'ai compris une chose : <strong style="color:#5B8DEF;">la façon dont on travaille</strong> compte infiniment plus que le temps qu'on y passe. 👇</div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
      // 2. LE SYSTÈME — depuis l'enfance
      {label:'Origines', bg:'bg-ecruf',
        deco:`<div class="dc" style="width:6px;height:60%;background:linear-gradient(180deg,#1B2A4A,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#1B2A4A', dotColor:'#5B8DEF',
        badge:`<div class="s-stamp" style="color:#1B2A4A;background:#EEF4FF;border-color:#5B8DEF;">Chapitre 01 — Le système</div>`,
        eye:'Construit dès l\'enfance', eyeColor:'#1B2A4A',
        headline:'J\'avais <em>trop d\'activités à côté</em> pour me permettre de perdre du temps.',
        headColor:'#1B2A4A', divColor:'#5B8DEF',
        body:`<div class="s-body" style="color:#1B2A4A;">J'ai expérimenté. Testé. Ajusté. Et sans le formaliser encore, j'ai construit un <strong>système personnel</strong> qui me permettait de produire plus en travaillant moins longtemps.</div>`,
        footBorder:'b-light', footColor:'#1B2A4A',
      },
      // 3. 19 AU BAC + PRÉPA
      {label:'19 au bac', bg:'bg-white',
        deco:`<div class="dc" style="width:100%;height:2px;background:linear-gradient(90deg,#5B8DEF,#C9A84C,transparent);top:0;left:0;"></div><div class="dc" style="position:absolute;font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(120px,40cqw,560px);color:#1B2A4A;opacity:0.05;line-height:0.85;letter-spacing:-6px;right:-3%;bottom:-8%;">19</div>`,
        logoColor:'#1B2A4A', dotColor:'#5B8DEF',
        badge:`<div class="s-stamp" style="color:#1B2A4A;background:#EEF4FF;border-color:#5B8DEF;">Chapitre 02 — Juin 2024</div>`,
        eye:'La suite parfaite', eyeColor:'#5B8DEF',
        headline:'<em>19 de moyenne</em> au bac. Prépa PCSI dans la foulée.',
        headColor:'#1B2A4A', divColor:'#C9A84C',
        body:`<div class="s-body" style="color:#1B2A4A;">Sur le papier, la suite logique. Mes profs m'y encourageaient. Ma famille y voyait la <strong>confirmation de tout</strong> ce qu'on avait construit. Alors j'y suis allée.</div>`,
        footBorder:'b-light', footColor:'#1B2A4A',
      },
      // 4. LE PIVOT — décision de partir
      {label:'Le pivot', bg:'bg-grad-navy',
        deco:`<div class="dc" style="width:100%;height:2px;background:#5B8DEF;top:0;left:0;"></div>`,
        logoColor:'#F5EBDC', dotColor:'#C9A84C',
        badge:`<div class="s-stamp" style="color:#5B8DEF;border-color:#5B8DEF;">Chapitre 03 — Six mois plus tard</div>`,
        eye:'La décision la plus difficile', eyeColor:'#C9A84C',
        headline:'Je <em>pars</em>.',
        headColor:'#F5EBDC', divColor:'#C9A84C',
        body:`<div class="s-body" style="color:rgba(245,235,220,0.85);">Pas parce que je ne pouvais pas suivre — <strong>parce que ce n'était pas ma voie.</strong></div><div class="s-box" style="background:rgba(91,141,239,0.08);border-left:3px solid #5B8DEF;margin-top:5%;"><p class="s-cite" style="color:#F5EBDC;">Ma famille vit ça comme un échec. Pas de soutien. Juste le silence. Je porte la décision seule.</p></div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
      // 5. L'ÉPREUVE — L1 S2 direct, rattrapage seule
      {label:'L\'épreuve', bg:'bg-ecru',
        deco:`<div class="dc" style="width:6px;height:65%;background:linear-gradient(180deg,#C9A84C,#5B8DEF,transparent);left:0;top:18%;"></div>`,
        padLeft:true,
        logoColor:'#1B2A4A', dotColor:'#5B8DEF',
        badge:`<div class="s-stamp" style="color:#1B2A4A;background:#FBF6EE;border-color:#1B2A4A;">Chapitre 04 — Janvier 2025</div>`,
        eye:'Sans bases. Sans réseau. Sans soutien.', eyeColor:'#1B2A4A',
        headline:'L1 Éco-Gestion. <em>Inscrite au S2 direct.</em>',
        headColor:'#1B2A4A', divColor:'#5B8DEF',
        body:`<div class="s-body" style="color:#1B2A4A;">Rattraper seule tout un S1 que je n'ai jamais eu. Valider le S2 en cours. Préparer des rattrapages en parallèle. <strong>Sans famille pour m'encourager.</strong></div>`,
        footBorder:'b-light', footColor:'#1B2A4A',
      },
      // 6. LES DOUTES — vulnérabilité
      {label:'Les doutes', bg:'bg-navy2',
        deco:`<div class="dc" style="width:100%;height:2px;background:#C9A84C;top:0;left:0;"></div><div class="dc" style="position:absolute;font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:clamp(80px,30cqw,420px);color:#F5EBDC;opacity:0.04;line-height:0.85;left:5%;top:-5%;">?</div>`,
        logoColor:'#F5EBDC', dotColor:'#5B8DEF',
        badge:`<div class="s-stamp" style="color:#C9A84C;border-color:#C9A84C;">Chapitre 05 — La période la plus dure</div>`,
        eye:'Ce que personne ne voyait', eyeColor:'#5B8DEF',
        headline:'Il y a eu des soirs où j\'ai <em>voulu tout arrêter</em>.',
        headColor:'#F5EBDC', divColor:'#C9A84C',
        body:`<div class="s-body" style="color:rgba(245,235,220,0.85);">L'ampleur me semblait insurmontable. La prépa m'avait ébranlée dans ma confiance. Mais quelque chose en moi savait : <strong style="color:#5B8DEF;">je devais me prouver que j'étais debout.</strong></div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
      // 7. 1ÈRE SUR 500 — Triomphe
      {label:'1ère sur 500', bg:'bg-grad-sky',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,#1B2A4A,#C9A84C,transparent);top:0;left:0;"></div><div class="dc" style="position:absolute;font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(140px,46cqw,640px);color:#1B2A4A;opacity:0.07;line-height:0.85;letter-spacing:-8px;right:-4%;bottom:-12%;">500</div>`,
        logoColor:'#1B2A4A', dotColor:'#1B2A4A',
        badge:`<div class="s-stamp" style="color:#1B2A4A;background:rgba(255,255,255,0.6);border-color:#1B2A4A;">Chapitre 06 — Fin d'année L1</div>`,
        eye:'Le résultat est tombé', eyeColor:'#1B2A4A',
        headline:'<em>Première</em> de promo. <em>Sur 500.</em>',
        headColor:'#1B2A4A', divColor:'#1B2A4A',
        body:`<div class="s-body" style="color:#1B2A4A;">J'ai tout reconstruit. Mes méthodes. Mon organisation. Ma façon d'aborder une matière inconnue. <strong>Tout repensé depuis zéro</strong> — pour performer dans un contexte que je n'avais jamais expérimenté.</div>`,
        footBorder:'b-light', footColor:'#1B2A4A',
      },
      // 8. LE DÉCLIC — partage avec camarades
      {label:'Le déclic', bg:'bg-white',
        deco:`<div class="dc" style="width:6px;height:60%;background:linear-gradient(180deg,#5B8DEF,#C9A84C,transparent);left:0;top:20%;"></div>`,
        padLeft:true,
        logoColor:'#1B2A4A', dotColor:'#C9A84C',
        badge:`<div class="s-stamp" style="color:#1B2A4A;background:#EEF4FF;border-color:#5B8DEF;">Chapitre 07 — Les semaines suivantes</div>`,
        eye:'Ce que je n\'avais pas prévu', eyeColor:'#5B8DEF',
        headline:'Mes fiches changent <em>la trajectoire</em> d\'autres étudiants.',
        headColor:'#1B2A4A', divColor:'#5B8DEF',
        body:`<div class="s-body" style="color:#1B2A4A;">Quand j'ai commencé à partager, les retours m'ont bouleversée. Certains m'ont remerciée d'avoir <strong>validé leur année grâce à ma méthode</strong>. J'ai compris que ce que j'avais construit ne m'appartenait pas seulement.</div>`,
        footBorder:'b-light', footColor:'#1B2A4A',
      },
      // 9. SBE NAÎT + MISSION + CTA
      {label:'SBE naît', bg:'bg-grad-navy',
        deco:`<div class="dc" style="width:100%;height:3px;background:linear-gradient(90deg,#5B8DEF,#C9A84C,#5B8DEF);top:0;left:0;"></div><div class="dc" style="width:90%;height:55%;background:radial-gradient(ellipse,rgba(201,168,76,0.12),transparent 70%);top:-15%;left:-10%;"></div>`,
        logoColor:'#F5EBDC', dotColor:'#C9A84C',
        badge:'', eye:'', headline:'',
        body:`<div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div class="s-eye" style="color:#5B8DEF;text-align:center;">Septembre 2025 — j'ai 19 ans</div>
          <div class="cta-h" style="color:#F5EBDC;font-style:italic;">SBE est <em>né.</em></div>
          <div class="s-div" style="background:#C9A84C;margin:0 auto 5%;"></div>
          <div class="s-body" style="color:rgba(245,235,220,0.85);text-align:center;margin-bottom:5%;">Je construis ce que j'aurais aimé trouver quand j'en avais le plus besoin.</div>
          <div class="s-box" style="background:rgba(91,141,239,0.1);border-left:3px solid #C9A84C;border-right:3px solid #C9A84C;margin-top:3%;">
            <p class="s-cite" style="color:#F5EBDC;text-align:center;font-size:clamp(11px,2.6cqw,34px);">La réussite n'est pas une question de talent. C'est une question de méthode.</p>
          </div>
          <div class="cta-pill" style="color:#C9A84C;border-color:#C9A84C;margin-top:6%;">💾 Suis SBE</div>
        </div>`,
        footBorder:'b-dark', footColor:'#F5EBDC',
      },
    ],
    description: `Mon parcours derrière SBE.

Première de classe depuis toujours. 19/20 au bac. Prépa PCSI à 18 ans.

Puis je pars. 6 mois après. Sans soutien familial.

L1 Éco-Gestion, intégrée au S2 sans aucune base. À la fin de l'année — 1ère sur 500.

Pas parce que j'ai un don. Parce que j'ai compris quelque chose que peu d'étudiants voient.

SBE est né de là.

La réussite n'est pas une question de talent — c'est une question de méthode. 💛`,
    hashtags: `#sbe #parcoursetudiant #fondatrice #ecogestion #methodedetravail #reussitefac #entrepreneur #etudiante #premiereannee #storytellingreussite #bac2024 #l1ecogestion`,
  },
];

// ─── Écriture des 5 fichiers HTML ───────────────────────────────────
for (const c of CONFIGS) {
  const filename = `SBE_Special_${c.id}.html`;
  const fp = path.join(DL, filename);
  fs.writeFileSync(fp, buildHTML(c));
  console.log(`✓ ${filename} (${c.concept})`);
}
console.log(`\n${CONFIGS.length} carrousels générés dans ${DL}`);
