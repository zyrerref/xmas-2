// ===== Helpers =====
const $ = (id) => document.getElementById(id);

// Base64 (UTF-8 safe)
function encodeData(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeData(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

const state = {
  snowOn: true,
  musicOn: false,
  revealed: false,
  theme: localStorage.getItem("xmas_theme") || "dark"
};

// ===== Elements =====
const toName = $("toName");
const fromName = $("fromName");
const msg = $("msg");
const note = $("note");
const count = $("count");
const shareLink = $("shareLink");

const revealBtn = $("revealBtn");
const confettiBtn = $("confettiBtn");
const snowBtn = $("snowBtn");
const musicBtn = $("musicBtn");
const copyBtn = $("copyBtn");
const nativeShareBtn = $("nativeShareBtn");
const resetBtn = $("resetBtn");
const themeBtn = $("themeBtn");

// Music elements (must exist in HTML)
const player = $("player");
const songSelect = $("songSelect");

// ===== FX Canvas =====
const canvas = $("fx");
const ctx = canvas.getContext("2d");
let W = 0, H = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ===== Snow =====
let snow = [];
function initSnow() {
  snow = Array.from({ length: 130 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 3,
    s: 0.6 + Math.random() * 1.6,
    d: Math.random() * Math.PI * 2
  }));
}
initSnow();

function drawSnow() {
  for (const f of snow) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
  }
}

function updateSnow() {
  for (const f of snow) {
    f.y += f.s;
    f.x += Math.sin(f.d) * 0.7;
    f.d += 0.02;

    if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
    if (f.x > W + 10) f.x = -10;
    if (f.x < -10) f.x = W + 10;
  }
}

// ===== Confetti =====
let confetti = [];
function burstConfetti(n = 180) {
  const colors = ["#ffdf6e", "#7cf0ff", "#ff6ea6", "#93ff8a", "#ffffff"];
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: W / 2 + (Math.random() * 60 - 30),
      y: H / 3 + (Math.random() * 60 - 30),
      vx: (Math.random() * 8 - 4),
      vy: (Math.random() * -10 - 4),
      g: 0.18 + Math.random() * 0.12,
      r: 2 + Math.random() * 4,
      a: 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() * 0.2 - 0.1),
      c: colors[(Math.random() * colors.length) | 0]
    });
  }
}

function drawConfetti() {
  for (const p of confetti) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = p.a;
    ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
    ctx.restore();
  }
}

function updateConfetti() {
  confetti = confetti.filter(p => p.a > 0.03 && p.y < H + 40);
  for (const p of confetti) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.a *= 0.988;
  }
}

// ===== Render Loop =====
function tick() {
  ctx.clearRect(0, 0, W, H);

  if (state.snowOn) {
    updateSnow();
    drawSnow();
  }

  updateConfetti();
  drawConfetti();

  requestAnimationFrame(tick);
}
tick();

// ===== Theme / Snow =====
function setSnow(on) {
  state.snowOn = on;
  snowBtn.textContent = on ? "❄️ Snow: ON" : "❄️ Snow: OFF";
  updateShareLink();
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  state.theme = t;
  localStorage.setItem("xmas_theme", t);
  updateShareLink();
}

function toggleTheme() {
  const next = (document.documentElement.dataset.theme === "light") ? "dark" : "light";
  setTheme(next);
}

// ===== Music (3 songs) =====
// Your files must exist: /audio/song1.mp3 /audio/song2.mp3 /audio/song3.mp3
function setSong(file) {
  const wasPlaying = !player.paused && !player.ended;

  player.src = `audio/${file}`;
  player.load();

  if (state.musicOn || wasPlaying) {
    player.play().catch(() => {});
  }

  updateShareLink();
}

function setMusic(on) {
  state.musicOn = on;
  musicBtn.textContent = on ? "🔊 Music: ON" : "🔊 Music: OFF";

  if (on) {
    player.play().catch(() => {});
  } else {
    player.pause();
  }

  updateShareLink();
}

