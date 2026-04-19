# Fibonacci × secp256k1 — ECC Key Explorer

> An interactive, browser-based tool that derives **secp256k1 elliptic curve key pairs** from the Fibonacci sequence — visualized as a golden spiral, projected onto the real-valued curve, and inspectable in a full data table.

![Demo Screenshot](screenshot.png)
<!-- Replace with an actual screenshot after running the project -->

---

## 📖 Description

This project explores the mathematical relationship between the **Fibonacci sequence** and **Elliptic Curve Cryptography (ECC)** on the `secp256k1` curve — the same curve used by Bitcoin and Ethereum.

Each Fibonacci number `F(n)` is used as a raw private key `k`. The corresponding public key `P = k·G` is computed entirely in the browser using **BigInt arithmetic** and the **double-and-add** scalar multiplication algorithm — no libraries, no backend.

> ⚠️ **Security notice:** Fibonacci numbers are deterministic and cryptographically weak. This tool is strictly for **educational and research purposes**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌀 **Golden Spiral View** | Animated Fibonacci spiral with key points plotted using golden-angle spacing |
| 📈 **Curve View** | Public key X coordinates projected onto the real-valued `y² = x³ + 7` curve |
| 📋 **Table View** | Full hex data table: private key, compressed pubkey, Y parity |
| 🔍 **Detail Panel** | Click any key to inspect: 256-bit private key, X/Y coordinates, compressed & uncompressed encodings |
| 📋 **Copy to Clipboard** | One-click copy for private key, compressed pubkey, uncompressed pubkey |
| ⚙️ **Adjustable Count** | Compute 4–20 Fibonacci keys via slider or number input |
| 🎨 **Color-coded Parity** | Teal = even Y (prefix `02`) · Rose = odd Y (prefix `03`) |
| ⚡ **Pure Browser** | Zero dependencies · Zero network requests · Works offline |

---

## 🚀 How to Run

### Option 1 — Open directly (no server needed)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/fib-ecc-explorer.git

# Navigate into the folder
cd fib-ecc-explorer

# Open in your browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

### Option 2 — Local dev server (recommended for best font loading)

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Then open: http://localhost:8080
```

---

## 📂 Project Structure

```
fib-ecc-explorer/
│── index.html    ← Main HTML page (structure & markup)
│── style.css     ← All styles, CSS variables, responsive layout
│── script.js     ← ECC math + canvas drawing + UI logic
│── README.md     ← This file
│── screenshot.png← (Add your own after running)
```

---

## 🔬 How It Works

### 1. Key Generation
```
F(n) mod n  →  private key k   (256-bit integer)
k · G       →  public key  P   (point on secp256k1)
```

### 2. Scalar Multiplication (Double-and-Add)
The core ECC operation is implemented from scratch using JavaScript `BigInt`:
- **Point addition** using the chord-tangent group law
- **Modular inverse** via Fermat's little theorem (`a^(p-2) mod p`)
- **Double-and-add** loop for efficient scalar multiplication

### 3. Public Key Encoding
- **Compressed** (33 bytes): `02` or `03` prefix + X coordinate
- **Uncompressed** (65 bytes): `04` prefix + X + Y coordinates
- Prefix `02` = even Y, prefix `03` = odd Y

### 4. Visualization
- **Spiral:** Points arranged by golden angle (`2π/φ`) at radius proportional to `√F(n)`
- **Curve:** X coordinates normalized to display range, projected onto `y² = x³ + 7`

---

## 🧮 secp256k1 Parameters

| Parameter | Value |
|---|---|
| **p** (field prime) | `0xFFFFF…FFFFC2F` |
| **n** (group order) | `0xFFFFF…364141` |
| **G** (generator) | `(0x79BE6…, 0x483AD…)` |
| **a** | `0` |
| **b** | `7` |

---

## 🛡️ Privacy & Security

- **No data is stored** — all computation happens locally in your browser
- **No network requests** — the page works fully offline after initial load (font CDN aside)
- **No private key transmission** — keys never leave your machine

---

## 🌐 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 67+  | ✅ Full (BigInt native) |
| Firefox 68+ | ✅ Full |
| Safari 14+  | ✅ Full |
| Edge 79+    | ✅ Full |

---

## 📚 References

- [SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)
- [Bitcoin Wiki — Secp256k1](https://en.bitcoin.it/wiki/Secp256k1)
- [ECDSA Explained](https://cryptobook.nakov.com/digital-signatures/ecdsa-sign-verify-messages)
- [Fibonacci Sequence — Wikipedia](https://en.wikipedia.org/wiki/Fibonacci_sequence)

---

## 👤 Author

**Your Name**
- GitHub: [@your_username](https://github.com/your_username)
- Twitter: [@your_handle](https://twitter.com/your_handle)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

*Built with pure HTML · CSS · JavaScript — no frameworks, no dependencies.*
