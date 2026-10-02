// Requests to outside services (GitHub, RetroAchievements, rpcs3.net, GameBanana, PPSSPP...), 0.9.17.
// Several sit behind Cloudflare-style bot checks that answer 403 to Node's own HTTP client; Electron's
// net.fetch goes through Chromium's network stack, as a browser does. RomM keeps using plain fetch
// (its own server, often a self-signed or LAN address). Outside Electron (tests) it is plain fetch.
let viaNet = null;
if (process.versions.electron) try { const { net, app } = require('electron'); if (net && typeof net.fetch === 'function') viaNet = (u, o) => (app.isReady() ? net.fetch(u, o) : fetch(u, o)); } catch {}
module.exports = (url, opts) => (viaNet ? viaNet(url, opts) : fetch(url, opts));