// ===== Greeting Preview =====
function buildGreeting() {
  const to = (toName.value || "").trim();
  const from = (fromName.value || "").trim();
  const text = (msg.value || "").trim();

  const base = text.length
    ? text
    : "Wishing you peace, joy, and blessings this season. 🎄✨";

  let out = "";
  if (to) out += `Hi ${to}!\n\n`;
  out += `${base}\n\n`;
  out += `Merry Christmas and Happy New Year! 🥳🎆`;
  if (from) out += `\n\n— ${from}`;

  return out;
}

function updatePreview() {
  count.textContent = `${msg.value.length}/140`;
  note.textContent = buildGreeting();
  updateShareLink();
}

// ===== Base64 Share Link (Option 1) =====
function updateShareLink() {
  // If songSelect/player not in HTML yet, don't crash
  const songVal = songSelect ? songSelect.value : "song1.mp3";

  const data = {
    to: toName.value.trim(),
    from: fromName.value.trim(),
    msg: msg.value.trim(),
    theme: document.documentElement.dataset.theme || "dark",
    snow: state.snowOn ? 1 : 0,
    song: songVal
  };

  const encoded = encodeData(data);
  shareLink.value = `${location.origin}${location.pathname}?d=${encoded}`;
}

function readFromURL() {
  const p = new URLSearchParams(location.search);
  const d = p.get("d");
  if (!d) return;

  try {
    const data = decodeData(d);

    toName.value = data.to || "";
    fromName.value = data.from || "";
    msg.value = data.msg || "";

    if (data.theme === "light" || data.theme === "dark") setTheme(data.theme);
    if (data.snow === 0 || data.snow === 1) setSnow(data.snow === 1);

    // song from shared link
    if (songSelect && data.song) {
      songSelect.value = data.song;
      setSong(data.song);
    }
  } catch (e) {
    console.warn("Invalid share data in URL:", e);
  }
}

// ===== Surprise Reveal =====
function reveal() {
  if (state.revealed) return;

  state.revealed = true;
  burstConfetti(220);
  $("subtitle").textContent = "Boom. Your greeting is ready to send. 😄";
  revealBtn.textContent = "✅ Revealed";
  revealBtn.disabled = true;
}

// ===== Events =====
[toName, fromName, msg].forEach(el => el.addEventListener("input", updatePreview));

revealBtn.addEventListener("click", () => {
  reveal();
  burstConfetti(140);
});

confettiBtn.addEventListener("click", () => burstConfetti(180));

snowBtn.addEventListener("click", () => setSnow(!state.snowOn));

musicBtn.addEventListener("click", () => setMusic(!state.musicOn));

if (songSelect) {
  songSelect.addEventListener("change", () => setSong(songSelect.value));
}

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    copyBtn.textContent = "Copied ✅";
    setTimeout(() => (copyBtn.textContent = "Copy Link"), 1100);
  } catch {
    shareLink.select();
    document.execCommand("copy");
    copyBtn.textContent = "Copied ✅";
    setTimeout(() => (copyBtn.textContent = "Copy Link"), 1100);
  }
});

nativeShareBtn.addEventListener("click", async () => {
  const text = buildGreeting();
  const url = shareLink.value;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Merry Christmas & Happy New Year!",
        text,
        url
      });
    } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      nativeShareBtn.textContent = "Link Copied ✅";
      setTimeout(() => (nativeShareBtn.textContent = "📤 Share"), 1100);
    } catch {}
  }
});

resetBtn.addEventListener("click", () => {
  toName.value = "";
  fromName.value = "";
  msg.value = "";

  state.revealed = false;
  revealBtn.disabled = false;
  revealBtn.textContent = "✨ Reveal Surprise";
  $("subtitle").textContent = "Make it personal, then share it.";

  burstConfetti(60);

  // Stop music
  if (player) {
    player.pause();
    player.currentTime = 0;
  }
  state.musicOn = false;
  musicBtn.textContent = "🔊 Music: OFF";

  // reset snow/theme stays as user preference; remove URL param
  history.replaceState({}, "", location.pathname);

  updatePreview();
});

themeBtn.addEventListener("click", toggleTheme);

// ===== Init =====
setTheme(state.theme);
$("year").textContent = `© ${new Date().getFullYear()}`;

readFromURL();

// Default song if nothing came from URL
if (songSelect && player && !player.src) {
  setSong(songSelect.value || "song1.mp3");
}

updatePreview();
