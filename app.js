/* Telos — personal operating system for the long game.
   Design principles encoded here (from Charlie's own docs):
   - Track the SYSTEM, not the plate. No calorie/food surveillance.
   - Shame-proof math: no streak to lose; recovery and showing up are what score.
   - A slip never colors the whole day — keystones and slips are decoupled (the weld stays cut).
   - Self-compassion is a performance tool: contempt answers are gently flagged, never punished.
   - The vision is recorded when calm and delivered at the moment of craving.
   - Zero-friction logging: everything auto-saves, there is no submit button to skip. */

const STORE_KEY = "telos-v1";

const DEFAULT_KEYSTONES = [
  { id: "faith",   label: "Bible + prayer" },
  { id: "workout", label: "Workout" },
  { id: "phone",   label: "Phone out of the bedroom" },
  { id: "read",    label: "Read a book" },
];

const DEFAULT_LETTER =
`Charlie — it's you, on a strong day.

Right now the pull feels like the truth. It isn't. You know exactly how this trade goes: fifteen minutes of sugar or scrolling for a foggy brain, aching joints, and a morning of regret. You've run that model a hundred times. The IRR is terrible.

Remember what you're actually building: a man who is present for his future kids the way Dad became present for you. A body that summits mountains. A mind that's sharp at Terawatt because it isn't numbed. Confidence that comes from keeping promises to yourself.

You don't have to be perfect tonight. You have to outlast one wave. The way of escape was built in advance — this screen is it. Go drink the water. Take the walk. I'll see you on the other side, and we'll put another point on the board.`;

const DEFAULT_IDENTITY =
"A man training to honor God with a disciplined body and proper fuel — present, sharp, and confident for the people who will count on me.";

const VERSES = [
  { t: "God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape.", r: "1 Cor 10:13" },
  { t: "There is therefore now no condemnation for those who are in Christ Jesus.", r: "Rom 8:1" },
  { t: "Forgetting what lies behind and straining forward to what lies ahead, I press on toward the goal.", r: "Phil 3:13-14" },
  { t: "For God gave us a spirit not of fear but of power and love and self-control.", r: "2 Tim 1:7" },
  { t: "A man without self-control is like a city broken into and left without walls.", r: "Prov 25:28" },
  { t: "Your body is a temple of the Holy Spirit within you. So glorify God in your body.", r: "1 Cor 6:19-20" },
  { t: "The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.", r: "Gal 5:22-23" },
  { t: "Let us run with endurance the race that is set before us.", r: "Heb 12:1" },
  { t: "His mercies never come to an end; they are new every morning.", r: "Lam 3:22-23" },
  { t: "Count it all joy when you meet trials, for the testing of your faith produces steadfastness.", r: "Jas 1:2-4" },
];

/* ---------- state ---------- */

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (!s.anchor) s.anchor = { label: "", date: "" };
      return s;
    }
  } catch (e) { /* fresh state */ }
  return {
    keystones: DEFAULT_KEYSTONES,
    days: {},      // "YYYY-MM-DD" -> { ks:[ids], slip, voice, note }
    urges: [],     // { ts, outcome: "surfed"|"slipped" }
    vision: { letter: DEFAULT_LETTER, identity: DEFAULT_IDENTITY },
    anchor: { label: "", date: "" },
    reviews: {},
  };
}

function save() { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }

let saveFlashT = null;
function autoSave() {
  save();
  const el = document.getElementById("save-state");
  el.textContent = "Saved";
  el.style.opacity = 1;
  clearTimeout(saveFlashT);
  saveFlashT = setTimeout(() => { el.style.opacity = 0; }, 1200);
}

function localKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayEntry() {
  const key = localKey(new Date());
  if (!S.days[key]) S.days[key] = { ks: [], slip: null, voice: null, note: "" };
  return S.days[key];
}

function dayColor(entry) {
  // Color comes from keystones only. A slip never makes a day red — the weld stays cut.
  if (!entry || !entry.ks) return null;
  const n = entry.ks.length, total = S.keystones.length;
  if (n === total && total > 0) return "g";
  if (n >= 1) return "y";
  return "r";
}

/* ---------- today ---------- */

function initToday() {
  const e = todayEntry();

  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("identity-line").textContent = S.vision.identity;
  renderAnchorChip();

  const week = Math.floor(Date.now() / (7 * 864e5));
  const v = VERSES[week % VERSES.length];
  document.getElementById("verse-text").textContent = "\u201C" + v.t + "\u201D";
  document.getElementById("verse-ref").textContent = "— " + v.r;

  renderRecoveryBanner();
  renderKeystones();
  renderSlipSeg();

  const note = document.getElementById("win-note");
  note.value = e.note || "";
  note.oninput = () => {
    e.note = note.value;
    clearTimeout(note._t);
    note._t = setTimeout(autoSave, 500);
  };
}

