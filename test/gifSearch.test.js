// 0.9.39 (owner: GIFs didn't load, "PS4" found nothing): both sources asked, short names spelled out, thumbnails
// through romimg://, the biggest first; a source that fails doesn't sink the other
const test = require('node:test');
const assert = require('node:assert');
const G = require('../electron/gifSearch.js');

const res = (json, status = 200) => ({ ok: status < 400, status, json: async () => json });
function fake(asked) {
  return async (url) => {
    asked.push(url);
    const q = decodeURIComponent((/[?&](?:q|gsrsearch)=([^&]+)/.exec(url) || [])[1] || '');
    if (url.includes('openverse')) return /playstation 4/.test(q) ? res({ results: [{ url: 'https://o/a.gif', thumbnail: 'https://o/a/thumb/', width: 640, height: 360, creator: 'x', license: 'by' }, { url: 'https://o/tiny.gif', width: 120, height: 90 }] }) : res({ results: [] });
    if (url.includes('wikimedia')) return /filemime:image\/gif/.test(q) ? res({ query: { pages: { 1: { imageinfo: [{ url: 'https://c/b.gif', thumburl: 'https://c/b-480.gif', width: 800, height: 600, mime: 'image/gif' }] }, 2: { imageinfo: [{ url: 'https://c/c.png', width: 900, height: 600, mime: 'image/png' }] } } } }) : res({});
    return res({}, 404);
  };
}

test('GIF search: "ps4" also asks for PlayStation 4, from Openverse and Commons, biggest first', async () => {
  const asked = [], out = await G.search('ps4', 1, { fetchImpl: fake(asked) });
  assert.strictEqual(asked.length, 6); // two terms x three sources (Tenor answers 404 here)
  assert.deepStrictEqual(out.map((x) => x.url), ['https://c/b.gif', 'https://o/a.gif']); // PNG and the tiny one left out
  assert.ok(out.every((x) => x.thumb.startsWith('romimg://img/?u=')));
  assert.strictEqual(decodeURIComponent(out[0].thumb.split('u=')[1]), 'https://c/b-480.gif');
});

test('GIF search: one source down still gives the other\'s results; both down says why', async () => {
  const half = async (url) => (url.includes('openverse') ? res({}, 503) : fake([])(url));
  assert.strictEqual((await G.search('ps4', 1, { fetchImpl: half })).length, 1);
  await assert.rejects(G.search('ps4', 1, { fetchImpl: async () => res({}, 503) }), /answered 503/);
});

test('GIF search: Tenor\'s page results come first, in its order, small ones left out', async () => {
  const page = (items) => `<html><script id="store-cache" type="text/x-cache">${JSON.stringify({ universal: { search: { 'x-low-all': { results: items } } } })}</script></html>`;
  const item = (id, w) => ({ id, content_description: 'gif ' + id, media_formats: { mediumgif: { url: `https://media1.tenor.com/m/${id}/a.gif`, dims: [w, w] }, tinygif: { url: `https://media.tenor.com/${id}/t.gif`, dims: [220, 220] } } });
  assert.deepStrictEqual(G.tenorResults(page([item('a', 300), item('b', 120), item('c', 498)])).map((x) => x.url), ['https://media1.tenor.com/m/a/a.gif', 'https://media1.tenor.com/m/c/a.gif']);
  assert.deepStrictEqual(G.tenorResults('<html>nothing</html>'), []);
  assert.strictEqual(G.tenorSlug('Mario Kart 8!'), 'mario-kart-8');
  const asked = [];
  const wf = async (url) => { asked.push(url); if (url.includes('tenor.com/search/')) return { ok: true, status: 200, text: async () => page([item(url.includes('playstation') ? 'p' : 'q', 400)]) }; return fake([])(url); };
  const out = await G.search('ps4', 1, { fetchImpl: wf });
  assert.deepStrictEqual(out.slice(0, 2).map((x) => x.by), ['Tenor', 'Tenor']);
  assert.ok(out[0].url.includes('/p/'), 'the spelled-out term goes to Tenor first');
  assert.ok(asked.some((u) => u.endsWith('/search/playstation-4-gifs')));
  await G.search('ps4', 2, { fetchImpl: wf });
  assert.ok(asked.some((u) => u.endsWith('/search/playstation-4-game-gifs')), 'page 2 adds a word');
});
