/* ============================================================
   Fibonacci × secp256k1 — ECC Key Explorer
   script.js
   ============================================================ */

// ── secp256k1 curve parameters ────────────────────────────────
const CURVE_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const CURVE_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const GX      = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const GY      = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

// ── Math helpers (BigInt) ─────────────────────────────────────

/** Fast modular exponentiation */
function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

/** Modular inverse via Fermat's little theorem (p is prime) */
function modInv(a, m) {
  return modPow(((a % m) + m) % m, m - 2n, m);
}

/** Elliptic curve point addition on secp256k1 */
function pointAdd(P, Q) {
  if (!P) return Q;
  if (!Q) return P;
  const [x1, y1] = P;
  const [x2, y2] = Q;
  if (x1 === x2 && y1 !== y2) return null; // point at infinity

  let m = (x1 === x2)
    ? (3n * x1 * x1 * modInv(2n * y1, CURVE_P)) % CURVE_P
    : ((y2 - y1) * modInv(x2 - x1, CURVE_P)) % CURVE_P;

  m = ((m % CURVE_P) + CURVE_P) % CURVE_P;
  const x3 = ((m * m - x1 - x2) % CURVE_P + CURVE_P) % CURVE_P;
  const y3 = ((m * (x1 - x3) - y1) % CURVE_P + CURVE_P) % CURVE_P;
  return [x3, y3];
}

/** Scalar multiplication k·G using double-and-add */
function scalarMult(k, P) {
  let result = null;
  let addend = P;
  k = ((k % CURVE_N) + CURVE_N) % CURVE_N;
  while (k > 0n) {
    if (k % 2n === 1n) result = pointAdd(result, addend);
    addend = pointAdd(addend, addend);
    k = k / 2n;
  }
  return result;
}

// ── Fibonacci generator ───────────────────────────────────────

/** Returns the first n Fibonacci numbers as BigInt array */
function getFibs(n) {
  const f = [1n, 1n];
  for (let i = 2; i < n; i++) f.push(f[i - 1] + f[i - 2]);
  return f.slice(0, n);
}

// ── Formatting helpers ────────────────────────────────────────

function toHex64(n)         { return n.toString(16).padStart(64, "0"); }
function shortHex(hex, n=8) { return hex.slice(0, n) + "…" + hex.slice(-6); }
function shortNum(n)        { const s = n.toString(); return s.length > 14 ? s.slice(0,12)+"…" : s; }

// ── Core computation ──────────────────────────────────────────

/** Compute ECC key pairs for the first `count` Fibonacci numbers */
function computeKeys(count) {
  const fibs = getFibs(count);
  const G    = [GX, GY];
  return fibs.map((fib, i) => {
    const priv = fib % CURVE_N;
    const pub  = scalarMult(priv, G);
    const even = pub ? pub[1] % 2n === 0n : null;
    return {
      index      : i + 1,
      fib,
      priv,
      pubX       : pub ? pub[0] : null,
      pubY       : pub ? pub[1] : null,
      even,
      compressed : pub ? ((even ? "02" : "03") + toHex64(pub[0])) : "∞",
      uncompressed: pub ? ("04" + toHex64(pub[0]) + toHex64(pub[1])) : "∞",
    };
  });
}

// ── Canvas drawing ────────────────────────────────────────────

const PHI = 1.6180339887;
let animationId = null;
let currentData = [];
let selectedIdx = null;
let hoveredIdx  = null;
let currentView = "spiral"; // "spiral" | "curve"

