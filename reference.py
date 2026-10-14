"""Independent Python reference for snn-core.js.

Same seeded random generator and same whole-number maths, so the spike
trains can be compared step by step with the JavaScript version.
Usage: python3 reference.py '{"n":50, ...}'
"""
import json
import math
import sys

SCALE = 64


def make_random(seed):
    state = [seed]

    def next_value():
        state[0] = (state[0] * 1664525 + 1013904223) % 4294967296
        return state[0] / 4294967296

    for _ in range(10):
        next_value()
    return next_value


def clamp(x, lowest, highest):
    return max(lowest, min(highest, x))


def quantize_weight(weight, bits):
    step_size = 2 ** (8 - bits)
    rounded = math.floor((weight * SCALE) / step_size + 0.5) * step_size
    return clamp(rounded, -128, 127)


def main(p):
    n = p["n"]
    random = make_random(p["seed"])
    weights = [0.0] * (n * n)
    for i in range(n):
        for j in range(n):
            if i != j and random() < p["prob"]:
                weights[i * n + j] = p["excW"] if j < p["nExc"] else -p["inhW"]
    weights_int = [quantize_weight(w, p["bits"]) for w in weights]
    outside_int = quantize_weight(p["extW"], p["bits"])

    divisor = 2 ** p["K"]
    beta = 1 - 1 / divisor
    highest = 2 ** (p["vBits"] - 1) - 1
    lowest = -(2 ** (p["vBits"] - 1))
    input_random = make_random(p["seed"] + 1000)

    float_v = [0.0] * n
    fixed_v = [0] * n
    float_prev = [0] * n
    fixed_prev = [0] * n
    trace = []

    for _ in range(300):
        outside = [1 if input_random() < p["inputRate"] else 0 for _ in range(n)]
        float_now = [0] * n
        fixed_now = [0] * n
        for i in range(n):
            x = p["extW"] if outside[i] else 0
            for j in range(n):
                if float_prev[j]:
                    x += weights[i * n + j]
            float_v[i] = beta * float_v[i] + x
            if float_v[i] >= 1.0:
                float_now[i] = 1
                float_v[i] = 0.0

            xi = outside_int if outside[i] else 0
            for j in range(n):
                if fixed_prev[j]:
                    xi += weights_int[i * n + j]
            leak = fixed_v[i] // divisor      # floor division, like Math.floor
            v = clamp(fixed_v[i] - leak + xi, lowest, highest)
            if v >= SCALE:
                fixed_now[i] = 1
                v = 0
            fixed_v[i] = v
        float_prev, fixed_prev = float_now, fixed_now
        trace.append([[i for i in range(n) if float_now[i]],
                      [i for i in range(n) if fixed_now[i]]])
    print(json.dumps({"trace": trace}, separators=(",", ":")))


if __name__ == "__main__":
    main(json.loads(sys.argv[1]))
