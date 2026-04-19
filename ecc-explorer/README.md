# 🔐 Elliptic Curve Cryptography — Interactive Explorer

> A professional, fully interactive visual lab for understanding Elliptic Curve Cryptography (ECC) — from the math foundations to Bitcoin's secp256k1, brute-force key search, Baby-step Giant-step, and Pollard's Kangaroo algorithm.

**No dependencies. No build step. Single HTML file. Open and run.**

---

## 🚀 Live Demo

Just open `index.html` in any modern browser — or host it on GitHub Pages.

```bash
git clone https://github.com/YOUR_USERNAME/exploration.git
cd exploration/ecc-explorer
open index.html
```

---

## 📐 What Is an Elliptic Curve?

An elliptic curve is defined by the equation:

```
y² = x³ + ax + b
```

Points on this curve form a **mathematical group** — meaning you can "add" two points together and always get another point on the same curve. This group property is the foundation of all ECC cryptography.

### The Two Curves in This Demo

| Curve | Equation | Used for |
|---|---|---|
| Toy curve | `y² = x³ − 3x + 3` | Learning — visible on screen |
| **secp256k1** | `y² = x³ + 7` | Real Bitcoin cryptography |

---

## 🧮 The Math Behind ECC

### Point Addition

Given two points P and Q on the curve, their sum R = P + Q is computed by:

1. Draw a line through P and Q
2. Find where it intersects the curve (a third point)
3. Reflect that intersection over the x-axis → that's R

Algebraically:
```
m = (Qy - Py) / (Qx - Px)
Rx = m² - Px - Qx
Ry = m(Px - Rx) - Py
```

### Point Doubling (P + P)

When P = Q, the line becomes a tangent:
```
m = (3·Px² + a) / (2·Py)
```

### Scalar Multiplication (the key operation)

```
Q = k · G  =  G + G + G + ... + G  (k times)
```

- `G` = Generator point (public, fixed constant)
- `k` = Private key (secret integer)
- `Q` = Public key (what you share)

This is **fast to compute** (milliseconds), but **impossible to reverse** — finding `k` given `Q` and `G` is the **Elliptic Curve Discrete Logarithm Problem (ECDLP)**.

---

## 🪙 Bitcoin's secp256k1 Parameters

Bitcoin uses a specific curve with 6 hardcoded constants — nobody can change them:

| Parameter | Value | Meaning |
|---|---|---|
| `p` | `2²⁵⁶ − 2³² − 977` | Prime field modulus |
| `a` | `0` | Curve coefficient |
| `b` | `7` | Curve coefficient |
| `Gx` | `79BE667EF9DCBBAC55A06295CE870B07...` | Generator point X |
| `Gy` | `483ADA7726A3C4655DA4FBFC0E1108A8...` | Generator point Y |
| `n` | `FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141` | Curve order |

### Why These Values?

- `p = 2²⁵⁶ − 2³² − 977` allows extremely fast modular arithmetic on 64-bit CPUs
- `a = 0` simplifies the point doubling formula (fewer multiplications)
- `n` is a large prime — critical for cryptographic security
- The parameters are derivable and transparent — no hidden backdoors (unlike NIST P-256)

### Private Key vs Public Key vs G

```
G   = Generator point  → hardcoded constant, public, same for every Bitcoin wallet
k   = Your slider      → the PRIVATE KEY (secret random 256-bit integer)
Q   = k · G            → the PUBLIC KEY  (shared openly)
```

**Everyone knows G. Nobody knows k. Everyone can see Q.**

---

## 🖥️ Demo Tabs Explained

### 1. Point Multiply

The core visualization. Watch `Q = k·G` computed step by step on the real curve.

- **Slider k (1–100):** your private key — drag to change
- **Animate:** auto-steps through all k values
- **Step +1:** advance one hop at a time
- **Axis controls:** zoom (scroll wheel), pan (click+drag), or type exact ranges
- **Curve toggle:**
  - `Toy curve` — floating point, points visually on screen
  - `secp256k1` — real 256-bit BigInt arithmetic; true coordinates shown in sidebar (hover for full hex)

**What to notice:** as k grows, Q jumps around the curve with no visible pattern — this is the security.

### 2. Chaos View

Plots `Q = k·G` for k = 1..N simultaneously. Shows how the public keys scatter across the curve with **zero visible pattern** — even at small scale.

The pseudorandom scatter is not a bug. It is the entire point. At Bitcoin scale (k up to 2²⁵⁶), the scatter is so dense that no graphical or statistical analysis can reveal k from Q.

### 3. Bitcoin Keys

Generates a simulated secp256k1 key pair:
- **Private key:** 256-bit cryptographically random integer
- **Public key:** uncompressed 65-byte point (prefix `04` + 32-byte X + 32-byte Y)
- **Address:** simulated Bitcoin-style address

Security meter shows `2²⁵⁶` — the actual key space size. For reference: more than the number of atoms in the observable universe.

> ⚠️ For demonstration only. Real keys require a cryptographically secure RNG and full secp256k1 field arithmetic.

### 4. 🦘 Kangaroo (Pollard's Lambda)

Visualizes **Pollard's Kangaroo algorithm** — the best known method for solving ECDLP in a bounded range.

**How it works:**

Two "kangaroos" hop across the integer number line (the discrete log search space):

```
Tame kangaroo  🦘  → starts at known position t_start
Wild kangaroo  🦘  → starts at secret k (unknown to algorithm)
Both jump by deterministic pseudorandom amounts based on current position
```

When both land on the **same position**:
```
tame_start + tame_distance = k + wild_distance
→  k = tame_start + tame_distance − wild_distance
```

