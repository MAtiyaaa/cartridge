// Finds other Cartridge devices on the same network (for the phone remote's device list).
// Every device with Phone remote on says "I'm here" on UDP broadcast every few seconds and keeps a
// list of who else did. Also answers <name>.local over mDNS when the multicast-dns module is there.
const dgram = require('dgram');
const os = require('os');

const PORT = 47281;
const EVERY = 5000, FORGET = 16000;

function broadcastAddresses() {
  const out = new Set(['255.255.255.255']);
  try {
    for (const list of Object.values(os.networkInterfaces())) {
      for (const a of list || []) {
        if (a.family !== 'IPv4' || a.internal || !a.netmask) continue;
        const ip = a.address.split('.').map(Number), mask = a.netmask.split('.').map(Number);
        out.add(ip.map((b, i) => (b | (~mask[i] & 255))).join('.'));
      }
    }
  } catch {}
  return [...out];
}
const slug = (s) => String(s || 'cartridge').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cartridge';

module.exports = function discovery(me) {
  const log = me.log || (() => {});
  const found = new Map(); // id -> peer
  let sock = null, timer = null, mdns = null;

  const say = () => {
    if (!sock) return;
    const msg = Buffer.from(JSON.stringify({ t: 'cartridge', id: me.id, name: me.name, kind: me.kind, port: me.port, v: me.version }));
    for (const addr of broadcastAddresses()) sock.send(msg, PORT, addr, () => {});
  };

  try {
    sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    sock.on('error', (e) => { log('discovery error', e.message); try { sock.close(); } catch {} sock = null; });
    sock.on('message', (buf, rinfo) => {
      let m;
      try { m = JSON.parse(buf.toString('utf8')); } catch { return; }
      if (m?.t !== 'cartridge' || !m.id || m.id === me.id) return;
      found.set(m.id, { id: m.id, name: String(m.name || 'Cartridge').slice(0, 40), kind: m.kind || 'pc', version: m.v, address: rinfo.address, port: Number(m.port) || 47280, seen: Date.now() });
    });
    sock.bind(PORT, () => { try { sock.setBroadcast(true); } catch {} say(); });
    timer = setInterval(say, EVERY);
    timer.unref?.();
  } catch (e) { log('discovery unavailable', e.message); }

  // <name>.local for phones that resolve mDNS (iPhones do, many Androids too)
  try {
    const mdnsLib = require('multicast-dns');
    mdns = mdnsLib();
    mdns.on('query', (q) => {
      const host = slug(me.name) + '.local';
      if (!q.questions.some((x) => x.type === 'A' && x.name.toLowerCase() === host)) return;
      const ip = broadcastAddresses().length && (Object.values(os.networkInterfaces()).flat().find((a) => a && a.family === 'IPv4' && !a.internal) || {}).address;
      if (ip) mdns.respond({ answers: [{ name: host, type: 'A', ttl: 120, data: ip }] });
    });
    mdns.on('error', () => {});
  } catch {}

  return {
    peers: () => [...found.values()].filter((p) => Date.now() - p.seen < FORGET).map(({ seen, ...p }) => p),
    update(patch) { Object.assign(me, patch); say(); },
    hostname: () => slug(me.name) + '.local',
    stop() {
      clearInterval(timer);
      try { sock?.close(); } catch {}
      try { mdns?.destroy(); } catch {}
      sock = null; mdns = null;
    },
  };
};
