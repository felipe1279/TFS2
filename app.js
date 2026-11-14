/* TFS2 Build Lab - app.js
   Fonte dos dados: data/perks.json (no repositório). Edições feitas no site ficam num
   rascunho local (localStorage) até exportar o perks.json e fazer commit.
   Regra de ouro: informação faltando = "BLANK". Nada aqui pode quebrar por falta de dado. */
'use strict';

const SLOTS = 12, NIVEIS = [1, 2, 3, 4], BLANK = 'BLANK';
const LS = { db: 'tfs2.rascunho.v1', builds: 'tfs2.builds.v1' };
const ABAS_PADRAO = ['Tiro', 'Faca', 'Corrida', 'Explosão', 'Sniper', 'Metralhadoras'];
const CORES_PADRAO = {
  vermelha: { nome: 'Vermelhos', hex: '#d83a3a' }, azul: { nome: 'Azuis', hex: '#3a7bd8' },
  verde: { nome: 'Verdes', hex: '#35a853' }, amarela: { nome: 'Amarelos', hex: '#d8a935' },
  roxa: { nome: 'Roxos', hex: '#8e4ad8' }
};

/* ---------- utilitários ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const num = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const novoUid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const plano = f => (f && typeof f === 'object') ? Object.values(f).join(' ') : String(f ?? '');
const copia = o => JSON.parse(JSON.stringify(o));
function lerLS(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
function gravarLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { aviso('Não consegui salvar neste navegador.'); return false; } }
function aviso(m, fixo) {
  const t = $('#aviso'); t.textContent = m; t.hidden = false;
  clearTimeout(aviso.t); if (!fixo) aviso.t = setTimeout(() => { t.hidden = true; }, 3500);
}
const baixarUrl = (nome, url) => { const a = document.createElement('a'); a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove(); };
const baixarJson = (nome, obj) => { const u = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); baixarUrl(nome, u); setTimeout(() => URL.revokeObjectURL(u), 1500); };
function lerArquivo(cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
  i.onchange = async () => { try { cb(JSON.parse(await i.files[0].text())); } catch { aviso('Arquivo JSON inválido.'); } };
  i.click();
}

/* ---------- limpeza dos dados (aceita lixo, nunca lança erro) ---------- */
function campoEfeito(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) { const o = {}; for (const n of NIVEIS) o[n] = String(v[n] ?? ''); return o; }
  return String(v ?? '');
}
function limpaPerk(p) {
  p = p && typeof p === 'object' ? p : {};
  const id = num(p.id), nome = String(p.nome ?? '').trim();
  return {
    uid: String(p.uid || `u${id ?? 'x'}-${norm(nome).replace(/\W+/g, '-')}`),
    id, nome, cor: norm(p.cor),
    abas: (Array.isArray(p.abas) ? p.abas : String(p.abas ?? '').split(',')).map(a => String(a).trim()).filter(Boolean),
    imagem: String(p.imagem ?? '').trim(),
    valores: Array.isArray(p.valores) ? p.valores.slice(0, 4) : [],
    original: campoEfeito(p.original), simples: campoEfeito(p.simples)
  };
}
function limpaDb(raw) {
  const r = Array.isArray(raw) ? { perks: raw } : (raw && typeof raw === 'object' ? raw : {});
  const src = r.cores && typeof r.cores === 'object' && Object.keys(r.cores).length ? r.cores : CORES_PADRAO, cores = {};
  for (const k in src) { const c = src[k] || {}; cores[norm(k)] = { nome: String(c.nome || k), hex: /^#[0-9a-f]{3,8}$/i.test(c.hex) ? c.hex : '#888888' }; }
  const vistos = new Set();
  const perks = (Array.isArray(r.perks) ? r.perks : []).map(p => limpaPerk(p)).map((p, i) => { if (vistos.has(p.uid)) p.uid += '-' + i; vistos.add(p.uid); return p; });
  return { versao: String(r.versao || '0'), cores, perks };
}

/* Texto de um perk num nível. {v} vira o valor do nível; faltou algo = BLANK. */
function efeito(p, campo, nv) {
  const f = p[campo];
  let s = String((f && typeof f === 'object' ? f[nv] : f) ?? '').trim();
  if (!s) return BLANK;
  if (s.includes('{v}')) {
    const v = p.valores[nv - 1];
    if (v == null || String(v).trim() === '') return BLANK;
    s = s.replaceAll('{v}', () => v);
  }
  return s;
}

/* ---------- estado ---------- */
const S = {
  db: limpaDb(null), base: '0', rascunho: false, defasado: false,
  nivel: 3, aba: 'todos', q: '', orig: false,
  build: { nome: '', notas: '', slots: Array(SLOTS).fill(null) }, builds: []
};
const perk = u => S.db.perks.find(p => p.uid === u);
const corDe = p => S.db.cores[p.cor] || { nome: p.cor || 'Sem cor', hex: '#888888' };
const ordenar = l => [...l].sort((a, b) => (a.id ?? 1e9) - (b.id ?? 1e9) || a.nome.localeCompare(b.nome));
const todasCores = l => [...Object.keys(S.db.cores), ...new Set(l.map(p => p.cor).filter(c => !S.db.cores[c]))];
function grupos(l) { // [[cor, perks]] na ordem das cores, só os que têm perk
  return todasCores(l).map(k => [S.db.cores[k] || { nome: k || 'Sem cor', hex: '#888888' }, ordenar(l.filter(p => p.cor === k))]).filter(([, g]) => g.length);
}
const faltas = p => [!p.nome && 'nome', !p.abas.length && 'abas',
  NIVEIS.some(n => efeito(p, 'original', n) === BLANK) && 'original',
  NIVEIS.some(n => efeito(p, 'simples', n) === BLANK) && 'simples'].filter(Boolean);
const blankTxt = s => s === BLANK ? `<span class="blank">${BLANK}</span>` : esc(s);

/* ---------- catálogo ---------- */
function caixa(p) {
  const c = corDe(p), ef = efeito(p, 'simples', S.nivel), og = efeito(p, 'original', S.nivel);
  return `<article class="perk" style="--c:${c.hex}" title="${esc(og)}">
    <div class="foto"><b class="num">#${p.id ?? '?'}</b>${p.imagem ? `<img src="${esc(p.imagem)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
    <h3>${p.nome ? esc(p.nome) : `<span class="blank">${BLANK}</span>`}</h3>
    <p class="ef">${blankTxt(ef)}</p>${S.orig ? `<p class="or">${blankTxt(og)}</p>` : ''}
    <button class="mini" data-add="${esc(p.uid)}">+ Build</button></article>`;
}
function abas() { // fixas + uma por tag nova encontrada nos perks
  const vistos = new Set(ABAS_PADRAO.map(norm)), extra = [];
  for (const p of S.db.perks) for (const a of p.abas) if (!vistos.has(norm(a))) { vistos.add(norm(a)); extra.push(a); }
  return [['todos', 'Todos os perks'], ...ABAS_PADRAO.map(a => [norm(a), a]), ...extra.map(a => [norm(a), a])];
}
function filtrados() {
  const q = norm(S.q);
  return S.db.perks.filter(p => (S.aba === 'todos' || p.abas.some(a => norm(a) === S.aba)) &&
    (!q || norm([p.id, p.nome, corDe(p).nome, p.abas.join(' '), plano(p.original), plano(p.simples)].join(' ')).includes(q)));
}
function renderCatalogo() {
  $('#abas').innerHTML = abas().map(([k, n]) => `<button class="aba${k === S.aba ? ' on' : ''}" data-aba="${esc(k)}">${esc(n)}</button>`).join('');
  $('#nv-t').textContent = S.nivel;
  $('#grade').innerHTML = grupos(filtrados()).map(([c, g]) =>
    `<section class="grupo" style="--c:${c.hex}"><h2>${esc(c.nome)} <small>${g.length}</small></h2><div class="caixas">${g.map(caixa).join('')}</div></section>`).join('')
    || '<p class="vazio">Nenhum perk aqui. Em "Gerenciar perks" você cria caixas por ID ou adiciona perks.</p>';
}

/* ---------- build ---------- */
function slotsSel() { return S.build.slots.map((s, i) => { const p = s && perk(s.uid); return p ? { ...s, i, p } : null; }).filter(Boolean); }
function opcoesPerk() {
  return '<option value="">— vazio —</option>' + grupos(S.db.perks).map(([c, g]) =>
    `<optgroup label="${esc(c.nome)}">${g.map(p => `<option value="${esc(p.uid)}">#${p.id ?? '?'} ${esc(p.nome || BLANK)}</option>`).join('')}</optgroup>`).join('');
}
function renderBuild() {
  const sel = slotsSel(), ess = sel.filter(s => s.papel === 'essencial').length, opts = opcoesPerk();
  $('#barra').innerHTML = sel.map(s => `<i class="seg ${s.papel === 'essencial' ? 'ess' : 'add'}" style="--c:${corDe(s.p).hex}" title="${esc(s.p.nome || BLANK)}"></i>`).join('')
    || '<span class="vazio">Escolha perks para ver a régua.</span>';
  const rg = $('#rg'); rg.max = sel.length; rg.value = ess; rg.disabled = !sel.length;
  $('#rgt').textContent = `${ess} essenciais · ${sel.length - ess} adicionais · ${SLOTS - sel.length} slots livres. Arraste a régua: os primeiros perks (na ordem dos slots) viram essenciais.`;
  $('#slots').innerHTML = S.build.slots.map((s, i) => {
    const p = s && perk(s.uid);
    const corpo = p
      ? `<div class="sc"><label class="inline">Nv <select data-nv="${i}">${NIVEIS.map(n => `<option${n === s.nivel ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
         <button class="papel mini ${s.papel === 'essencial' ? 'ess' : 'add'}" data-papel="${i}">${s.papel === 'essencial' ? 'Essencial' : 'Adicional'}</button>
         <button class="mini" data-rm="${i}">✕</button></div><p class="ef">${blankTxt(efeito(p, 'simples', s.nivel))}</p>`
      : s ? `<p class="ef"><span class="blank">perk não encontrado</span> <button class="mini" data-rm="${i}">✕</button></p>` : '';
    return `<div class="slot${p ? '' : ' livre'}" style="--c:${p ? corDe(p).hex : '#555'}"><div class="sh"><b>${i + 1}</b><select data-slot="${i}">${opts}</select></div>${corpo}</div>`;
  }).join('');
  document.querySelectorAll('#slots select[data-slot]').forEach(el => { const s = S.build.slots[el.dataset.slot]; el.value = s && perk(s.uid) ? s.uid : ''; });
}
function adicionar(u) {
  if (S.build.slots.some(s => s && s.uid === u)) return aviso('Esse perk já está na build.');
  const i = S.build.slots.findIndex(s => !s || !perk(s.uid));
  if (i < 0) return aviso('Os 12 slots já estão ocupados.');
  S.build.slots[i] = { uid: u, nivel: S.nivel, papel: 'essencial' }; renderBuild(); aviso(`Adicionado ao slot ${i + 1}.`);
}
function novaBuild() { S.build = { nome: '', notas: '', slots: Array(SLOTS).fill(null) }; $('#bnome').value = ''; $('#bnotas').value = ''; renderBuild(); }
function salvarBuild() {
  const b = { id: S.build.id || Date.now(), nome: (S.build.nome || '').trim() || 'Build sem nome', notas: S.build.notas || '', slots: copia(S.build.slots), data: new Date().toISOString().slice(0, 10) };
  const k = S.builds.findIndex(x => x.id === b.id); if (k >= 0) S.builds[k] = b; else S.builds.push(b);
  S.build.id = b.id; gravarLS(LS.builds, S.builds); renderSalvas(); aviso('Build salva neste navegador.');
}
function carregarBuild(id) {
  const b = S.builds.find(x => String(x.id) === String(id)); if (!b) return;
  S.build = { id: b.id, nome: String(b.nome || ''), notas: String(b.notas || ''),
    slots: Array.from({ length: SLOTS }, (_, i) => { const s = b.slots && b.slots[i]; return s && s.uid ? { uid: String(s.uid), nivel: NIVEIS.includes(+s.nivel) ? +s.nivel : 3, papel: s.papel === 'adicional' ? 'adicional' : 'essencial' } : null; }) };
  $('#bnome').value = S.build.nome; $('#bnotas').value = S.build.notas; renderBuild(); aviso('Build carregada.');
}
function excluirBuild(id) {
  if (!confirm('Excluir esta build salva?')) return;
  S.builds = S.builds.filter(x => String(x.id) !== String(id)); gravarLS(LS.builds, S.builds); renderSalvas();
}
function renderSalvas() {
  $('#salvas').innerHTML = S.builds.map(b => `<li><b>${esc(b.nome || 'Build sem nome')}</b> <span class="vazio">${(b.slots || []).filter(Boolean).length} perks · ${esc(b.data || '')}</span>
    <button class="mini" data-load="${esc(b.id)}">Carregar</button> <button class="mini" data-delb="${esc(b.id)}">Excluir</button></li>`).join('')
    || '<li class="vazio">Nenhuma build salva ainda.</li>';
}

/* ---------- recorte (imagem e texto) ---------- */
const carregaImg = url => new Promise(r => { if (!url) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = url; });
function quebra(x, t, w, max) {
  const ls = []; let l = '';
  for (const p of String(t).split(/\s+/)) { const t2 = l ? l + ' ' + p : p; if (x.measureText(t2).width > w && l) { ls.push(l); l = p; } else l = t2; }
  ls.push(l);
  if (ls.length > max) { ls.length = max; ls[max - 1] = ls[max - 1].replace(/.{0,2}$/, '…'); }
  return ls;
}
async function recorte() {
  const sel = slotsSel();
  if (!sel.length) return aviso('Escolha ao menos um perk para gerar o recorte.');
  const ess = sel.filter(s => s.papel === 'essencial'), add = sel.filter(s => s.papel !== 'essencial');
  const imgs = new Map(await Promise.all(sel.map(async s => [s.i, await carregaImg(s.p.imagem)])));
  const BW = 150, BH = 178, G = 12, P = 18, COLS = 6, W = P * 2 + COLS * BW + (COLS - 1) * G;
  const bloco = l => l.length ? 30 + Math.ceil(l.length / COLS) * (BH + G) : 0;
  const cv = $('#cv'), x = cv.getContext('2d'), F = 'system-ui,sans-serif';
  cv.width = W; cv.height = P + 52 + bloco(ess) + bloco(add) + P;
  x.fillStyle = '#14161c'; x.fillRect(0, 0, W, cv.height); x.textBaseline = 'top';
  x.fillStyle = '#e8eaf0'; x.font = `bold 24px ${F}`; x.fillText(S.build.nome || 'Build sem nome', P, P);
  x.fillStyle = '#99a0b2'; x.font = `13px ${F}`; x.fillText(`${sel.length}/${SLOTS} slots · ${ess.length} essenciais · ${add.length} adicionais · TFS2 Build Lab`, P, P + 32);
  let y = P + 52;
  for (const [tit, l] of [['ESSENCIAIS', ess], ['ADICIONAIS', add]]) {
    if (!l.length) continue;
    x.fillStyle = '#e8eaf0'; x.font = `bold 14px ${F}`; x.fillText(tit, P, y + 4); y += 30;
    l.forEach((s, k) => {
      const bx = P + (k % COLS) * (BW + G), by = y + Math.floor(k / COLS) * (BH + G), c = corDe(s.p).hex, im = imgs.get(s.i);
      x.fillStyle = '#222633'; x.fillRect(bx, by, BW, BH); x.fillStyle = c; x.fillRect(bx, by, BW, 5);
      if (im) {
        const r = Math.min((BW - 16) / im.width, 56 / im.height), w = im.width * r, h = im.height * r;
        x.drawImage(im, bx + (BW - w) / 2, by + 12 + (56 - h) / 2, w, h);
        x.fillStyle = c; x.font = `bold 11px ${F}`; x.fillText('#' + (s.p.id ?? '?'), bx + 8, by + 10);
      } else { x.fillStyle = c; x.font = `bold 28px ${F}`; x.textAlign = 'center'; x.fillText('#' + (s.p.id ?? '?'), bx + BW / 2, by + 28); x.textAlign = 'left'; }
      x.fillStyle = c; x.font = `bold 11px ${F}`; x.fillText('Nv ' + s.nivel, bx + BW - 34, by + 10);
      x.font = `bold 13px ${F}`; x.fillStyle = s.p.nome ? '#e8eaf0' : '#99a0b2';
      quebra(x, s.p.nome || BLANK, BW - 16, 2).forEach((t, j) => x.fillText(t, bx + 8, by + 74 + j * 16));
      x.font = `12px ${F}`; x.fillStyle = '#c9cedb';
      quebra(x, efeito(s.p, 'simples', s.nivel), BW - 16, 4).forEach((t, j) => x.fillText(t, bx + 8, by + 108 + j * 15));
    });
    y += Math.ceil(l.length / COLS) * (BH + G);
  }
  const d = $('#dlg'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}
function textoBuild() {
  const sel = slotsSel(), fmt = s => `- #${s.p.id ?? '?'} ${s.p.nome || BLANK} [Nv ${s.nivel}]: ${efeito(s.p, 'simples', s.nivel)}`;
  const ess = sel.filter(s => s.papel === 'essencial'), add = sel.filter(s => s.papel !== 'essencial');
  return [`BUILD: ${S.build.nome || 'sem nome'} (${sel.length}/${SLOTS} slots)`, '', `ESSENCIAIS (${ess.length})`, ...ess.map(fmt), '', `ADICIONAIS (${add.length})`, ...add.map(fmt),
    S.build.notas ? '\nNotas: ' + S.build.notas : ''].join('\n');
}
async function copiarImg() {
  try { const b = await new Promise(r => $('#cv').toBlob(r, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); aviso('Imagem copiada.'); }
  catch { aviso('O navegador bloqueou a cópia. Use Baixar PNG.'); }
}
async function copiarTexto() {
  const t = textoBuild();
  try { await navigator.clipboard.writeText(t); aviso('Texto copiado.'); } catch { prompt('Copie o texto abaixo:', t); }
}

/* ---------- gerenciar perks ---------- */
const textoCampo = f => (f && typeof f === 'object') ? NIVEIS.map(n => f[n]).join('\n') : String(f ?? '');
function renderGerenciar() {
  const opc = todasCores(S.db.perks).map(k => `<option value="${esc(k)}">${esc((S.db.cores[k] || { nome: k || 'Sem cor' }).nome)}</option>`).join('');
  $('#f-cor').innerHTML = opc; $('#lote-cor').innerHTML = opc;
  const l = ordenar(S.db.perks);
  $('#pend').textContent = `${l.length} perks · ${l.filter(p => faltas(p).length).length} com pendências`;
  $('#tab').innerHTML = '<tr><th>ID</th><th>Cor</th><th>Nome</th><th>Pendências</th><th></th></tr>' + l.map(p => `<tr>
    <td>#${p.id ?? '?'}</td><td><i class="dot" style="background:${corDe(p).hex}"></i>${esc(corDe(p).nome)}</td>
    <td>${p.nome ? esc(p.nome) : `<span class="blank">${BLANK}</span>`}</td><td class="vazio">${esc(faltas(p).join(', ') || 'completo')}</td>
    <td><button class="mini" data-edit="${esc(p.uid)}">Editar</button> <button class="mini" data-delp="${esc(p.uid)}">Excluir</button></td></tr>`).join('');
}
function salvarDb() { gravarLS(LS.db, { base: S.base, db: S.db }); S.rascunho = true; renderAviso(); }
function limparForm() { $('#fp').reset(); $('#fp').elements.uid.value = ''; }
function salvarPerk() {
  const f = $('#fp'), v = n => f.elements[n].value;
  const campo = t => { const l = t.split('\n').map(s => s.trim()); while (l.length && !l[l.length - 1]) l.pop(); return l.length <= 1 ? (l[0] || '') : { 1: l[0] || '', 2: l[1] || '', 3: l[2] || '', 4: l[3] || '' }; };
  let p = perk(v('uid')); const novo = !p;
  if (novo) p = limpaPerk({ uid: novoUid() });
  let id = num(v('id'));
  if (id == null) id = novo ? Math.max(0, ...S.db.perks.map(x => x.id || 0)) + 1 : p.id;
  // Regra do ID: se a vaga está ocupada, todos de id >= novo ID sobem uma posição.
  if (id != null && S.db.perks.some(x => x !== p && x.id === id)) S.db.perks.forEach(x => { if (x !== p && x.id != null && x.id >= id) x.id++; });
  const vals = v('valores').split(',').map(s => s.trim()).slice(0, 4).map(s => s === '' || isNaN(s) ? s : Number(s));
  Object.assign(p, { id, nome: v('nome').trim(), cor: norm(v('cor')), abas: v('abas').split(',').map(s => s.trim()).filter(Boolean),
    imagem: v('imagem').trim(), valores: vals.every(s => s === '') ? [] : vals, original: campo(v('original')), simples: campo(v('simples')) });
  if (novo) S.db.perks.push(p);
  salvarDb(); limparForm(); renderTudo(); aviso('Perk salvo no rascunho local.');
}
function editar(u) {
  const p = perk(u); if (!p) return;
  const e = $('#fp').elements;
  e.uid.value = p.uid; e.id.value = p.id ?? ''; e.nome.value = p.nome; e.cor.value = p.cor; e.abas.value = p.abas.join(', ');
  e.imagem.value = p.imagem; e.valores.value = p.valores.join(', '); e.original.value = textoCampo(p.original); e.simples.value = textoCampo(p.simples);
  $('#fp').scrollIntoView({ behavior: 'smooth' });
}
function excluirPerk(u) {
  const p = perk(u); if (!p || !confirm(`Excluir o perk #${p.id ?? '?'} ${p.nome || BLANK}? (os IDs seguintes não mudam)`)) return;
  S.db.perks = S.db.perks.filter(x => x !== p); salvarDb(); renderTudo();
}
function criarCaixas() {
  const cor = norm($('#lote-cor').value), de = num($('#lote-de').value), ate = num($('#lote-ate').value);
  if (de == null || ate == null || ate < de || ate - de > 299) return aviso('Informe um intervalo de IDs válido (máximo 300).');
  const tem = new Set(S.db.perks.map(p => p.id)); let n = 0;
  for (let i = de; i <= ate; i++) if (!tem.has(i)) { S.db.perks.push(limpaPerk({ uid: novoUid(), id: i, cor })); n++; }
  salvarDb(); renderTudo(); aviso(`${n} caixas criadas (IDs que já existiam foram mantidos).`);
}
function exportarPerks() { baixarJson('perks.json', S.db); aviso('perks.json exportado. Substitua data/perks.json no GitHub e faça commit.'); }
function importarPerks() {
  lerArquivo(j => { if (!confirm('Substituir o banco atual (rascunho) pelo arquivo importado?')) return; S.db = limpaDb(j); salvarDb(); renderTudo(); aviso('perks.json importado como rascunho.'); });
}
function descartar() {
  if (!confirm('Descartar o rascunho local e voltar ao banco publicado?')) return;
  try { localStorage.removeItem(LS.db); } catch { /* ignora */ }
  location.reload();
}
function renderAviso() {
  const b = $('#rascunho'); b.hidden = !S.rascunho;
  b.innerHTML = S.rascunho ? `Rascunho local ativo (edições só neste navegador). <button id="x-exp">Exportar perks.json</button> <button id="x-desc">Descartar rascunho</button>${S.defasado ? ' <b>O banco publicado mudou desde o seu rascunho.</b>' : ''}` : '';
}

/* ---------- navegação, eventos e início ---------- */
function trocar(v) {
  for (const k of ['catalogo', 'build', 'gerenciar']) $('#v-' + k).hidden = k !== v;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
function renderTudo() { renderCatalogo(); renderBuild(); renderGerenciar(); renderSalvas(); renderAviso(); }
function eventos() {
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.v) trocar(d.v);
    else if (d.aba != null) { S.aba = d.aba; renderCatalogo(); }
    else if (d.add) adicionar(d.add);
    else if (d.papel != null) { const s = S.build.slots[d.papel]; if (s) { s.papel = s.papel === 'essencial' ? 'adicional' : 'essencial'; renderBuild(); } }
    else if (d.rm != null) { S.build.slots[d.rm] = null; renderBuild(); }
    else if (d.load) carregarBuild(d.load);
    else if (d.delb) excluirBuild(d.delb);
    else if (d.edit) editar(d.edit);
    else if (d.delp) excluirPerk(d.delp);
    else if (t.id === 'x-exp') exportarPerks();
    else if (t.id === 'x-desc') descartar();
  });
  $('#slots').addEventListener('change', e => {
    const el = e.target, d = el.dataset, sl = S.build.slots;
    if (d.slot != null) { const i = +d.slot, old = sl[i]; sl[i] = el.value ? { uid: el.value, nivel: old?.nivel || S.nivel, papel: old?.papel || 'essencial' } : null; }
    else if (d.nv != null && sl[+d.nv]) sl[+d.nv].nivel = +el.value;
    renderBuild();
  });
  $('#q').oninput = e => { S.q = e.target.value; renderCatalogo(); };
  $('#nv').oninput = e => { S.nivel = +e.target.value || 3; renderCatalogo(); };
  $('#orig').onchange = e => { S.orig = e.target.checked; renderCatalogo(); };
  $('#bnome').oninput = e => { S.build.nome = e.target.value; };
  $('#bnotas').oninput = e => { S.build.notas = e.target.value; };
  $('#rg').oninput = e => { const n = +e.target.value; slotsSel().forEach((s, k) => { S.build.slots[s.i].papel = k < n ? 'essencial' : 'adicional'; }); renderBuild(); };
  $('#b-salvar').onclick = salvarBuild; $('#b-recorte').onclick = recorte; $('#b-limpar').onclick = novaBuild;
  $('#b-exp').onclick = () => baixarJson('builds-tfs2.json', S.builds);
  $('#b-imp').onclick = () => lerArquivo(j => {
    const l = Array.isArray(j) ? j.filter(b => b && Array.isArray(b.slots)) : [];
    l.forEach((b, i) => { b.id = b.id || Date.now() + i; const k = S.builds.findIndex(x => x.id === b.id); if (k >= 0) S.builds[k] = b; else S.builds.push(b); });
    gravarLS(LS.builds, S.builds); renderSalvas(); aviso(`${l.length} builds importadas.`);
  });
  $('#fp').onsubmit = e => { e.preventDefault(); salvarPerk(); };
  $('#p-novo').onclick = limparForm; $('#lote-go').onclick = criarCaixas;
  $('#p-exp').onclick = exportarPerks; $('#p-imp').onclick = importarPerks;
  $('#r-img').onclick = copiarImg; $('#r-txt').onclick = copiarTexto; $('#r-x').onclick = () => $('#dlg').close();
  $('#r-png').onclick = () => baixarUrl((S.build.nome || 'build').replace(/[^\w-]+/g, '_') + '.png', $('#cv').toDataURL('image/png'));
}
async function iniciar() {
  let repo = null;
  try { const r = await fetch('data/perks.json', { cache: 'no-store' }); if (r.ok) repo = await r.json(); } catch { /* segue com dados vazios */ }
  const base = limpaDb(repo); S.base = base.versao;
  if (!repo) aviso('Não consegui ler data/perks.json (abra pelo GitHub Pages ou por um servidor local). O site segue funcionando.', true);
  const loc = lerLS(LS.db, null);
  if (loc && loc.db) { S.db = limpaDb(loc.db); S.rascunho = true; S.defasado = !!repo && loc.base !== base.versao; } else S.db = base;
  const b = lerLS(LS.builds, []); S.builds = Array.isArray(b) ? b.filter(x => x && typeof x === 'object') : [];
  eventos(); trocar('catalogo'); renderTudo();
}
globalThis.addEventListener?.('error', e => aviso('Erro inesperado (o site continua): ' + e.message, true));
iniciar().catch(e => aviso('Erro ao iniciar: ' + e.message, true));