function renderAnchorChip() {
  const chip = document.getElementById("anchor-chip");
  if (S.anchor && S.anchor.date && S.anchor.label) {
    const days = Math.ceil((new Date(S.anchor.date + "T00:00:00") - new Date()) / 864e5);
    chip.innerHTML = days >= 0
      ? `<b>${days}</b> days to ${escapeHtml(S.anchor.label)}`
      : escapeHtml(S.anchor.label) + " ✓";
  } else {
    chip.textContent = "";
  }
}

function renderRecoveryBanner() {
  const el = document.getElementById("recovery-banner");
  const yKey = localKey(new Date(Date.now() - 864e5));
  const y = S.days[yKey];
  if (y && (dayColor(y) === "r" || y.slip === "slipped")) {
    el.innerHTML = `Yesterday was a hard one. <strong>Showing up right now is how the recovery rate goes up.</strong> Today is neutral. Never miss twice.`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function renderKeystones() {
  const e = todayEntry();
  const wrap = document.getElementById("keystone-list");
  wrap.innerHTML = "";
  S.keystones.forEach(k => {
    const li = document.createElement("li");
    const checked = e.ks.includes(k.id);
    li.className = checked ? "checked" : "";
    li.innerHTML = `<span class="mark">✓</span><span class="label">${escapeHtml(k.label)}</span>`;
    li.onclick = () => {
      e.ks = checked ? e.ks.filter(x => x !== k.id) : [...e.ks, k.id];
      autoSave();
      renderKeystones();
    };
    wrap.appendChild(li);
  });
}

function renderSlipSeg() {
  const e = todayEntry();
  const seg = document.getElementById("slip-seg");
  seg.querySelectorAll("button").forEach(b => {
    b.classList.toggle("sel", b.dataset.slip === e.slip);
    b.onclick = () => { e.slip = e.slip === b.dataset.slip ? null : b.dataset.slip; autoSave(); renderSlipSeg(); };
  });
  document.getElementById("slip-answer").classList.toggle("hidden", e.slip !== "slipped");

  document.querySelectorAll("#voice-seg button").forEach(b => {
    b.classList.toggle("sel", b.dataset.voice === e.voice);
    b.onclick = () => { e.voice = b.dataset.voice; autoSave(); renderSlipSeg(); };
  });

  const hint = document.getElementById("voice-hint");
  if (e.slip === "slipped" && e.voice === "contempt") {
    hint.textContent = "Noted without judgment. Grace measurably reduces the next spiral — contempt loads it.";
  } else if (e.slip === "slipped" && e.voice === "compassion") {
    hint.textContent = "That's the move. That happened, it's human, next small choice.";
  } else {
    hint.textContent = "";
  }
}

/* ---------- break glass ---------- */

let bgInterval = null;

function startBreakGlass() {
  showView("break");
  document.querySelectorAll(".bg-step").forEach(s => s.classList.add("hidden"));
  document.getElementById("bg-step-1").classList.remove("hidden");
}

function bgStep(n) {
  document.querySelectorAll(".bg-step").forEach(s => s.classList.add("hidden"));
  document.getElementById("bg-step-" + n).classList.remove("hidden");
  if (n === 2) document.getElementById("bg-letter").textContent = S.vision.letter;
  if (n === 3) startTimer(15 * 60);
}

function startTimer(secs) {
  clearInterval(bgInterval);
  const el = document.getElementById("bg-timer");
  const end = Date.now() + secs * 1000;
  const tick = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    const m = Math.floor(left / 60), s = left % 60;
    el.textContent = left > 0 ? `${m}:${String(s).padStart(2, "0")}` : "Wave passed.";
    if (left <= 0) clearInterval(bgInterval);
  };
  tick();
  bgInterval = setInterval(tick, 1000);
}

function urgeOutcome(outcome) {
  clearInterval(bgInterval);
  S.urges.push({ ts: Date.now(), outcome });
  save();
  document.querySelectorAll(".bg-step").forEach(s => s.classList.add("hidden"));
  if (outcome === "surfed") {
    const n = S.urges.filter(u => u.outcome === "surfed").length;
    document.getElementById("bg-urge-count").textContent =
      n + (n === 1 ? " urge defeated" : " urges defeated");
    document.getElementById("bg-surfed").classList.remove("hidden");
  } else {
    const e = todayEntry();
    if (e.slip !== "slipped") { e.slip = "slipped"; save(); }
    document.getElementById("bg-slipped").classList.remove("hidden");
  }
}

/* ---------- board ---------- */

function initStats() {
  const surfed = S.urges.filter(u => u.outcome === "surfed").length;
  document.getElementById("stat-urges").textContent = surfed;

  const keys = Object.keys(S.days).sort();
  document.getElementById("stat-days").textContent = keys.length;

  // Recovery rate: hard days (red OR slipped) followed by a logged next day with >=1 keystone.
  // A hard day only enters the denominator once its "next day" has arrived.
  const todayK = localKey(new Date());
  let hard = 0, recovered = 0;
  keys.forEach(k => {
    const e = S.days[k];
    if ((dayColor(e) === "r" || e.slip === "slipped") && k < todayK) {
      hard++;
      const next = new Date(k + "T12:00:00");
      next.setDate(next.getDate() + 1);
      const ne = S.days[localKey(next)];
      if (ne && ne.ks && ne.ks.length >= 1) recovered++;
    }
  });
  document.getElementById("stat-recovery").textContent =
    hard === 0 ? "100%" : Math.round((recovered / hard) * 100) + "%";

  const slips = keys.map(k => S.days[k]).filter(e => e.slip === "slipped" && e.voice);
  const grace = slips.filter(e => e.voice === "compassion").length;
  document.getElementById("stat-compassion").textContent =
    slips.length === 0 ? "–" : Math.round((grace / slips.length) * 100) + "%";

  renderCalendar();
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  document.getElementById("cal-title").textContent =
    now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cal = document.getElementById("calendar");
  cal.innerHTML = "";
  ["S", "M", "T", "W", "T", "F", "S"].forEach(d => {
    const c = document.createElement("div");
    c.className = "cal-cell dow"; c.textContent = d;
    cal.appendChild(c);
  });
  const first = new Date(year, month, 1).getDay();
  for (let i = 0; i < first; i++) cal.appendChild(document.createElement("div"));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const e = S.days[key];
    const c = document.createElement("div");
    c.className = "cal-cell";
    c.textContent = d;
    const col = dayColor(e);
    if (col) c.classList.add(col);
    if (e && e.ks && e.ks.length >= 1) {
      const prev = new Date(key + "T12:00:00");
      prev.setDate(prev.getDate() - 1);
      const pe = S.days[localKey(prev)];
      if (pe && (dayColor(pe) === "r" || pe.slip === "slipped")) c.classList.add("recovered");
    }
    if (key === localKey(new Date())) c.classList.add("today-cell");
    cal.appendChild(c);
  }
}

