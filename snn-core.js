// snn-core.js
// The brain of the spiking network playground.
//
// The same small network runs twice on the same input:
//   1. "float" version: ordinary decimal numbers (0.3, 0.875 ...)
//   2. "fixed" version: whole numbers only, like a small chip would use
//
// Fixed-point idea: we pretend 1.0 is the whole number 64.
// So 0.5 becomes 32, 0.25 becomes 16, and so on.

const SCALE = 64;

// A simple random number generator that we can "seed".
// Same seed -> same sequence of numbers every time.
// (Math.random() cannot do this, so we make our own.)
function makeRandom(seed) {
  let state = seed;

  function next() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;   // a number between 0 and 1
  }

  // throw away the first few numbers so nearby seeds look different
  for (let i = 0; i < 10; i++) next();
  return next;
}

function clamp(x, lowest, highest) {
  return Math.max(lowest, Math.min(highest, x));
}

// Turn a decimal weight into a whole number between -128 and 127.
// With fewer bits the weights are rounded more coarsely.
function quantizeWeight(weight, bits) {
  const stepSize = Math.pow(2, 8 - bits);          // 8 bits -> 1, 4 bits -> 16
  const rounded = Math.round((weight * SCALE) / stepSize) * stepSize;
  return clamp(rounded, -128, 127);
}

// Build the random connections.
// weights[i * n + j] is the strength of the link from neuron j to neuron i.
// The first nExc neurons are excitatory (+), the rest are inhibitory (-).
function buildWeights(p) {
  const random = makeRandom(p.seed);
  const weights = new Array(p.n * p.n).fill(0);

  for (let i = 0; i < p.n; i++) {
    for (let j = 0; j < p.n; j++) {
      if (i !== j && random() < p.prob) {
        weights[i * p.n + j] = j < p.nExc ? p.excW : -p.inhW;
      }
    }
  }
  return weights;
}

function createSim(p) {
  const n = p.n;
  const weights = buildWeights(p);
  const weightsInt = weights.map((w) => quantizeWeight(w, p.bits));
  const outsideInt = quantizeWeight(p.extW, p.bits);

  const divisor = Math.pow(2, p.K);       // the leak divides by this each step
  const beta = 1 - 1 / divisor;           // float version keeps this fraction
  const thresholdInt = SCALE;             // threshold 1.0 is 64 in whole numbers

  // The membrane potential is limited to a range (8 or 16 bits).
  const highest = Math.pow(2, p.vBits - 1) - 1;
  const lowest = -Math.pow(2, p.vBits - 1);

  const inputRandom = makeRandom(p.seed + 1000);

  // state of the float network and the fixed network
  let floatV = new Array(n).fill(0);
  let fixedV = new Array(n).fill(0);
  let floatPrev = new Array(n).fill(0);    // who spiked in the last step
  let fixedPrev = new Array(n).fill(0);
  let saturations = 0;
  let t = 0;

  function step() {
    // Random spikes from outside. Both networks get exactly the same ones.
    const outside = [];
    for (let i = 0; i < n; i++) {
      outside.push(inputRandom() < p.inputRate ? 1 : 0);
    }

    const floatNow = new Array(n).fill(0);
    const fixedNow = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      // ---- float neuron ----
      let input = outside[i] ? p.extW : 0;
      for (let j = 0; j < n; j++) {
        if (floatPrev[j] === 1) input += weights[i * n + j];
      }
      floatV[i] = beta * floatV[i] + input;
      if (floatV[i] >= 1.0) {
        floatNow[i] = 1;
        floatV[i] = 0;
      }

      // ---- fixed-point neuron (whole numbers only) ----
      let inputInt = outside[i] ? outsideInt : 0;
      for (let j = 0; j < n; j++) {
        if (fixedPrev[j] === 1) inputInt += weightsInt[i * n + j];
      }

      // leak: lose 1/divisor of the stored value (rounded down)
      const leak = Math.floor(fixedV[i] / divisor);
      let v = fixedV[i] - leak + inputInt;

      // keep v inside its allowed range, and count when we had to cut it
      const limited = clamp(v, lowest, highest);
      if (limited !== v) saturations++;
      v = limited;

      if (v >= thresholdInt) {
        fixedNow[i] = 1;
        v = 0;
      }
      fixedV[i] = v;
    }

    // spikes from this step reach the neurons in the next step
    floatPrev = floatNow;
    fixedPrev = fixedNow;
    t++;
    return { t, floatSpikes: floatNow, fixedSpikes: fixedNow, saturations };
  }

  return { step, beta };
}

// lets Node.js tests load this file; browsers ignore it
if (typeof module !== 'undefined') {
  module.exports = { createSim, makeRandom, quantizeWeight, SCALE };
}
