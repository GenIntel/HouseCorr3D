/* ============================================================
   HouseCorr3D · Morpheus — page interactions
   - hero tetrahedral mesh canvas
   - scroll reveal + animated counters + nav active state
   - bibtex copy + before/after compare slider
   - interactive category-level 3D correspondence demo
   ============================================================ */
(() => {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------
     1 · Nav: stuck shadow + active section
  --------------------------------------------------------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  const navLinks = $$(".nav__links a");
  const sections = navLinks
    .map(a => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        navLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------------------------------------------------------
     2 · Scroll reveal
  --------------------------------------------------------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(el => el.classList.add("is-in"));
  } else {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains("reveal"));
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 6) * 55 + "ms";
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(el => ro.observe(el));
  }

  /* ---------------------------------------------------------
     3 · Animated counters
  --------------------------------------------------------- */
  const counters = $$("[data-count]");
  const fmt = (n) => n >= 1000 ? Math.round(n).toLocaleString("en-US") : Math.round(n).toString();
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    const dur = 1400, t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(target * ease(p)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------------------------------------------------------
     4 · BibTeX copy
  --------------------------------------------------------- */
  const copyBtn = $("#copy-bibtex");
  copyBtn?.addEventListener("click", async () => {
    const text = $("#bibtex").textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const r = document.createRange(); r.selectNode($("#bibtex"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { document.execCommand("copy"); } catch {}
      sel.removeAllRanges();
    }
    copyBtn.classList.add("is-done");
    $(".cite__copy-label", copyBtn).textContent = "Copied";
    setTimeout(() => { copyBtn.classList.remove("is-done"); $(".cite__copy-label", copyBtn).textContent = "Copy"; }, 1600);
  });

  /* ---------------------------------------------------------
     5 · Compare slider (qualitative figure)
  --------------------------------------------------------- */
  const compare = $("#compare");
  if (compare) {
    const range = $(".compare__range", compare);
    const paneB = $(".compare__pane--b", compare);
    const handle = $(".compare__handle", compare);
    const set = (v) => { paneB.style.clipPath = `inset(0 0 0 ${v}%)`; handle.style.left = v + "%"; };
    range?.addEventListener("input", () => set(range.value));
    set(50);
  }

  /* ---------------------------------------------------------
     6 · Hero tetrahedral mesh canvas
  --------------------------------------------------------- */
  (function meshField() {
    const c = $("#mesh-canvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    let w, h, dpr, pts, beams, raf;

    const init = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      const count = Math.min(80, Math.round((innerWidth * innerHeight) / 22000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .12 * dpr, vy: (Math.random() - .5) * .12 * dpr,
        r: (Math.random() * 1.4 + .6) * dpr,
      }));
      beams = [
        { a: 0, b: 0, t: Math.random() * 100 },
        { a: 0, b: 0, t: Math.random() * 100 },
      ];
    };

    const LINK = 150;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = LINK * dpr;
      // faint edges
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            const a = (1 - Math.sqrt(d2) / link) * 0.16;
            ctx.strokeStyle = `rgba(70,90,140,${a})`;
            ctx.lineWidth = dpr * .6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const p of pts) {
        ctx.fillStyle = "rgba(70,90,140,.3)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      // correspondence beams between random node pairs
      beams.forEach(bm => {
        bm.t += .006;
        if (bm.t >= 1 || !pts[bm.a] || !pts[bm.b]) {
          bm.a = (Math.random() * pts.length) | 0;
          bm.b = (Math.random() * pts.length) | 0;
          bm.t = 0;
        }
        const p = pts[bm.a], q = pts[bm.b];
        if (!p || !q) return;
        const g = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
        g.addColorStop(0, "rgba(15,178,167,.0)");
        g.addColorStop(.5, "rgba(15,178,167,.45)");
        g.addColorStop(1, "rgba(229,51,127,.0)");
        ctx.strokeStyle = g; ctx.lineWidth = dpr * 1.2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };

    init();
    if (reduceMotion) { draw(); cancelAnimationFrame(raf); }
    else draw();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { cancelAnimationFrame(raf); init(); reduceMotion ? draw() : draw(); }, 200); });
  })();

  /* ---------------------------------------------------------
     7 · Interactive correspondence demo
  --------------------------------------------------------- */
  (function demo() {
    const svg = $("#demo-svg");
    if (!svg) return;
    const selectEl  = $("#demo-category");
    const amodalBtn = $("#demo-amodal");
    const cycleBtn  = $("#demo-cycle");
    const readout   = $("#demo-readout");

    const QBOX = { x: 40, y: 50, w: 320, h: 300 };
    const TBOX = { x: 440, y: 50, w: 320, h: 300 };
    const BASE_Y = 332;

    /* — palette for keypoints — */
    const C = { cyan: "#35e0d4", magenta: "#ff4d97", amber: "#ffb454", violet: "#9b8cff", mint: "#6ee7a8", coral: "#f9776a" };

    /* — parametric shape generators (built-in fallback) — */
    function mug(cx, p) {
      const topY = BASE_Y - p.h;
      const tHalf = p.topW / 2, bHalf = p.botW / 2;
      const rimRy = p.topW * 0.15, baseRy = p.botW * 0.13;
      const midY = topY + p.h * 0.5;
      const hx = cx + tHalf + p.handle;
      const shapes = [
        { t: "ellipse", a: { cx, cy: BASE_Y, rx: bHalf, ry: baseRy, fill: "rgba(18,26,42,.02)", stroke: "#27314a", "stroke-width": 1.2 } },
        { t: "path", a: { d: `M ${cx - tHalf} ${topY} L ${cx + tHalf} ${topY} L ${cx + bHalf} ${BASE_Y} L ${cx - bHalf} ${BASE_Y} Z`, fill: "rgba(18,26,42,.035)", stroke: "#2c3753", "stroke-width": 1.5 } },
        { t: "path", a: { d: `M ${cx + tHalf - 3} ${topY + p.h * 0.16} C ${hx} ${topY + p.h * 0.18}, ${hx} ${BASE_Y - p.h * 0.22}, ${cx + bHalf - 3} ${BASE_Y - p.h * 0.16}`, fill: "none", stroke: "#2c3753", "stroke-width": 12, "stroke-linecap": "round" } },
        { t: "ellipse", a: { cx, cy: topY, rx: tHalf, ry: rimRy, fill: "#e6ebf2", stroke: "#3a466a", "stroke-width": 1.5 } },
      ];
      const keypoints = [
        { id: "rim_front",  label: "front rim",   color: C.cyan,    x: cx,            y: topY + rimRy },
        { id: "rim_back",   label: "back rim",    color: C.coral,   x: cx,            y: topY - rimRy, amodal: true },
        { id: "lip_left",   label: "left lip",    color: C.amber,   x: cx - tHalf,    y: topY },
        { id: "lip_right",  label: "right lip",   color: C.magenta, x: cx + tHalf,    y: topY },
        { id: "handle_out", label: "handle",      color: C.violet,  x: hx,            y: midY },
        { id: "base_front", label: "base",        color: C.mint,    x: cx,            y: BASE_Y },
      ];
      return { shapes, keypoints };
    }

    function bottle(cx, p) {
      const topY = BASE_Y - p.h;
      const bHalf = p.bodyW / 2, nHalf = p.neckW / 2;
      const capTopY = topY, neckBotY = topY + p.neckH, bodyTopY = neckBotY + p.shoulder;
      const midY = (bodyTopY + BASE_Y) / 2;
      const shapes = [
        { t: "rect", a: { x: cx - bHalf, y: bodyTopY, width: p.bodyW, height: BASE_Y - bodyTopY, rx: 14, fill: "rgba(18,26,42,.035)", stroke: "#2c3753", "stroke-width": 1.5 } },
        { t: "path", a: { d: `M ${cx - bHalf} ${bodyTopY} L ${cx - nHalf} ${neckBotY} L ${cx + nHalf} ${neckBotY} L ${cx + bHalf} ${bodyTopY} Z`, fill: "rgba(18,26,42,.03)", stroke: "#2c3753", "stroke-width": 1.5 } },
        { t: "rect", a: { x: cx - nHalf, y: capTopY + 12, width: p.neckW, height: neckBotY - capTopY - 12, fill: "rgba(18,26,42,.03)", stroke: "#2c3753", "stroke-width": 1.5 } },
        { t: "rect", a: { x: cx - nHalf - 2, y: capTopY, width: p.neckW + 4, height: 14, rx: 3, fill: "rgba(18,26,42,.05)", stroke: "#3a466a", "stroke-width": 1.5 } },
      ];
      const keypoints = [
        { id: "cap_top",      label: "cap",          color: C.cyan,    x: cx,         y: capTopY + 4 },
        { id: "shoulder_l",   label: "left shoulder",color: C.amber,   x: cx - bHalf, y: bodyTopY },
        { id: "shoulder_r",   label: "right shoulder",color: C.magenta,x: cx + bHalf, y: bodyTopY },
        { id: "label_center", label: "label",        color: C.mint,    x: cx,         y: midY },
        { id: "base_front",   label: "base",         color: C.violet,  x: cx,         y: BASE_Y - 4 },
        { id: "seam_back",    label: "back seam",    color: C.coral,   x: cx,         y: bodyTopY + 22, amodal: true },
      ];
      return { shapes, keypoints };
    }

    const BUILTIN = {
      mug:    { name: "Mug",    q: () => mug(QBOX.x + QBOX.w / 2, { h: 150, topW: 116, botW: 92, handle: 44 }),
                                t: () => mug(TBOX.x + TBOX.w / 2, { h: 116, topW: 150, botW: 122, handle: 58 }) },
      bottle: { name: "Bottle", q: () => bottle(QBOX.x + QBOX.w / 2, { h: 232, bodyW: 96,  neckW: 30, neckH: 46, shoulder: 30 }),
                                t: () => bottle(TBOX.x + TBOX.w / 2, { h: 188, bodyW: 120, neckW: 42, neckH: 32, shoulder: 42 }) },
    };

    /* — optional image-based pairs from JSON — */
    let CATS = Object.entries(BUILTIN).map(([k, v]) => ({ key: k, name: v.name, mode: "svg", build: v }));

    /* — svg helpers — */
    const el = (tag, attrs = {}, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };

    let state = { idx: 0, selected: null, showAll: false, amodal: false };
    let kpIndex = {}; // id -> { label, color, amodal, q:{x,y}, t:{x,y}, groups:[] }
    let corrLayer, kpLayer;

    /* — place an image instance into its box (contain-fit) — */
    function fitImage(box, natW, natH) {
      const s = Math.min(box.w / natW, box.h / natH);
      return { s, ox: box.x + (box.w - natW * s) / 2, oy: box.y + (box.h - natH * s) / 2 };
    }

    function clear() { while (svg.firstChild) svg.removeChild(svg.firstChild); }

    function drawShapes(group, shapes) {
      shapes.forEach(s => el(s.t, s.a, group));
    }

    function drawWire(group, kps) {
      // light "mesh" web connecting visible keypoints
      const v = kps.filter(k => !k.amodal);
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length];
        el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "obj-wire" }, group);
      }
      if (v.length > 3) el("line", { x1: v[0].x, y1: v[0].y, x2: v[2].x, y2: v[2].y, class: "obj-wire" }, group);
    }

    function drawKeypoint(side, kp) {
      const g = el("g", { class: "kp" + (kp.amodal ? " is-amodal" : ""), tabindex: "0", role: "button",
        "aria-label": `${kp.label} (${side === "q" ? "query" : "target"})` }, kpLayer);
      g.style.color = kp.color;
      el("circle", { class: "kp__ring", cx: kp.x, cy: kp.y, r: 8 }, g);
      el("circle", { class: "kp__dot", cx: kp.x, cy: kp.y, r: 5.5, fill: kp.color }, g);
      el("circle", { class: "kp__hit", cx: kp.x, cy: kp.y, r: 16 }, g);
      const act = () => select(kp.id);
      g.addEventListener("click", act);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      if (!kpIndex[kp.id]) kpIndex[kp.id] = { label: kp.label, color: kp.color, amodal: !!kp.amodal, groups: [] };
      kpIndex[kp.id][side] = { x: kp.x, y: kp.y };
      kpIndex[kp.id].groups.push(g);
      g.style.display = (kp.amodal && !state.amodal) ? "none" : "";
    }

    function render() {
      clear();
      kpIndex = {};
      const cat = CATS[state.idx];

      // baseline
      el("line", { x1: 20, y1: BASE_Y + 1, x2: 780, y2: BASE_Y + 1, stroke: "#161d2b", "stroke-width": 1 }, svg);
      el("text", { x: QBOX.x, y: 40, class: "kp-label", fill: "#59647a" }, svg).textContent = "instance A";
      el("text", { x: TBOX.x, y: 40, class: "kp-label", fill: "#59647a" }, svg).textContent = "instance B";

      const qGroup = el("g", {}, svg), tGroup = el("g", {}, svg);
      corrLayer = el("g", {}, svg);
      kpLayer = el("g", {}, svg);

      let qData, tData;
      if (cat.mode === "image") {
        const qf = fitImage(QBOX, cat.q.w, cat.q.h), tf = fitImage(TBOX, cat.t.w, cat.t.h);
        el("image", { href: cat.q.image, x: qf.ox, y: qf.oy, width: cat.q.w * qf.s, height: cat.q.h * qf.s, rx: 8 }, qGroup);
        el("image", { href: cat.t.image, x: tf.ox, y: tf.oy, width: cat.t.w * tf.s, height: cat.t.h * tf.s, rx: 8 }, tGroup);
        qData = { keypoints: cat.q.keypoints.map(k => ({ ...k, x: qf.ox + k.x * qf.s, y: qf.oy + k.y * qf.s })) };
        tData = { keypoints: cat.t.keypoints.map(k => ({ ...k, x: tf.ox + k.x * tf.s, y: tf.oy + k.y * tf.s })) };
      } else {
        qData = cat.build.q(); tData = cat.build.t();
        drawShapes(qGroup, qData.shapes); drawShapes(tGroup, tData.shapes);
        drawWire(qGroup, qData.keypoints); drawWire(tGroup, tData.keypoints);
      }
      qData.keypoints.forEach(k => drawKeypoint("q", k));
      tData.keypoints.forEach(k => drawKeypoint("t", k));

      // default selection: first visible keypoint
      const firstVisible = Object.keys(kpIndex).find(id => !kpIndex[id].amodal || state.amodal);
      state.selected = firstVisible || null;
      state.showAll = false;
      paint();
    }

    function curve(a, b) {
      const mx = (a.x + b.x) / 2, lift = Math.min(70, Math.abs(b.x - a.x) * 0.22 + 28);
      return `M ${a.x} ${a.y} C ${mx} ${a.y - lift}, ${mx} ${b.y - lift}, ${b.x} ${b.y}`;
    }

    function drawCorr(id, faint) {
      const e = kpIndex[id];
      if (!e || !e.q || !e.t) return;
      if (e.amodal && !state.amodal) return;
      el("path", { d: curve(e.q, e.t), class: "corr-line", stroke: e.color, opacity: faint ? 0.55 : 1,
        "stroke-dasharray": e.amodal ? "5 5" : "none" }, corrLayer);
    }

    function label(id) {
      const e = kpIndex[id];
      if (!e || !e.t) return;
      const g = el("g", {}, corrLayer);
      const text = e.label + (e.amodal ? " · amodal" : "");
      const wpx = text.length * 6.4 + 18;
      el("rect", { class: "kp-label__bg", x: e.t.x - wpx / 2, y: e.t.y - 30, width: wpx, height: 19, rx: 5 }, g);
      const t = el("text", { class: "kp-label", x: e.t.x, y: e.t.y - 16.5, "text-anchor": "middle" }, g);
      t.textContent = text;
    }

    function paint() {
      while (corrLayer.firstChild) corrLayer.removeChild(corrLayer.firstChild);
      Object.values(kpIndex).forEach(e => e.groups.forEach(g => g.classList.remove("is-sel")));

      if (state.showAll) {
        Object.keys(kpIndex).forEach(id => {
          if (kpIndex[id].amodal && !state.amodal) return;
          drawCorr(id, true);
          kpIndex[id].groups.forEach(g => g.classList.add("is-sel"));
        });
        readout.innerHTML = `Showing <b>all ${countVisible()} correspondences</b> at once — matching colors link the same semantic part across instances.`;
      } else if (state.selected && kpIndex[state.selected]) {
        const e = kpIndex[state.selected];
        drawCorr(state.selected, false);
        label(state.selected);
        e.groups.forEach(g => g.classList.add("is-sel"));
        readout.innerHTML = `<b>${e.label}</b> — same semantic point transferred from <strong>query</strong> to <strong>target</strong> in 3D${e.amodal ? " (occluded · amodal)" : ""}.`;
      } else {
        readout.innerHTML = `Select a keypoint on the <strong>query</strong> (left) to transfer it onto the <strong>target</strong>.`;
      }
    }

    const countVisible = () => Object.values(kpIndex).filter(e => !e.amodal || state.amodal).length;

    function select(id) { state.showAll = false; state.selected = id; paint(); }

    /* — controls — */
    selectEl.addEventListener("change", () => { state.idx = +selectEl.value; render(); });
    amodalBtn.addEventListener("click", () => {
      state.amodal = !state.amodal;
      amodalBtn.setAttribute("aria-pressed", String(state.amodal));
      Object.values(kpIndex).forEach(e => { if (e.amodal) e.groups.forEach(g => g.style.display = state.amodal ? "" : "none"); });
      if (!state.amodal && state.selected && kpIndex[state.selected]?.amodal) {
        state.selected = Object.keys(kpIndex).find(id => !kpIndex[id].amodal);
      }
      paint();
    });
    cycleBtn.addEventListener("click", () => {
      state.showAll = !state.showAll;
      cycleBtn.textContent = state.showAll ? "Single ◆" : "Cycle all ▶";
      paint();
    });

    /* — populate selector & init — */
    function populate() {
      selectEl.innerHTML = "";
      CATS.forEach((c, i) => { const o = document.createElement("option"); o.value = i; o.textContent = c.name; selectEl.appendChild(o); });
      state.idx = 0;
      render();
    }

    // try to load user-provided image pairs; fall back to built-in SVG
    fetch("assets/demo/pairs.json", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length) {
          const imgCats = data
            .filter(d => d && d.query && d.target && d.query.image && d.target.image)
            .map(d => ({ key: d.category || d.name, name: d.name || d.category || "pair", mode: "image", q: d.query, t: d.target }));
          if (imgCats.length) CATS = imgCats;
        }
      })
      .catch(() => {})
      .finally(populate);
  })();
})();