/* ---------- more ---------- */

function initMore() {
  const letter = document.getElementById("vision-letter");
  const identity = document.getElementById("vision-identity");
  letter.value = S.vision.letter;
  identity.value = S.vision.identity;
  letter.onchange = () => { S.vision.letter = letter.value; save(); };
  identity.onchange = () => { S.vision.identity = identity.value; save(); };

  const aLabel = document.getElementById("anchor-label");
  const aDate = document.getElementById("anchor-date");
  aLabel.value = S.anchor.label || "";
  aDate.value = S.anchor.date || "";
  aLabel.onchange = () => { S.anchor.label = aLabel.value; save(); };
  aDate.onchange = () => { S.anchor.date = aDate.value; save(); };

  renderKeystoneEditor();
}

function renderKeystoneEditor() {
  const wrap = document.getElementById("keystone-editor");
  wrap.innerHTML = "";
  S.keystones.forEach((k, i) => {
    const row = document.createElement("div");
    row.className = "ks-row";
    const input = document.createElement("input");
    input.type = "text"; input.value = k.label;
    input.onchange = () => { S.keystones[i].label = input.value; save(); };
    const del = document.createElement("button");
    del.className = "ghost-btn"; del.textContent = "✕";
    del.onclick = () => { S.keystones.splice(i, 1); save(); renderKeystoneEditor(); };
    row.append(input, del);
    wrap.appendChild(row);
  });
  const add = document.createElement("button");
  add.className = "ghost-btn"; add.textContent = "+ Add win box";
  add.onclick = () => {
    S.keystones.push({ id: "k" + Date.now(), label: "New win" });
    save();
    renderKeystoneEditor();
  };
  wrap.appendChild(add);
}

/* ---------- review + Jackson ---------- */

function weekStats() {
  const out = { logged: 0, green: 0, hard: 0, recovered: 0, surfed: 0, graceAnswers: 0, slips: 0 };
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const e = S.days[localKey(d)];
    if (!e) continue;
    out.logged++;
    const col = dayColor(e);
    if (col === "g") out.green++;
    if (col === "r" || e.slip === "slipped") {
      out.hard++;
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const ne = S.days[localKey(next)];
      if (ne && ne.ks && ne.ks.length >= 1) out.recovered++;
    }
    if (e.slip === "slipped") {
      out.slips++;
      if (e.voice === "compassion") out.graceAnswers++;
    }
  }
  const weekAgo = Date.now() - 7 * 864e5;
  out.surfed = S.urges.filter(u => u.ts >= weekAgo && u.outcome === "surfed").length;
  return out;
}

