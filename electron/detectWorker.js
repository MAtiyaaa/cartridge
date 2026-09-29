// Setup's scan: reads what each found file is, off Electron's main thread (detect.identifyAll)
const { parentPort, workerData } = require('worker_threads');
const { identifyAll } = require('./detect');
const items = identifyAll(workerData.cands, workerData.prevList, (d) => parentPort.postMessage({ progress: d }), (...a) => parentPort.postMessage({ log: a.map(String) }));
parentPort.postMessage({ items });