/** Draw the animated golden spiral view */
function drawSpiral(canvas, data, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W * 0.5, cy = H * 0.5;
  const maxFib = data.length ? Number(data[data.length - 1].fib) : 1;
  const scale  = Math.min(W, H) * 0.38 / Math.sqrt(maxFib);

  // Background grid
  ctx.strokeStyle = "rgba(201,168,76,0.05)";
  ctx.lineWidth   = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Animated golden spiral
  ctx.beginPath();
  for (let angle = 0; angle < Math.PI * 2 * data.length * 0.5; angle += 0.02) {
    const r = scale * Math.exp(angle * Math.log(PHI) / (Math.PI / 2));
    const x = cx + r * Math.cos(angle + t * 0.3);
    const y = cy + r * Math.sin(angle + t * 0.3);
    angle === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  const grad = ctx.createLinearGradient(cx - 200, cy, cx + 200, cy);
  grad.addColorStop(0, "rgba(201,168,76,0)");
  grad.addColorStop(0.5, "rgba(201,168,76,0.6)");
  grad.addColorStop(1, "rgba(78,205,196,0.4)");
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Fibonacci key points
  data.forEach((d, idx) => {
    const angle  = idx * (Math.PI * 2 / PHI) + t * 0.2;
    const r      = Math.min(scale * Math.sqrt(Number(d.fib)) * 0.7, Math.min(W, H) * 0.44);
    const px     = cx + r * Math.cos(angle);
    const py     = cy + r * Math.sin(angle);
    const isSel  = selectedIdx === idx;
    const isHov  = hoveredIdx  === idx;
    const radius = isSel ? 14 : isHov ? 11 : 7;

    // Glow
    if (isSel || isHov) {
      const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 3);
      glow.addColorStop(0, d.even ? "rgba(78,205,196,0.4)" : "rgba(255,107,157,0.4)");
      glow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(px, py, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();
    }

    // Point fill
    ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2);
    const pg = ctx.createRadialGradient(px - 2, py - 2, 0, px, py, radius);
    pg.addColorStop(0, d.even ? "#a0ffe8" : "#ffb0d0");
    pg.addColorStop(1, d.even ? "#4ECDC4" : "#FF6B9D");
    ctx.fillStyle   = pg;
    ctx.fill();
    ctx.strokeStyle = isSel ? "#E8C96A" : "rgba(255,255,255,0.3)";
    ctx.lineWidth   = isSel ? 2 : 1;
    ctx.stroke();

    // Label
    if (isSel || isHov || idx < 6) {
      ctx.fillStyle = isSel ? "#E8C96A" : "rgba(255,255,255,0.7)";
      ctx.font      = `${isSel ? "bold " : ""}${isSel ? 13 : 11}px 'Courier New'`;
      ctx.fillText(`F(${d.index})`, px + radius + 4, py + 4);
    }
  });

  // Center label
  ctx.fillStyle  = "rgba(201,168,76,0.5)";
  ctx.font       = "11px 'Courier New'";
  ctx.textAlign  = "center";
  ctx.fillText("secp256k1 · G", cx, cy - 8);
  ctx.fillText("Fibonacci Keys", cx, cy + 12);
  ctx.textAlign  = "left";
}

