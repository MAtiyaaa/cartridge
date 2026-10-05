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
  assert.strictEqual(asked.length, 4); // two terms x two sources
  assert.deepStrictEqual(out.map((x) => x.url), ['https://c/b.gif', 'https://o/a.gif']); // PNG and the tiny one left out
  assert.ok(out.every((x) => x.thumb.startsWith('romimg://img/?u=')));
  assert.strictEqual(decodeURIComponent(out[0].thumb.split('u=')[1]), 'https://c/b-480.gif');
});

test('GIF search: one source down still gives the other\'s results; both down says why', async () => {
  const half = async (url) => (url.includes('openverse') ? res({}, 503) : fake([])(url));
  assert.strictEqual((await G.search('ps4', 1, { fetchImpl: half })).length, 1);
  await assert.rejects(G.search('ps4', 1, { fetchImpl: async () => res({}, 503) }), /answered 503/);
});
