// prints spike indices per step for both nets (for comparison with reference.py)
const { createSim } = require('./snn-core.js');
const p = JSON.parse(process.argv[2]);
const sim = createSim(p);
const out = [];
for (let s = 0; s < 300; s++) {
  const r = sim.step();
  const f = [], q = [];
  for (let i = 0; i < p.n; i++) { if (r.floatSpikes[i]) f.push(i); if (r.fixedSpikes[i]) q.push(i); }
  out.push([f, q]);
}
console.log(JSON.stringify({ trace: out }));