**Complexity comparison:**

| Method | Steps needed | Bitcoin feasibility |
|---|---|---|
| Brute force | O(n) | ❌ Impossible (10⁷⁷ steps) |
| Baby-step Giant-step | O(√n) | ❌ Impossible (2¹²⁸ steps) |
| Pollard's Kangaroo | O(√n) | ❌ Impossible (2¹²⁸ steps) |
| Quantum (Shor's) | O(log²n) | ⚠️ Theoretically possible — needs ~4M physical qubits |

**Controls:**
- Range selector: size of the search space
- NEW PROBLEM: random secret k
- RUN / STEP: animate or step manually

### 5. 🔍 Find k (ECDLP Visualizer)

**The core of the cryptographic problem, made visual.**

Fix a point Q on the curve — then watch algorithms search for the private key k such that `k·G = Q`.

**Two algorithms:**

#### Brute Force
```
Try k=1 → compute 1·G → does it equal Q? No.
Try k=2 → compute 2·G → does it equal Q? No.
...
Try k=n → compute n·G → does it equal Q? YES → found k.
```
- Every tested point shown as a **cyan dot** on the curve
- A trail connects all attempts in order
- O(k) steps in the worst case

#### Baby-step Giant-step (BSGS — Shanks' Algorithm)
```
Precompute baby steps:  j·G  for j = 0..m    → store in hash table
Search giant steps:     Q − i·(m·G)          → check table for match
Collision gives: k = i·m + j
```
- **Green dots:** baby steps (precomputed, stored)
- **Red dots:** giant steps (searching)
- Collision = k found
- O(√n) steps — square root speedup over brute force

**How to use:**
- Click **NEW Q** for a random target, or **click directly on the curve** to place your own Q
- Switch between Brute Force and BSGS to compare how many steps each takes
- Watch the step count — even on this tiny toy curve (k ≤ 60), BSGS is noticeably faster

**The takeaway:** On Bitcoin's curve with k up to 2²⁵⁶:
- Brute force: ~10⁷⁷ steps → heat death of universe
- BSGS: ~2¹²⁸ steps → still longer than age of universe × 10²⁰
- **This is why your private key is safe.**

---

## 🔑 The Security Asymmetry

```
Forward:  k  →  Q = k·G     milliseconds  ✅
Reverse:  Q  →  k = ?        computationally infeasible  ❌
```

This one-way property is called the **Elliptic Curve Discrete Logarithm Problem (ECDLP)**. No polynomial-time algorithm is known for classical computers. Shor's quantum algorithm solves it in O(log²n) but requires approximately 4 million physical qubits — far beyond current hardware.

---

## ⚛️ What About Quantum Computers?

| Threat | Detail |
|---|---|
| Algorithm | Shor's algorithm — solves ECDLP in polynomial time |
| Qubits needed | ~4,000 **logical** qubits for secp256k1 |
| Physical qubits needed | ~4,000,000 physical qubits (due to error correction) |
| Best available today | ~1,000 noisy physical qubits (IBM, Google) |
| Realistic threat timeline | 10–20 years (majority consensus) |
| Industry response | NIST Post-Quantum Standards (2024): CRYSTALS-Kyber, CRYSTALS-Dilithium |

---

## 🏗️ Technical Implementation

```
index.html          Single-file app — HTML + CSS + JS, zero dependencies
```

### Key implementation details

**Toy curve arithmetic:** standard floating-point, runs in real number space. Points are plotted directly on screen coordinates.

**secp256k1 arithmetic:** full 256-bit BigInt arithmetic using JavaScript's native `BigInt`. All operations performed modulo `p`. Includes:
- Modular inverse via extended Euclidean algorithm
- Point addition and doubling in Weierstrass form
- Scalar multiplication via repeated addition

**Visual projection (secp256k1 mode):** Real G/Q coordinates (~2²⁵⁵) cannot be plotted on a human-scale axis. Points are projected onto the real curve `y²=x³+7` using a deterministic mapping of the BigInt x-coordinate to a valid real x-value — so every point visually lands **on the curve**. True 256-bit coordinates are displayed in the sidebar (hover for full hex).

**Kangaroo algorithm:** deterministic jump function based on current position modulo jump table. Tame and wild kangaroos hop independently; collision detection checks for position equality.

**BSGS algorithm:** baby steps precomputed into a hash map keyed by x-coordinate. Giant steps subtract `m·G` iteratively, checking the table each step.

---

## 📚 Further Reading

- [Bitcoin's secp256k1 spec — secg.org](https://www.secg.org/sec2-v2.pdf)
- [Elliptic Curve Cryptography — Cloudflare](https://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography/)
- [Pollard's Kangaroo — Wikipedia](https://en.wikipedia.org/wiki/Pollard%27s_kangaroo_algorithm)
- [Baby-step Giant-step — Wikipedia](https://en.wikipedia.org/wiki/Baby-step_giant-step)
- [NIST Post-Quantum Standards](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Shor's Algorithm — Explained](https://en.wikipedia.org/wiki/Shor%27s_algorithm)

---

## 📁 Repository Structure

```
exploration/
└── ecc-explorer/
    ├── index.html      ← The entire demo (open this)
    └── README.md       ← This file
```

---

## 👤 Author

Built by **Aziz** as part of the `exploration` repository — a collection of interactive cryptography and mathematics experiments.

---

## ⚠️ Disclaimer

This demo is for **educational purposes only**. The Bitcoin key generation in the "Bitcoin Keys" tab uses simplified simulation and is **not cryptographically secure**. Never use demo-generated keys to store real funds. Always use a reputable, audited wallet for real Bitcoin.
