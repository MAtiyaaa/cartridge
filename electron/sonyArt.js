// Sony's own marks on RomM's Sony controller pictures (0.9.31, owner: "make it say Sony like the actual controller,
// the PlayStation icon is wrong"). RomM draws its parody branding on them ("ROMMY", an R in the PlayStation logo,
// "Rommstation"). The pictures stay RomM's, fetched from the user's server; only those shapes are swapped for the
// SONY wordmark and the PlayStation logo (Simple Icons, CC0, as makers.js), in the same colour and place.
// Shapes are matched by their exact path data (sha1 of d): a drawing that has changed is left exactly as it is.
const crypto = require('crypto');
// [x, y, w, h, fill] in the drawing's 1000x1000 viewBox: where RomM's text and logo were
const FIX = {
  psx: { text: ["21d501558abf", "5be32b6c6910", "7a4cebb57904", "247baa760326", "ceb642fc9725"], mark: ["7221d9741801", "a44902ad3730", "5e7d2ea6770c", "c3ba235ea16e", "30bd2926912c", "3bdaac199c43", "65062ca791c4", "1b43bdfcce22", "44e5fd7e989a", "158f273cd741", "613edeca7891", "674bd16b6313", "d22d9675cb43", "0a4862be1665"], sony: [404, 336, 193, 28, '#7d7f82'], logo: [452, 386, 96, 62, '#7d7f82'] },
  ps2: { text: ["16a8ac2ed659", "6f1614aa88e6", "677bcbf98f65", "fa5abdb2b385", "94c979988e98"], mark: ["53431a19f1a3", "146071b1bb8c", "f39bea6923d4", "7fa85fc61ada", "9494c8286558", "bc83413bec3b", "c35b29863cb0", "618afc8dfeba", "59ab8dbd24b0", "4254a41d4b7d", "dbfe4d80fc13", "12e27b3c4aa5", "fd37530cc42b", "9137f1280946"], sony: [404, 323, 192, 28, '#7d7f82'], logo: [454, 359, 92, 56, '#7d7f82'] },
  ps3: { text: ["8a4ed2bcb769", "f2216b3defbf", "b07b9493a67a", "848293960949", "a76354e13cd2"], mark: ["5dc2533d368c", "01744111a1b0", "0e73ef8abf3e"], sony: null, logo: [481, 474, 40, 32, '#c6c6c5'] }, // 0.9.47: no SONY in the picture (the card fades its left side, so it read as cut off; the card shows SONY already)
  ps4: { text: [], mark: ["906ab1acdef4", "9dee562727d5", "194aaf12d76a"], sony: null, logo: [488, 472, 33, 27, '#c6c6c5'] },
  ps5: { text: [], mark: ["2e8a1fd01c7d", "13f7208ad976"], sony: null, logo: [471, 466, 62, 50, '#2a2a2d'] },
  psp: { text: ["be14778664b0", "97b24ee8060f", "e0e967f75193", "94c45d8c34c6", "b9d596396a1a"], mark: ["b61ffd14ecc6", "b584d953a6de", "f64f7206aaf4"], sony: [804, 376, 81, 11, '#bcbcbc'], logo: [79, 369, 35, 30, '#c6c6c5'] },
};
const SLUG = { ps: 'psx', ps1: 'psx', playstation: 'psx', 'playstation-2': 'ps2', 'playstation-3': 'ps3', 'playstation-4': 'ps4', 'playstation-5': 'ps5' };
const SONY = { vb: [0, 9.888, 24, 4.224], d: 'M8.5505 9.8881c.921 0 1.6574.2303 2.2209.7423.3848.3485.5999.8454.5939 1.3665a1.9081 1.9081 0 0 1-.5939 1.3726c-.5272.4848-1.3483.7423-2.221.7423-.8725 0-1.6785-.2575-2.2148-.7423-.3908-.3485-.609-.8484-.603-1.3726 0-.518.2182-1.015.603-1.3665.5-.4545 1.3847-.7423 2.2149-.7423zm.003 3.6692c.4606 0 .8878-.1606 1.1878-.4575.2999-.2999.4332-.6605.4332-1.1029 0-.4242-.1484-.821-.4333-1.1029-.2938-.2908-.7332-.4545-1.1877-.4545s-.8938.1637-1.1907.4545c-.2848.2818-.4333.6787-.4333 1.103-.006.409.1485.806.4333 1.1029.2969.2939.7332.4575 1.1907.4575zm-4.8418-1.9665c.1605.0424.315.094.4666.1636a1.352 1.352 0 0 1 .3787.2576c.197.206.309.4817.306.7665a.9643.9643 0 0 1-.3787.7788 2.0662 2.0662 0 0 1-.709.3485 3.7231 3.7231 0 0 1-1.1938.1697c-.352 0-.5467-.0406-.8138-.0962l-.077-.016c-.294-.0666-.5817-.1575-.8575-.2787a.0695.0695 0 0 0-.0424-.0121c-.0454 0-.0818.0394-.0818.0848v.203H.1212v-1.4786h.5242a.7559.7559 0 0 0 .1363.418c.2121.2607.4394.3607.6575.4395.3666.1212.7514.1848 1.1362.1969.5526 0 .8756-.134.9455-.163l.009-.0037.0062-.0023c.0616-.0226.3119-.1143.3119-.3916 0-.2743-.2338-.334-.387-.373l-.022-.0058c-.1708-.046-.562-.0872-.9897-.1323l-.1526-.016c-.4848-.0515-.9696-.1273-1.1968-.1758-.4977-.1097-.6942-.2917-.816-.4045l-.0082-.0076A1.0192 1.0192 0 0 1 0 11.1608c0-.497.3394-.797.7575-.9817.4454-.2.9756-.288 1.4392-.288.8211.0031 1.4877.2697 1.727.394.097.0515.1455-.0121.1455-.0606v-.1484h.5272v1.2876h-.4727a.9056.9056 0 0 0-.2939-.4909 1.289 1.289 0 0 0-.297-.1787c-.3968-.1667-.821-.2515-1.2513-.2455-.4423 0-.8665.085-1.0786.2153-.1333.0818-.2.1848-.2.306 0 .1727.1454.2424.2182.2636.1967.0597.6328.103.972.1369.0736.0073.1426.0142.2036.0206.3272.0334 1.012.1243 1.315.2zm18.1673-.9966v-.4787H24v.4696h-.4757c-.1727 0-.2424.0334-.3727.1788l-1.4271 1.63a.098.098 0 0 0-.0182.0698v.7423a1.106 1.106 0 0 0 .0121.103.1496.1496 0 0 0 .1.0909.9368.9368 0 0 0 .1303.009h.4848v.4698h-2.5724v-.4697h.4606a.9343.9343 0 0 0 .1302-.0091.1627.1627 0 0 0 .1031-.091.5626.5626 0 0 0 .009-.1v-.7422c0-.0242 0-.0242-.0333-.0636a606.7592 606.7592 0 0 0-1.4119-1.6028c-.0758-.0788-.2061-.2061-.406-.2061h-.4576v-.4696h2.5876v.4696h-.3121c-.0697 0-.1182.0697-.0576.1455 0 0 .8696 1.0392.8787 1.0513.0091.0122.0152.0122.0273.003.0121-.009.8938-1.0453.8999-1.0543a.0912.0912 0 0 0-.0182-.1273.1095.1095 0 0 0-.0606-.0182zm-6.284-.0031h.4848c.2212 0 .2606.0848.2636.2909l.0273 1.5664-2.5815-2.324H11.944v.4697h.412c.297 0 .3182.1636.3182.309v2.2138c.0004.1285.0009.295-.1818.295h-.506v.4667h2.1634v-.4697h-.5273c-.212 0-.2211-.097-.2242-.303v-1.8816l2.9724 2.6511h.7575l-.0394-2.9966c.003-.218.0182-.2908.2424-.2908h.4726v-.4697H15.595Z' }; // makers.js sony
const PS = { vb: [-0.1, 2.596, 24.1, 18.808], d: 'M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z' };
// a path scaled into the box, centred, keeping its shape
function placed(mark, [x, y, w, h, fill]) {
  const [vx, vy, vw, vh] = mark.vb, s = Math.min(w / vw, h / vh), ox = x + (w - vw * s) / 2 - vx * s, oy = y + (h - vh * s) / 2 - vy * s;
  return `<path fill="${fill}" transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${s.toFixed(4)})" d="${mark.d}"/>`;
}
const hash = (d) => crypto.createHash('sha1').update(d).digest('hex').slice(0, 12);
function fix(slug, buf) {
  const f = FIX[SLUG[slug] || slug];
  if (!f || !SONY.d) return buf;
  const svg = buf.toString('utf8'), want = new Set([...f.text, ...f.mark]), seen = new Set();
  let firstText = -1, firstMark = -1, out = '', last = 0;
  for (const m of svg.matchAll(/<path\b[^>]*?\sd="([^"]*)"[^>]*\/>/g)) {
    const h = hash(m[1]);
    if (!want.has(h)) continue;
    seen.add(h);
    out += svg.slice(last, m.index);
    if (f.text.includes(h) && firstText < 0) { firstText = out.length; out += '\u0000T'; }
    if (f.mark.includes(h) && firstMark < 0) { firstMark = out.length; out += '\u0000M'; }
    last = m.index + m[0].length;
  }
  if (seen.size !== want.size) return buf; // not the drawing these were measured on: leave it alone
  out += svg.slice(last);
  return Buffer.from(out.replace('\u0000T', f.sony ? placed(SONY, f.sony) : '').replace('\u0000M', placed(PS, f.logo)));
}
const isSonyArt = (target) => { const m = /\/assets\/platforms\/([\w-]+)\.svg(?:\?|$)/i.exec(String(target || '')); return m && FIX[SLUG[m[1].toLowerCase()] || m[1].toLowerCase()] ? m[1].toLowerCase() : null; };
module.exports = { fix, isSonyArt, FIX };
