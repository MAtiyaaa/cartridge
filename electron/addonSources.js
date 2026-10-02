// Where add-ons come from (0.9.17, owner: texture packs and mods downloaded from Cartridge).
// - PS2 texture packs: the catalog ARMSX2 and EmuCoreX read, sashkinbro/EmuCoreX-Textures on GitHub
//   (textures.json, schemaVersion 1: entries with serials ["SLUS-21287"], downloadUrl or ordered parts,
//   sizeBytes, sha256 of the whole zip, authors, sourceUrl). Its zips hold SERIAL/replacements/... or
//   replacements/..., PNG and DDS, which is PCSX2's own layout (textures/<SERIAL>/replacements).
//   ARMSX2's other catalog (dl.ps2ktxpak.net) is ASTC for phone GPUs and isn't used.
// - Everything else: GameBanana's public API (apiv11), the way mod managers read it: find the game
//   (Util/Search/Results, model Game), its mods (Game/<id>/Subfeed), a mod's files (Mod/<id>, _aFiles:
//   _idRow, _sFile, _nFilesize, _sDownloadUrl, _sMd5Checksum). gamebanana.com was blocked where this
//   was written, so the shapes are read defensively and anything unexpected says so.
const fs = require('fs');

const PS2_CATALOG = 'https://raw.githubusercontent.com/sashkinbro/EmuCoreX-Textures/main/textures.json';
const GB = 'https://gamebanana.com/apiv11';
const UA = { 'User-Agent': 'Cartridge (RomM client)', Accept: 'application/json' };

// ---------------------------------------------------------------- PS2 (EmuCoreX catalog)
function parsePs2Catalog(j) {
  if (!j || j.schemaVersion !== 1 || !Array.isArray(j.entries)) throw new Error('The PS2 texture catalog changed its format.');
  const out = [];
  for (const e of j.entries) {
    // one bad entry only drops itself (as ARMSX2 reads it)
    if (!e || typeof e.id !== 'string' || !Array.isArray(e.serials) || !/^[0-9A-Fa-f]{64}$/.test(e.sha256 || '') || !(e.sizeBytes > 0)) continue;
    const parts = Array.isArray(e.parts) && e.parts.length > 1 ? e.parts.filter((p) => /^https:\/\//.test(p.downloadUrl || '') && /^[0-9A-Fa-f]{64}$/.test(p.sha256 || '')) : null;
    if (!parts && !/^https:\/\//.test(e.downloadUrl || '')) continue;
    if (parts && parts.length !== e.parts.length) continue;
    out.push({ source: 'ps2', id: e.id, name: e.name || e.gameTitle || e.id, game: e.gameTitle || '', serials: e.serials.map((s) => String(s).toUpperCase()), version: e.version || '', authors: e.authors || [], credits: e.credits || '', description: e.description || '', sourceUrl: e.sourceUrl || '', license: e.license || '', size: e.sizeBytes, sha256: e.sha256.toLowerCase(), files: e.fileCount || 0, url: parts ? null : e.downloadUrl, parts: parts && parts.map((p) => ({ url: p.downloadUrl, size: p.sizeBytes, sha256: p.sha256.toLowerCase() })), previews: (e.previewUrls || []).filter((u) => /^https:\/\//.test(u)) });
  }
  return out;
}
async function ps2Catalog({ cacheFile, fetchImpl = fetch, maxAge = 24 * 3600e3 } = {}) {
  let cached = null;
  try { cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch {}
  if (cached && Date.now() - cached.at < maxAge) return parsePs2Catalog(cached.data);
  try {
    const r = await fetchImpl(PS2_CATALOG, { headers: UA, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`The PS2 texture catalog answered ${r.status}`);
    const data = await r.json();
    const list = parsePs2Catalog(data);
    try { fs.writeFileSync(cacheFile, JSON.stringify({ at: Date.now(), data })); } catch {}
    return list;
  } catch (e) { if (cached) return parsePs2Catalog(cached.data); throw e; }
}
const ps2For = (list, serial) => list.filter((e) => e.serials.includes(String(serial || '').toUpperCase()));

// ---------------------------------------------------------------- GameBanana
const key = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[™®©]/g, '').replace(/[^a-z0-9]+/g, '');
async function gbGet(path, fetchImpl) {
  const r = await fetchImpl(GB + path, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`GameBanana answered ${r.status}`);
  return r.json();
}
// the GameBanana game for a title: an exact name match only (no guessing between games)
async function gbGame(title, { fetchImpl = fetch } = {}) {
  const j = await gbGet(`/Util/Search/Results?_sModelName=Game&_sOrder=best_match&_nPage=1&_sSearchString=${encodeURIComponent(title)}`, fetchImpl);
  const recs = Array.isArray(j?._aRecords) ? j._aRecords : [];
  const want = key(title);
  const hit = recs.find((g) => g && g._idRow && key(g._sName) === want) || recs.find((g) => g && g._idRow && key(String(g._sName).replace(/\(.*?\)/g, '')) === want);
  return hit ? { id: hit._idRow, name: hit._sName } : null;
}
function parseGbMods(j) {
  const recs = Array.isArray(j?._aRecords) ? j._aRecords : [];
  return recs.filter((m) => m && m._idRow && (!m._sModelName || m._sModelName === 'Mod')).map((m) => {
    const img = m._aPreviewMedia?._aImages?.[0];
    return { source: 'gb', id: m._idRow, name: m._sName || `Mod ${m._idRow}`, authors: m._aSubmitter?._sName ? [m._aSubmitter._sName] : [], category: m._aRootCategory?._sName || '', likes: m._nLikeCount || 0, url: m._sProfileUrl || `https://gamebanana.com/mods/${m._idRow}`, preview: img?._sBaseUrl && (img._sFile220 || img._sFile) ? `${img._sBaseUrl}/${img._sFile220 || img._sFile}` : '' };
  });
}
async function gbMods(gameId, { fetchImpl = fetch, page = 1 } = {}) {
  return parseGbMods(await gbGet(`/Game/${Number(gameId)}/Subfeed?_nPage=${page}&_sSort=default&_csvModelInclusions=Mod`, fetchImpl));
}
const ARCHIVE = /\.(zip|7z|rar)$/i;
function parseGbFiles(j) {
  const files = Array.isArray(j?._aFiles) ? j._aFiles : [];
  return files.filter((f) => f && f._idRow && /^https:\/\//.test(f._sDownloadUrl || '') && ARCHIVE.test(f._sFile || '') && !f._bContainsExe)
    .map((f) => ({ id: f._idRow, name: f._sFile, size: f._nFilesize || 0, url: f._sDownloadUrl, md5: /^[0-9a-f]{32}$/i.test(f._sMd5Checksum || '') ? f._sMd5Checksum.toLowerCase() : '', description: f._sDescription || '' }));
}
async function gbFiles(modId, { fetchImpl = fetch } = {}) {
  return parseGbFiles(await gbGet(`/Mod/${Number(modId)}?_csvProperties=_aFiles,_sName,_aSubmitter`, fetchImpl));
}

module.exports = { PS2_CATALOG, parsePs2Catalog, ps2Catalog, ps2For, gbGame, gbMods, gbFiles, parseGbMods, parseGbFiles, key };