function buildJacksonSummary() {
  const w = weekStats();
  const grace = document.getElementById("rev-4").value.trim();
  const trigger = document.getElementById("rev-1").value.trim();

  S.reviews[localKey(new Date())] = {
    r1: trigger,
    r2: document.getElementById("rev-2").value,
    r3: document.getElementById("rev-3").value,
    r4: grace,
  };
  save();

  const lines = [];
  lines.push("Weekly report from the fight, brother 🙏");
  lines.push("");
  lines.push(`Showed up ${w.logged}/7 days. ${w.green} full-green.`);
  lines.push(`Urges I outlasted this week: ${w.surfed}.`);
  if (w.hard > 0) {
    lines.push(`Hard days: ${w.hard}. Turned around by the next day: ${w.recovered}. Never miss twice.`);
  } else {
    lines.push("No hard days this week.");
  }
  if (w.slips > 0) {
    lines.push(`Slips: ${w.slips}, answered with grace instead of contempt: ${w.graceAnswers}. Rom 8:1 — no condemnation.`);
  }
  if (trigger) lines.push(`What set it off this week: ${trigger}`);
  if (grace) lines.push(`Grace for myself: ${grace}`);
  lines.push("");
  lines.push("Still respecting the body He gave me. Keep me honest.");

  const out = document.getElementById("jackson-out");
  out.textContent = lines.join("\n");
  out.classList.remove("hidden");
  document.getElementById("jackson-actions").classList.remove("hidden");
}

function copyJackson() {
  navigator.clipboard.writeText(document.getElementById("jackson-out").textContent)
    .then(() => alert("Copied — paste it to Jackson."));
}

function shareJackson() {
  const text = document.getElementById("jackson-out").textContent;
  if (navigator.share) navigator.share({ text });
  else copyJackson();
}

/* ---------- print ---------- */

function printChart() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let head = "<tr><th class='rowlabel'>Win</th>";
  for (let d = 1; d <= daysInMonth; d++) head += `<th>${d}</th>`;
  head += "</tr>";
  let rows = "";
  S.keystones.forEach(k => {
    rows += `<tr><td class='rowlabel'>${escapeHtml(k.label)}</td>${"<td></td>".repeat(daysInMonth)}</tr>`;
  });
  rows += `<tr><td class='rowlabel'>Urge outlasted (bonus)</td>${"<td></td>".repeat(daysInMonth)}</tr>`;

  document.getElementById("print-area").innerHTML = `
    <h1>TELOS — ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
    <p class="sub">${escapeHtml(S.vision.identity)}</p>
    <table>${head}${rows}</table>
    <p class="sub" style="margin-top:8pt">Fill with a marker each night. A missed box is one box — never miss twice. Recovery is the metric.</p>`;
  window.print();
}

function printCard() {
  document.getElementById("print-area").innerHTML = `
    <div class="wallet">
      <h2>THE WAY OF ESCAPE — built in advance (1 Cor 10:13)</h2>
      <ol>
        <li>Name it: dopamine wave + what-the-hell effect. A glitch, not the truth.</li>
        <li>16 oz water. 10-minute walk. Outlast ONE peak (~15 min).</li>
        <li>If the slip happened: one thing is one thing. Next choice is neutral.</li>
        <li>Friend-voice, not contempt. Contempt loads the next spiral.</li>
        <li>The workout still happens. The kitchen still closes. Nothing else falls.</li>
      </ol>
    </div>`;
  window.print();
}

/* ---------- data ---------- */

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "telos-backup-" + localKey(new Date()) + ".json";
  a.click();
}

function importData(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      S = JSON.parse(reader.result);
      if (!S.anchor) S.anchor = { label: "", date: "" };
      save();
      showView("today");
      alert("Imported.");
    } catch (e) { alert("That file didn't parse."); }
  };
  reader.readAsText(file);
}

/* ---------- navigation ---------- */

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-" + name).classList.remove("hidden");
  document.querySelectorAll("#tabbar button").forEach(b =>
    b.classList.toggle("active", b.dataset.view === name));
  document.getElementById("break-glass-fab").style.display =
    name === "break" ? "none" : "";
  if (name === "today") initToday();
  if (name === "stats") initStats();
  if (name === "more") initMore();
  window.scrollTo(0, 0);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- boot ---------- */

document.querySelectorAll("#tabbar button").forEach(b =>
  b.onclick = () => showView(b.dataset.view));

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

initToday();