/** Draw the elliptic curve view with projected public key points */
function drawCurve(canvas, data, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx  = W * 0.5, cy = H * 0.5;
  const scl = Math.min(W, H) * 0.36;

  // Grid + axes
  ctx.strokeStyle = "rgba(201,168,76,0.06)"; ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  ctx.strokeStyle = "rgba(201,168,76,0.25)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  // Curve: y² = x³ + 7 (real-valued display approximation)
  [1, -1].forEach(sign => {
    ctx.beginPath();
    let first = true;
    for (let sx = -1.8; sx <= 1.8; sx += 0.003) {
      const val = sx * sx * sx + 7 / (scl * scl);
      if (val < 0) continue;
      const sy = sign * Math.sqrt(val);
      const px = cx + sx * scl, py = cy - sy * scl;
      first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      first = false;
    }
    const cg = ctx.createLinearGradient(0, 0, W, H);
    cg.addColorStop(0, "rgba(78,205,196,0.6)");
    cg.addColorStop(1, "rgba(201,168,76,0.6)");
    ctx.strokeStyle = cg; ctx.lineWidth = 2; ctx.stroke();
  });

  // Public key points
  data.forEach((d, idx) => {
    if (!d.pubX) return;
    const isSel  = selectedIdx === idx;
    const isHov  = hoveredIdx  === idx;
    const norm   = Number((d.pubX * 100000n) / CURVE_P) / 100000;
    const sx     = -1.8 + norm * 3.6;
    const val    = sx * sx * sx + 7 / (scl * scl);
    if (val < 0) return;
    const sy     = (d.even ? -1 : 1) * Math.sqrt(val);
    const px     = cx + sx * scl;
    const py     = cy - sy * scl;
    if (px < 10 || px > W - 10 || py < 10 || py > H - 10) return;

    const radius = isSel ? 14 : isHov ? 11 : 6;

    if (isSel || isHov) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(201,168,76,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, py); ctx.stroke();
      ctx.setLineDash([]);

      const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 4);
      glow.addColorStop(0, d.even ? "rgba(78,205,196,0.5)" : "rgba(255,107,157,0.5)");
      glow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(px, py, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2);
    const pg = ctx.createRadialGradient(px - 2, py - 2, 0, px, py, radius);
    pg.addColorStop(0, d.even ? "#a0ffe8" : "#ffb0d0");
    pg.addColorStop(1, d.even ? "#4ECDC4" : "#FF6B9D");
    ctx.fillStyle   = pg; ctx.fill();
    ctx.strokeStyle = isSel ? "#E8C96A" : "rgba(255,255,255,0.4)";
    ctx.lineWidth   = isSel ? 2 : 1; ctx.stroke();

    if (isSel || isHov) {
      ctx.fillStyle = "#E8C96A";
      ctx.font      = "bold 12px 'Courier New'";
      ctx.fillText(`F(${d.index})`, px + radius + 5, py - 5);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font      = "10px 'Courier New'";
      ctx.fillText(shortHex(toHex64(d.pubX), 5), px + radius + 5, py + 10);
    } else if (idx < 5) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font      = "10px 'Courier New'";
      ctx.fillText(`F(${d.index})`, px + radius + 3, py + 4);
    }
  });

  ctx.fillStyle = "rgba(201,168,76,0.7)";
  ctx.font      = "12px 'Courier New'";
  ctx.fillText("y² ≡ x³ + 7  (mod p)", 14, H - 14);
}

/** Main animation loop */
function startAnimation(canvas) {
  cancelAnimationFrame(animationId);

  function loop(timestamp) {
    const t = timestamp * 0.0008;
    if (currentView === "spiral") drawSpiral(canvas, currentData, t);
    else                          drawCurve(canvas, currentData, t);
    animationId = requestAnimationFrame(loop);
  }

  animationId = requestAnimationFrame(loop);
}

// ── UI helpers ────────────────────────────────────────────────

/** Render the chip bar under the canvas */
function renderChips(data) {
  const container = document.getElementById("chips");
  container.innerHTML = "";
  data.forEach((d, idx) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.dataset.idx = idx;
    chip.innerHTML = `<span class="chip-label" style="color:${d.even ? "#4ECDC4" : "#FF6B9D"}">F(${d.index})</span>
                      <span class="chip-val">${shortNum(d.fib)}</span>`;
    chip.addEventListener("click",       () => selectKey(idx));
    chip.addEventListener("mouseenter",  () => { hoveredIdx = idx; });
    chip.addEventListener("mouseleave",  () => { hoveredIdx = null; });
    container.appendChild(chip);
  });
}

/** Render the data table */
function renderTable(data) {
  const tbody = document.querySelector("#key-table tbody");
  tbody.innerHTML = "";
  data.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.idx = idx;
    tr.innerHTML = `
      <td><span class="badge">F(${d.index})</span></td>
      <td class="mono blue">${shortNum(d.fib)}</td>
      <td class="mono green">${shortHex(toHex64(d.priv), 10)}</td>
      <td class="mono dim">${shortHex(d.compressed, 10)}</td>
      <td><span class="parity-badge" style="color:${d.even?"#4ECDC4":"#FF6B9D"};border-color:${d.even?"#4ECDC455":"#FF6B9D55"}">${d.even?"02 even":"03 odd"}</span></td>`;
    tr.addEventListener("click", () => selectKey(idx));
    tbody.appendChild(tr);
  });
}

