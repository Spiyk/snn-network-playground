# Spiking Network Playground

A small, browser-based spiking neural network that runs twice on identical input: once with ordinary floating-point numbers and once with 8-bit fixed-point integers, so you can see what limited precision does to a network.

## What it shows

- 50 leaky integrate-and-fire neurons (40 excitatory, 10 inhibitory) with random connections
- Raster plots for both versions, plus spikes per step
- Sliders for input rate, weights, leak shift K, weight bits and membrane bits
- A live comparison: when the spike trains first differ, and how much the firing rates differ
- A saturation counter for the integer version

There is no learning in this model. It is a teaching tool, not an accurate copy of any specific chip.

## Run it

Keep `index.html` and `snn-core.js` in the same folder and open `index.html` in a browser. No install needed.

## Fixed-point details

- 1.0 is stored as 64 (6 fractional bits). Threshold is 64.
- Weights are signed 8-bit integers. Fewer weight bits means a coarser step size.
- Leak: each step the neuron loses 1/2^K of its stored value (rounded down), so beta = 1 - 1/2^K. The float version uses the same beta. Dividing by a power of 2 is cheap in hardware, where it is done with a bit shift.
- The membrane potential is a saturating signed integer (8 or 16 bit).

## Tests

`reference.py` is an independent Python implementation of the same integer maths, using the same simple seeded random generator. `compare.sh` runs both on several parameter sets and checks that the spike trains match step by step.

```
./compare.sh
```

Requires Node.js and Python 3.

## Known limits

- Small rounding differences grow in a recurrent network, so exact spike times diverge. Compare rates, not spike times.
- The page layout has been checked for syntax only. Please report anything that looks wrong on your device.

## Licence

MIT

Developed with the help of AI tools.