/** Show key details in the side panel */
function showDetail(d) {
  if (!d) { document.getElementById("detail-panel").classList.add("hidden"); return; }

  document.getElementById("detail-panel").classList.remove("hidden");
  document.getElementById("detail-title").textContent = `F(${d.index}) — Detail`;

  const set = (id, val) => { document.getElementById(id).textContent = val; };
  set("d-fib",    d.fib.toString());
  set("d-bits",   d.priv.toString(2).length + " bits");
  set("d-priv",   "0x" + toHex64(d.priv));
  set("d-pubx",   "0x" + (d.pubX ? toHex64(d.pubX) : "∞"));
  set("d-puby",   "0x" + (d.pubY ? toHex64(d.pubY) : "∞"));
  set("d-parity", d.even ? "Even → prefix 02" : "Odd → prefix 03");
  set("d-comp",   d.compressed);
  set("d-uncomp", d.uncompressed);

  // Colour the prefix
  const comp = document.getElementById("d-comp");
  comp.innerHTML = `<span style="color:${d.even?"#4ECDC4":"#FF6B9D"}">${d.compressed.slice(0,2)}</span>${d.compressed.slice(2)}`;
}

/** Select / deselect a key by index */
function selectKey(idx) {
  selectedIdx = (selectedIdx === idx) ? null : idx;

  // Highlight chips
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("selected", +c.dataset.idx === selectedIdx);
  });

  // Highlight table rows
  document.querySelectorAll("#key-table tbody tr").forEach(r => {
    r.classList.toggle("selected", +r.dataset.idx === selectedIdx);
  });

  showDetail(selectedIdx !== null ? currentData[selectedIdx] : null);
}

/** Recompute everything and refresh the UI */
function refresh() {
  const count = Math.max(4, Math.min(20, parseInt(document.getElementById("count-input").value) || 12));
  document.getElementById("count-input").value = count;

  // Show loading state
  document.getElementById("compute-btn").textContent = "Computing…";
  document.getElementById("compute-btn").disabled    = true;

  // Defer to let browser paint the loading state
  setTimeout(() => {
    currentData = computeKeys(count);
    selectedIdx = null;
    hoveredIdx  = null;

    renderChips(currentData);
    renderTable(currentData);
    showDetail(null);

    document.getElementById("compute-btn").textContent = "⟳ Compute";
    document.getElementById("compute-btn").disabled    = false;
  }, 30);
}

// ── Copy-to-clipboard helper ──────────────────────────────────
function copyText(elementId, btnId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(btnId);
    const orig = btn.textContent;
    btn.textContent = "✓ Copied";
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("main-canvas");

  // Resize canvas to fit container
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = Math.floor(rect.width);
    canvas.height = Math.floor(rect.width * 0.65);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // View tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;

      // Show/hide canvas vs table panel
      document.getElementById("canvas-section").classList.toggle("hidden", currentView === "table");
      document.getElementById("table-section").classList.toggle("hidden", currentView !== "table");
    });
  });

  // Count slider ↔ input sync
  const slider = document.getElementById("count-slider");
  const input  = document.getElementById("count-input");
  slider.addEventListener("input",  () => { input.value  = slider.value; });
  input.addEventListener("input",   () => { slider.value = input.value;  });

  // Compute button
  document.getElementById("compute-btn").addEventListener("click", refresh);

  // Close detail panel
  document.getElementById("close-detail").addEventListener("click", () => {
    selectedIdx = null;
    document.querySelectorAll(".chip, #key-table tbody tr").forEach(el => el.classList.remove("selected"));
    showDetail(null);
  });

  // Copy buttons
  document.getElementById("copy-priv-btn").addEventListener("click",  () => copyText("d-priv",  "copy-priv-btn"));
  document.getElementById("copy-comp-btn").addEventListener("click",  () => copyText("d-comp",  "copy-comp-btn"));
  document.getElementById("copy-uncomp-btn").addEventListener("click",() => copyText("d-uncomp","copy-uncomp-btn"));

  // Initial render
  refresh();
  startAnimation(canvas);
});
