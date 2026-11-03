/*
 * The home page's scene, under the hero: mRNAs swimming like tadpoles from
 * 5' to 3', each wearing its 5' cap as a red cap, carrying a messenger bag
 * in one of three colours (they are messengers, after all) and trailing its
 * poly(A) tail. As they swim, the tails shorten bead by bead (deadenylation), and an
 * mRNA whose tail is gone fades away. Four helpers wander among them, and
 * one that a suitable tail passes close by throws the base it carries onto
 * its end, so it is plain that they add: TENT4A and TENT4B top up a short
 * tail with a few A's and a G (mixed tailing), and a tail ending in a G
 * shortens no further for a while, as the deadenylase stalls at it; TUT4 and
 * TUT7 add U's to a tail that is nearly gone (uridylation), and soon a
 * Pac-Man races in from the left, gobbles the tail from its 3' end and
 * shoots off to the right, leaving the mRNA to fade. A tail a helper is
 * reaching for loses no beads, so no helper is seen near a tail as it
 * shrinks. Two helpers that happen to linger side by side give each other a
 * high five, and one left outside by a narrowing window dashes back in,
 * startled. Every twenty to thirty seconds a pair of scissors (an
 * endoribonuclease) swims in from the right, against the stream, and snips
 * the longest-tailed mRNA no helper is at between its head and its tail:
 * the two pieces drift apart and fade away.
 *
 * They swim in a sea: water under a slowly rippling surface, deepening
 * towards the bottom, with a few bubbles rising through it.
 * Its two colours are --sea and --sea-deep in css/main.scss, read here.
 * The water below the surface's reach is the canvas's own CSS background,
 * painted once; each frame draws the water only in the band at the top,
 * --sea-top deep, where the surface ripples, with the same gradient.
 *
 * Drawn in vector on <canvas class="scene"> (_includes/hero.html) at the
 * device's pixel ratio, about 30 frames a second (20, or 12, on a device that
 * cannot keep up), in the site's colours. It
 * draws nothing while the scene is out of view or the tab is hidden; under
 * prefers-reduced-motion it shows one still frame instead, and follows the
 * setting if it changes. The scene starts the same on every visit.
 *
 * Loaded with defer from _includes/hero.html, only on the page with a hero.
 */
(() => {
  'use strict';

  const canvas = document.querySelector('canvas.scene');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const INK = '#222224', RED = '#ca2017', GREY = '#3d3d3d';
  const PAC = '#7cb342';                                // the Pac-Man, a soft lime
  const STRAND = '#9fb0b7', A_EDGE = '#9aa3a8', A_TEXT = '#5e676c', LABEL = '#4f6168';
  // Messenger bags in three canvas colours: body, flap and strap.
  const BAGS = [
    { body: '#e8be7c', flap: '#c98f3d', strap: '#8c6326' },  // tan
    { body: '#a9bd5c', flap: '#7f9634', strap: '#5b6d22' },  // olive green
    { body: '#5f7fae', flap: '#3f5f8f', strap: '#2f4870' }   // navy
  ];
  let sea = '#dce9ee', seaDeep = '#bcd3dc', seaTop = 20, water = null;
  const FACE = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';

  // A fixed-seed generator, so the scene starts the same on every visit.
  let seed = 20251119;
  function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const between = (a, b) => a + (b - a) * rand();

  // Sizes are drawn for a 150px-high scene and scaled by u for others, but
  // no smaller than 0.85 of that, so a phone's shorter scene keeps them legible.
  let W = 0, H = 0, u = 1, t = 0;
  const LANES = [0.3, 0.55, 0.8];
  const tadpoles = [], crumbs = [], rings = [], claps = [], helpers = [], flights = [], eaters = [], cutters = [], bubbles = [];
  // When the next scissors come: the first some four seconds after the page
  // opens, as the scene opens eight seconds in.
  let snipIn = 12;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; u = Math.max(0.85, H / 150);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(canvas);
    sea = cs.getPropertyValue('--sea').trim() || sea;
    seaDeep = cs.getPropertyValue('--sea-deep').trim() || seaDeep;
    seaTop = parseFloat(cs.getPropertyValue('--sea-top')) || seaTop;
    // the CSS background's gradient, from the canvas's top edge to its floor
    water = ctx.createLinearGradient(0, 0, 0, H);
    water.addColorStop(0, sea);
    water.addColorStop(1, seaDeep);
  }

  // ---- The sea ---------------------------------------------------------------
  // The surface: two slow ripples over a level about 12px down.
  const surface = (x) => 12 * u + 2.6 * u * Math.sin(x / (70 * u) + t * 0.9) + 1.3 * u * Math.sin(x / (31 * u) - t * 1.3);

  function bubble(atFloor) {
    return { x: between(0, W), y: atFloor ? H + between(2, 30) * u : between(0.3, 1) * H,
             r: between(1.4, 3.2), v: between(7, 13), phase: between(0, 6) };
  }

  function stepBubbles(dt) {
    const want = Math.max(4, Math.round(W / 160));
    while (bubbles.length < want) bubbles.push(bubble(false));
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.v * u * dt;
      b.x += 6 * u * Math.cos(t * 1.7 + b.phase) * dt;
      if (b.y < surface(b.x) + 3 * u) bubbles[i] = bubble(true);
    }
  }

  // Only the water between the surface and seaTop: the CSS background
  // (css/main.scss) is the rest, so there is no need to fill the whole scene
  // every frame. The surface never dips below seaTop (at most 16u, u <= 1).
  // The band reaches 2px into the background, in the same colours, so no
  // hairline shows between them where a fractional pixel ratio rounds the
  // two edges differently.
  function drawSea() {
    ctx.beginPath();
    ctx.moveTo(0, seaTop + 2);
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, surface(x));
    ctx.lineTo(W + 8, seaTop + 2);
    ctx.closePath();
    ctx.fillStyle = water;
    ctx.fill();
    ctx.beginPath();                                    // a sheen along the surface
    for (let x = 0; x <= W + 8; x += 8) { const y = surface(x); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.lineWidth = 1.6 * u; ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.stroke();
    ctx.lineWidth = 1 * u; ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r * u, 0, 2 * Math.PI); ctx.stroke(); }
  }

  // ---- The mRNAs ---------------------------------------------------------------
  // x is the head's centre; the tail streams out to its left, one bead per base.
  // Once the scissors have cut it (below), the tail lags behind the head and
  // sinks: it is drawn from backX and backY.

  const CUT = 16.3;                                     // where the scissors cut, behind the head's centre
  const headY = (p) => LANES[p.lane] * H + 2.2 * u * Math.sin(t * 1.3 + p.phase);
  const backX = (p) => (p.cut ? p.cut.x : p.x);
  const backY = (p) => headY(p) + (p.cut ? p.cut.sink : 0);
  const spacing = (p) => 10.3 * p.s * u;
  function beadAt(p, i) {
    const s = p.s * u;
    const amp = Math.min(1, (i + 1) / 5) * 5 * s;
    return { x: backX(p) - 23 * s - i * spacing(p), y: backY(p) + amp * Math.sin(t * 3.2 + p.phase - i * 0.55) };
  }
  const tailEnd = (p) => beadAt(p, Math.max(0, p.tail.length - 1));

  function tadpole(x, lane, length) {
    const s = between(0.86, 1.06);
    return {
      x, lane, s, v: between(16, 25) * s, phase: between(0, 2 * Math.PI), bag: BAGS[Math.floor(between(0, BAGS.length))],
      tail: Array(length).fill('A'), nibble: between(2.5, 5.5),
      stalled: false, marked: false, doom: 0, held: false, cut: null, fade: 1, dying: false, gone: false
    };
  }

  // The deadenylase takes the last base: an A at once, a G only after a pause.
  function nibble(p) {
    const last = p.tail[p.tail.length - 1];
    if (!last) { p.dying = true; return; }
    if (last === 'G' && !p.stalled) { p.stalled = true; p.nibble = between(6, 9); return; }
    p.stalled = false;
    const at = tailEnd(p);
    p.tail.pop();
    crumbs.push({ x: at.x, y: at.y, base: last, s: p.s, vx: between(-7, -2), vy: between(6, 12), life: 1 });
    // A tail of five or fewer goes more slowly, so the TUTs have time to find
    // it; less so in a wide scene, where more tails come their way.
    p.nibble = between(2.8, 5.2) * (p.tail.length <= 5 ? 1.5 - 0.5 * wide() : 1);
    if (!p.tail.length) p.dying = true;
  }

  const wanted = () => Math.max(3, Math.min(6, Math.round(W / 220)));

  // How wide the scene is, 0 up to 1000px across and 1 from 1400px. Wider,
  // with more tails coming by, the TUTs would mark too many, so they are held
  // back a little: see nibble, reach and deliver.
  const wide = () => Math.min(1, Math.max(0, (W / u - 1000) / 400));

  // A newcomer enters at the left, in the lane with the most room. In a
  // narrow scene it comes with a shorter tail, which would otherwise cross
  // the whole width before it got short enough for the TUTs.
  function spawn() {
    let best = -1, room = -Infinity;
    LANES.forEach((_, lane) => {
      const inLane = tadpoles.filter((p) => p.lane === lane);
      const r = inLane.length ? Math.min(...inLane.map((p) => tailEnd(p).x)) : Infinity;
      if (r > room) { room = r; best = lane; }
    });
    if (room < 60 * u) return;
    tadpoles.push(tadpole(-24 * u, best, Math.round(between(8, 14) * Math.min(1, (W + 400) / 1300))));
  }

  // ---- The helpers -------------------------------------------------------------
  // Four little enzymes, two of each sort: TENT4A and TENT4B (grey) add A's
  // and a G, TUT4 and TUT7 (red) add U's. They wander at random, and only a
  // tail that comes their way draws one aside: within reach of a tail it can
  // serve, a helper leans towards it, unhurried, and throws its base once
  // close.

  const tent = (kind) => kind.startsWith('TENT');
  // How near a tail must come to be noticed. The TUTs notice from further
  // off, as the short tails they serve are few and soon gone, though less
  // far in a wide scene.
  const reach = (h) => (tent(h.kind) ? 90 : 130 - 20 * wide()) * u;

  function helper(kind, at) {
    return { kind, x: at * W, y: between(0.35, 0.65) * H, heading: between(0, 2 * Math.PI),
             face: 1, target: null, cool: between(1, 4), phase: between(0, 6),
             // the face: where the eyes look (-1 left to 1 right), and its moods
             look: 0, lookGoal: 0, lookHold: 0, nextLook: between(2, 7),
             blinks: [], nextBlink: between(0.5, 4), wink: 0, happy: 0,
             surprise: 0, dash: null,
             // where it has been loitering, and since when; and its high fives
             rest: null, restless: between(4, 6), five: null, fiveCool: between(0, 10), near: new Map() };
  }

  // Where the next base goes: one bead past the end of the tail.
  function attach(p) {
    const end = tailEnd(p);
    return { x: end.x - spacing(p), y: end.y };
  }

  function serves(h, p) {
    const n = p.tail.length;
    return tent(h.kind) ? n >= 2 && n <= 7 && p.tail[n - 1] !== 'G' : n >= 1 && n <= 5;
  }

  function notice(h) {
    let best = null, d = reach(h);
    for (const p of tadpoles) {
      if (p.dying || p.marked || p.held || !serves(h, p)) continue;
      if (helpers.some((o) => o !== h && o.target === p)) continue;
      const at = attach(p);
      if (at.x < 0.05 * W || at.x > 0.88 * W) continue;
      const dd = Math.hypot(at.x - h.x, at.y - h.y);
      if (dd < d) { d = dd; best = p; }
    }
    return best;
  }

  // Close enough, a helper throws its base: it flies to the end of the tail,
  // and the bases join the tail when it lands (step, below).
  function deliver(h) {
    const p = h.target;
    let bases = ['U', 'U'];
    if (tent(h.kind)) {
      bases = ['A', 'A', 'G', 'A'].slice(0, Math.round(between(2, 4)));
      if (bases.length === 2) bases[1] = 'G';
    }
    flights.push({ p, kind: h.kind, bases, x0: h.x + 17 * u * h.face, y0: h.y + 2 * u, k: 0, x: 0, y: 0 });
    p.held = true;
    h.target = null;
    h.cool = tent(h.kind) ? between(5, 10) : between(3, 6) * (1 + 0.6 * wide());
    h.happy = 0.9;                                      // pleased with itself: smiling eyes and a hop
  }

  function land(f) {
    const p = f.p, end = tailEnd(p);
    p.tail.push(...f.bases);
    p.held = false;
    if (tent(f.kind)) { p.stalled = false; p.nibble = Math.max(p.nibble, 2.5); }
    else { p.marked = true; p.doom = between(0.3, 1); }     // the Pac-Man is on its way
    rings.push({ x: end.x - spacing(p), y: end.y, life: 1, color: tent(f.kind) ? GREY : RED });
  }

  // The face, between the helper's errands: now and then it blinks (once,
  // or twice running), winks one eye, or glances to one side for a moment;
  // otherwise it looks where it is going, or at the tail it has noticed.
  function stepFace(h, dt) {
    if (h.blinks.length) { h.blinks[0] -= dt; if (h.blinks[0] <= 0) h.blinks.shift(); }
    if (h.wink) h.wink = Math.abs(h.wink) - dt > 0 ? Math.sign(h.wink) * (Math.abs(h.wink) - dt) : 0;
    if (h.happy > 0) h.happy = Math.max(0, h.happy - dt);
    if (h.surprise > 0) h.surprise = Math.max(0, h.surprise - dt);
    if ((h.nextBlink -= dt) <= 0 && h.surprise <= 0) {        // startled eyes stay open
      const r = rand();
      if (r < 0.18) h.wink = (rand() < 0.5 ? -1 : 1) * 0.4;              // a wink, left or right eye
      else if (r < 0.38) h.blinks = [0.11, 0.1, 0.11];                   // a double blink: shut, open, shut
      else h.blinks = [0.13];
      h.nextBlink = between(1.8, 5.5);
    }
    if (h.lookHold > 0) h.lookHold -= dt;
    else if ((h.nextLook -= dt) <= 0) {
      h.lookGoal = rand() < 0.5 ? -1 : 1;
      h.lookHold = between(0.6, 1.3);
      h.nextLook = between(3, 8);
    }
    if (h.dash) h.lookGoal = h.face;                           // dashing, eyes front
    else if (h.five) h.lookGoal = h.five.side;                 // high-fiving, eyes on the other
    else if (h.lookHold <= 0) h.lookGoal = h.target ? Math.sign(attach(h.target).x - h.x) || h.face : 0.6 * h.face;
    h.look += (h.lookGoal - h.look) * Math.min(1, 9 * dt);
  }

  // Left outside by a narrowing window, a helper is startled: wide eyes, an
  // open mouth and a "!", and it dashes back in, then glides on a little
  // way once inside, slowing, its course wavering at random, before it takes
  // up wandering again.
  // Never on top of another helper, nor, unless it is reaching that tail (p),
  // on top of an mRNA: within reach of a helper, a head or a bead, it drifts off.
  function keepClear(h, p, dt) {
    const away = (x, y, reach) => {
      const ox = h.x - x, oy = h.y - y, od = Math.hypot(ox, oy) || 1;
      if (od < reach) { const push = (reach - od) * Math.min(1, 3 * dt); h.x += ox / od * push; h.y += oy / od * push; }
    };
    for (const o of helpers) if (o !== h) away(o.x, o.y, 60 * u);
    for (const q of tadpoles) {
      away(q.x, headY(q), 30 * u);
      if (q !== p) for (let i = 0; i < q.tail.length; i++) { const b = beadAt(q, i); away(b.x, b.y, 18 * u); }
    }
  }

  function dash(h, dt) {
    const out = h.x < -6 * u ? 1 : h.x > W + 6 * u ? -1 : 0;   // which way is back in
    if (out && !h.dash) {
      if (h.five) { h.five.mate.five = null; h.five = null; }
      // how hard it slows, and how its course bends, differ from dash to dash
      h.dash = { vx: out * between(150, 190) * u, vy: between(-20, 20) * u,
                 drag: between(1.8, 2.8), turn: between(-0.8, 0.8) };
      h.surprise = 1.5;
      h.blinks = []; h.wink = 0; h.happy = 0;
      h.target = null;
    }
    const d = h.dash;
    if (!d) return false;
    h.x += d.vx * dt;
    h.y += d.vy * dt;
    if (h.x > 24 * u && h.x < W - 24 * u) {                   // in again: gliding
      const k = Math.exp(-d.drag * dt), c = Math.cos(d.turn * dt), s = Math.sin(d.turn * dt);
      [d.vx, d.vy] = [k * (d.vx * c - d.vy * s), k * (d.vx * s + d.vy * c) + between(-40, 40) * u * dt];
      if (Math.hypot(d.vx, d.vy) < 10 * u) { h.heading = Math.atan2(d.vy, d.vx); h.dash = null; }
      keepClear(h, null, dt);                                 // gliding round what is in the way
    } else {
      h.surprise = Math.max(h.surprise, 1);                   // startled for as long as it is out
    }
    // kept low enough for its "!" to show, and bouncing off the bottom
    if (h.y < 30 * u) h.y += (30 * u - h.y) * Math.min(1, 3 * dt);
    if (h.y > H - 12 * u) { h.y = H - 12 * u; d.vy = -Math.abs(d.vy); }
    h.face = d.vx > 0 ? 1 : -1;
    return true;
  }

  // Two helpers that find themselves side by side for a while, neither on an
  // errand, give each other a high five: they turn face to face, draw in a
  // little, each raises a hand, the hands meet with a slap, and they hop and
  // part. None goes looking for one; it only comes to those that linger close.
  const FIVE = 1;                                       // how long one takes, in seconds
  const raised = (k) => {                               // how high the hand is, 0 to 1
    const e = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
    return k < 0.45 ? e(k / 0.45) : 1 - e((k - 0.62) / 0.35);
  };

  function meet(dt) {
    const free = (h) => !h.five && !h.dash && !h.target && h.happy <= 0 && h.fiveCool <= 0;
    for (let i = 0; i < helpers.length; i++) {
      for (let j = i + 1; j < helpers.length; j++) {
        const a = helpers[i], b = helpers[j];
        const close = Math.abs(a.x - b.x) < 100 * u && Math.abs(a.y - b.y) < 36 * u;
        const was = a.near.get(b) || 0;
        const now = close && free(a) && free(b) ? was + dt : Math.max(0, was - 2 * dt);
        a.near.set(b, now);
        if (now < 2.5) continue;
        a.near.set(b, 0);
        const side = Math.sign(b.x - a.x) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        a.five = { mate: b, side, k: 0, x: mx - side * 18 * u, y: my, slapped: false };
        b.five = { mate: a, side: -side, k: 0, x: mx + side * 18 * u, y: my, slapped: false };
      }
    }
  }

  function highFive(h, dt) {
    const f = h.five;
    f.k += dt;
    h.face = f.side;
    const ease = Math.min(1, 8 * dt);                   // into place, face to face
    h.x += (f.x - h.x) * ease;
    h.y += (f.y - h.y) * ease;
    if (f.k >= 0.45 && !f.slapped) {
      f.slapped = true;
      h.happy = 0.9;                                    // both smile and hop
      if (f.side > 0) claps.push({ x: f.x + 18 * u, y: f.y - 14 * u, life: 1 });
    }
    if (f.k >= FIVE) {                                  // and off they go, apart
      h.five = null;
      h.heading = (f.side > 0 ? Math.PI : 0) + between(-0.7, 0.7);
      h.fiveCool = between(40, 80);
      h.rest = null;
    }
  }

  function stepHelper(h, dt) {
    stepFace(h, dt);
    if (dash(h, dt)) return;
    if (h.fiveCool > 0) h.fiveCool -= dt;
    if (h.five) { highFive(h, dt); return; }
    h.cool -= dt;
    let p = h.target;
    if (p && (p.gone || p.dying || p.marked || p.held || !serves(h, p))) p = h.target = null;
    if (!p && h.cool <= 0) p = h.target = notice(h);
    let at = null, dist = Infinity;
    if (p) {
      at = attach(p);
      dist = Math.hypot(at.x - h.x, at.y - h.y);
      if (dist > 1.4 * reach(h)) { p = h.target = null; at = null; }   // it got away: let it go
    }
    // Wandering: the heading drifts at random, flattened (the scene is wide
    // and shallow), and near an edge it turns back inwards, rather than
    // pressing on against the edge until the drift happens to turn it. A
    // tail it has noticed only bends that course towards it.
    h.heading += between(-1, 1) * 2.4 * dt;
    const inx = h.x < 50 * u ? 1 : h.x > W - 50 * u ? -1 : 0;
    const iny = h.y < 28 * u ? 1 : h.y > H - 28 * u ? -1 : 0;
    if (inx || iny) {
      const off = Math.atan2(iny, inx) - h.heading;
      h.heading += Math.atan2(Math.sin(off), Math.cos(off)) * Math.min(1, 1.6 * dt);
    }
    // However it comes to be held in one spot (pressed against another
    // helper, or hemmed in by tails), it never stays there long: after a few
    // seconds it lets go of any tail and sets off for somewhere else.
    if (!h.rest || Math.hypot(h.x - h.rest.x, h.y - h.rest.y) > 16 * u) h.rest = { x: h.x, y: h.y, time: 0 };
    else if ((h.rest.time += dt) > h.restless) {
      h.heading = Math.atan2((between(0.3, 0.7) * H - h.y) / 0.55, between(0.15, 0.85) * W - h.x);
      h.restless = between(4, 6);
      h.rest = null;
      if (p) { p = h.target = null; at = null; h.cool = Math.max(h.cool, 3); }
    }
    let vx = Math.cos(h.heading), vy = 0.55 * Math.sin(h.heading);
    if (h.x < 40 * u) vx += 1.2; else if (h.x > W - 40 * u) vx -= 1.2;
    if (h.y < 22 * u) vy += 0.8; else if (h.y > H - 22 * u) vy -= 0.8;
    if (at) { vx += 1.1 * (at.x - h.x) / dist; vy += 1.1 * (at.y - h.y) / dist; }
    const len = Math.hypot(vx, vy) || 1, speed = (at ? 22 : 12) * u;
    h.x += vx / len * speed * dt;
    h.y += vy / len * speed * dt;
    if (Math.abs(vx) > 0.15) h.face = vx > 0 ? 1 : -1;
    keepClear(h, p, dt);
    h.y = Math.min(H - 12 * u, Math.max(12 * u, h.y));
    if (p && dist < 26 * u) deliver(h);
  }

  // ---- The Pac-Man -------------------------------------------------------------
  // A uridylated tail is not left for long: soon after the U's land, a
  // Pac-Man races in from the left, gobbles the tail bead by bead from its 3'
  // end, and with the tail gone (and the mRNA fading), leaps over the head
  // and shoots off to the right. It keeps to the open water between the
  // lanes, dropping into the lane only to eat.

  function eater(p) {
    const cruise = (p.lane === 0 ? 0.425 : p.lane === 2 ? 0.675 : rand() < 0.5 ? 0.425 : 0.675) * H;
    return { p, x: -16 * u, y: cruise, cruise, v: Math.max(300 * u, (tailEnd(p).x + 16 * u) / 1.2),
             mode: 'rush', chomp: 0, bite: 0, angle: 0, hop: null };
  }

  function flee(e) {
    e.mode = 'flee';
    e.v = Math.max(e.v, 120 * u);
    // over the head, if there is one still to clear, landing between the lanes
    e.hop = { x0: e.x, x1: e.p.gone ? e.x : e.p.x + 30 * e.p.s * u, y0: e.y };
  }

  function stepEaters(dt) {
    for (let i = eaters.length - 1; i >= 0; i--) {
      const e = eaters[i], p = e.p, x = e.x, y = e.y;
      e.chomp += dt;
      if (e.mode !== 'flee' && p.gone) flee(e);
      if (e.mode === 'rush') {                          // to the end of the tail, dropping into its lane at the last
        const end = tailEnd(p);
        e.x += e.v * dt;
        const k = Math.min(1, Math.max(0, (end.x - e.x) / (60 * u)));
        e.y += (end.y + (e.cruise - end.y) * k - e.y) * Math.min(1, 10 * dt);
        if (e.x >= end.x - 9 * u) { e.mode = 'eat'; e.bite = 0.05; }
      } else if (e.mode === 'eat') {                    // a bead at a bite, each in its turn in the mouth
        const end = tailEnd(p);
        e.x += (end.x - 3 * u - e.x) * Math.min(1, 14 * dt);
        e.y += (end.y - e.y) * Math.min(1, 14 * dt);
        if ((e.bite -= dt) <= 0) {
          p.tail.pop();
          e.bite = 0.12;
          if (!p.tail.length) { p.dying = true; flee(e); }
        }
      } else {                                          // off and away, faster and faster
        e.v = Math.min(700 * u, e.v + 1500 * u * dt);
        e.x += e.v * dt;
        const h = e.hop, s = h.x1 > h.x0 ? Math.min(1, (e.x - h.x0) / (h.x1 - h.x0)) : 1;
        e.y = h.y0 + (e.cruise - h.y0) * s - 36 * u * Math.sin(Math.PI * s);
        if (e.x > W + 30 * u) { eaters.splice(i, 1); continue; }
      }
      if (Math.hypot(e.x - x, e.y - y) > 0.5 * u) e.angle = Math.atan2(e.y - y, e.x - x);
    }
  }

  function drawEater(e) {
    const r = 10.5 * u, gape = (0.04 + 0.22 * Math.abs(Math.sin(e.chomp * Math.PI / 0.12))) * Math.PI;
    if (e.mode !== 'eat') {                             // speed lines, trailing
      ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round'; ctx.strokeStyle = LABEL;
      ctx.globalAlpha = 0.55;
      for (const [dy, len] of [[-5, 9], [0, 13], [5, 9]]) {
        const bx = e.x - (r + 4 * u) * Math.cos(e.angle) - dy * u * Math.sin(e.angle);
        const by = e.y - (r + 4 * u) * Math.sin(e.angle) + dy * u * Math.cos(e.angle);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - len * u * Math.cos(e.angle), by - len * u * Math.sin(e.angle));
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    }
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.arc(e.x, e.y, r, e.angle + gape, e.angle + 2 * Math.PI - gape);
    ctx.closePath();
    ctx.fillStyle = PAC; ctx.fill();
    // an eye, above the mouth; once the tail is eaten, a pleased arch
    const ex = e.x + 1.5 * u * Math.cos(e.angle) + 5.5 * u * Math.sin(e.angle);
    const ey = e.y + 1.5 * u * Math.sin(e.angle) - 5.5 * u * Math.cos(e.angle);
    ctx.beginPath();
    if (e.mode === 'flee') {
      ctx.arc(ex, ey + 0.8 * u, 1.8 * u, Math.PI * 1.15, Math.PI * 1.85);
      ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineCap = 'butt';
    } else {
      ctx.arc(ex, ey, 1.6 * u, 0, 2 * Math.PI);
      ctx.fillStyle = INK; ctx.fill();
    }
  }

  // ---- The scissors --------------------------------------------------------------
  // An endoribonuclease, every twenty to thirty seconds: a pair of scissors
  // swims in from the right, against the stream, along the open water beside
  // the lane of the longest-tailed mRNA in view that no helper is at. Level
  // with the strand between its head and its tail it turns blades towards
  // it, closes in and snips twice; the two pieces drift apart and fade away,
  // and the scissors draw back and swim off to the left, pleased.

  function sendCutter() {
    let best = null;
    for (const p of tadpoles) {
      if (p.dying || p.marked || p.held || helpers.some((h) => h.target === p)) continue;
      if (p.x < 0.3 * W || p.x > 0.75 * W) continue;
      if (!best || p.tail.length > best.tail.length) best = p;
    }
    if (!best) return false;
    best.marked = true;                                 // no helper comes to it now, and it loses no more beads
    const cruise = (best.lane === 0 ? 0.425 : best.lane === 2 ? 0.675 : rand() < 0.5 ? 0.425 : 0.675) * H;
    cutters.push({ p: best, x: W + 30 * u, y: cruise, cruise, v: 190 * u, angle: Math.PI, open: 0.1, k: 0, mode: 'come', happy: 0 });
    return true;
  }

  function stepCutters(dt) {
    for (let i = cutters.length - 1; i >= 0; i--) {
      const c = cutters[i], p = c.p;
      c.k += dt;
      if (c.happy > 0) c.happy = Math.max(0, c.happy - dt);
      if ((c.mode === 'come' || c.mode === 'close' || c.mode === 'snip') && (p.gone || p.dying)) c.mode = 'back';
      const at = { x: p.x - CUT * p.s * u, y: headY(p) };   // where it cuts
      const dir = Math.sign(at.y - c.cruise) || 1;          // the strand below the open water it came along, or above
      const to = { x: at.x, y: at.y - dir * 8 * u };        // its pivot then, the strand across its blades
      let aim = Math.PI, open = 0.06 + 0.08 * (1 - Math.cos(2 * Math.PI * c.k / 0.8));   // snapping idly as it goes
      if (c.mode === 'come') {                          // in along the open water, to level with the cut
        c.x = Math.max(to.x, c.x - c.v * dt);
        c.y += (c.cruise - c.y) * Math.min(1, 6 * dt);
        if (c.x <= to.x) c.mode = 'close';
      } else if (c.mode === 'close') {                  // turning blades to the strand, wide open, and in
        aim = dir * Math.PI / 2; open = 0.45;
        c.x = to.x;
        c.y += Math.max(-60 * u * dt, Math.min(60 * u * dt, to.y - c.y));
        if (Math.abs(to.y - c.y) < 0.5 * u) { c.mode = 'snip'; c.k = 0; }
      } else if (c.mode === 'snip') {                   // snip, snip: through on the second
        aim = dir * Math.PI / 2; open = 0.45 * Math.abs(Math.cos(Math.PI * c.k / 0.2));
        c.x = to.x; c.y = to.y;
        if (c.k >= 0.3) {
          p.cut = { x: p.x, sink: 0 };
          p.dying = true;
          rings.push({ x: at.x, y: at.y, life: 1, color: INK });
          c.mode = 'back'; c.happy = 1.5; c.v = 60 * u;
        }
      } else if (c.mode === 'back') {                   // straight back to the open water, clear of the pieces
        aim = dir * Math.PI / 2;
        c.y += Math.max(-70 * u * dt, Math.min(70 * u * dt, c.cruise - c.y));
        if (Math.abs(c.cruise - c.y) < 0.5 * u) c.mode = 'leave';
      } else {                                          // and off to the left, faster and faster
        c.v = Math.min(500 * u, c.v + 900 * u * dt);
        c.x -= c.v * dt;
        if (c.x < -40 * u) { cutters.splice(i, 1); continue; }
      }
      const turn = aim - c.angle;
      c.angle += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, 9 * dt);
      c.open += (open - c.open) * Math.min(1, 25 * dt);
    }
  }

  // Two blades crossed at a pivot, white with an ink edge, and two ink
  // finger rings with an eye in each, looking along the blades, or, once it
  // has cut, pleased.
  function drawCutter(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * c.open);
      ctx.beginPath();                                  // the blade: its edge along the middle, its back bowed out
      ctx.moveTo(-1.5 * u, 0);
      ctx.lineTo(15 * u, 0);
      ctx.quadraticCurveTo(6 * u, side * 4.4 * u, -1.5 * u, side * 2.6 * u);
      ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.2 * u; ctx.stroke();
      ctx.beginPath();                                  // its handle, crossing to the other side, and the ring
      ctx.moveTo(-1 * u, -side * 0.6 * u);
      ctx.lineTo(-6 * u, -side * 2.4 * u);
      ctx.lineWidth = 2 * u; ctx.stroke();
      ctx.beginPath();
      ctx.arc(-9 * u, -side * 3.8 * u, 3.4 * u, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.9 * u; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 1.3 * u, 0, 2 * Math.PI);
    ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
    for (const side of [-1, 1]) {
      const a = c.angle + side * c.open, lx = -9 * u, ly = -side * 3.8 * u;
      const ex = c.x + lx * Math.cos(a) - ly * Math.sin(a), ey = c.y + lx * Math.sin(a) + ly * Math.cos(a);
      ctx.beginPath();
      if (c.happy > 0) {
        ctx.arc(ex, ey + 0.7 * u, 1.5 * u, Math.PI * 1.15, Math.PI * 1.85);
        ctx.lineWidth = 1.2 * u; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineCap = 'butt';
      } else {
        ctx.arc(ex + 0.9 * u * Math.cos(c.angle), ey + 0.9 * u * Math.sin(c.angle), 1.25 * u, 0, 2 * Math.PI);
        ctx.fillStyle = INK; ctx.fill();
      }
    }
  }

  // ---- Time --------------------------------------------------------------------

  function step(dt) {
    t += dt;
    for (const p of tadpoles) {
      // One that catches up with another in its lane keeps a gap behind its
      // tail: it slows to the other's pace near it, and waits when closer.
      let v = p.v;
      for (const q of tadpoles) {
        if (q === p || q.lane !== p.lane || q.x <= p.x) continue;
        const gap = tailEnd(q).x - 8 * q.s * u - (p.x + 17 * p.s * u);
        if (gap < 12 * u) v = 0;
        else if (gap < 40 * u) v = Math.min(v, q.v);
      }
      p.x += v * u * dt;
      if (p.cut) { p.cut.x += 0.3 * v * u * dt; p.cut.sink += 5 * u * dt; }   // the tail falls behind
      // No bead is lost to a tail a helper is bringing a base to, nor to a
      // uridylated one, nor to one the scissors are after.
      const attended = p.held || helpers.some((h) => h.target === p);
      if (!p.dying && !p.marked && !attended && (p.nibble -= dt) <= 0) nibble(p);
      if (p.doom > 0 && (p.doom -= dt) <= 0) eaters.push(eater(p));
      if (p.dying && (p.fade -= dt / 2.2) <= 0) p.gone = true;
      if (tailEnd(p).x > W + 12 * u) p.gone = true;
    }
    for (let i = tadpoles.length - 1; i >= 0; i--) if (tadpoles[i].gone) tadpoles.splice(i, 1);
    if (tadpoles.length < wanted()) spawn();
    for (const c of crumbs) { c.x += c.vx * u * dt; c.y += c.vy * u * dt; c.life -= dt / 1.6; }
    for (const r of rings) r.life -= dt / 0.7;
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      if (f.p.gone || f.p.dying) { flights.splice(i, 1); continue; }
      f.k = Math.min(1, f.k + dt / 0.45);
      const end = tailEnd(f.p), e = f.k * f.k * (3 - 2 * f.k);
      f.x = f.x0 + (end.x - spacing(f.p) - f.x0) * e;
      f.y = f.y0 + (end.y - f.y0) * e - 10 * u * Math.sin(Math.PI * f.k);
      if (f.k >= 1) { land(f); flights.splice(i, 1); }
    }
    for (let i = crumbs.length - 1; i >= 0; i--) if (crumbs[i].life <= 0) crumbs.splice(i, 1);
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
    for (const c of claps) c.life -= dt / 0.4;
    for (let i = claps.length - 1; i >= 0; i--) if (claps[i].life <= 0) claps.splice(i, 1);
    if ((snipIn -= dt) <= 0) snipIn = sendCutter() ? between(20, 30) : 1;
    stepEaters(dt);
    stepCutters(dt);
    helpers.forEach((h) => stepHelper(h, dt));
    meet(dt);
    stepBubbles(dt);
  }

  // ---- Drawing -----------------------------------------------------------------

  function bead(x, y, base, s) {
    ctx.beginPath();
    ctx.arc(x, y, 6.4 * s, 0, 2 * Math.PI);
    if (base === 'A') {
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.1 * s; ctx.strokeStyle = A_EDGE; ctx.stroke();
      ctx.fillStyle = A_TEXT;
    } else {
      ctx.fillStyle = base === 'G' ? GREY : RED; ctx.fill();
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillText(base, x, y + 0.4 * s);
  }

  // A rounded rectangle's path (ctx.roundRect is too new to count on).
  function rounded(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The messenger bag, worn across the body: the strap runs from the bag, at
  // the front of the head's underside, up and over the back of the head; the
  // bag swings a little as the mRNA swims. The strap is drawn first, clipped
  // to the head, so that it ends exactly at the head's outline, drawn over it;
  // the bag goes on after.
  const swingOf = (p) => 0.16 * Math.sin(t * 3.2 + p.phase + 0.8);

  function drawStrap(p, x, y, s) {
    const a = swingOf(p), sx = -5 * s, sy = 2.2 * s;    // where it meets the bag, in the bag's frame
    const gx = x + 3 * s + sx * Math.cos(a) - sy * Math.sin(a);
    const gy = y + 6 * s + sx * Math.sin(a) + sy * Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(x - 5 * s, y + 1 * s, x - 13 * s, y - 13 * s);   // on past the outline
    ctx.lineWidth = 1.7 * s; ctx.strokeStyle = p.bag.strap; ctx.stroke();
  }

  function drawBag(p, x, y, s) {
    ctx.save();
    ctx.translate(x + 3 * s, y + 6 * s);
    ctx.rotate(swingOf(p));
    rounded(-5.8 * s, 2 * s, 11.6 * s, 8.8 * s, 2.2 * s);
    ctx.fillStyle = p.bag.body; ctx.fill();
    ctx.lineWidth = 1.1 * s; ctx.strokeStyle = INK; ctx.stroke();
    rounded(-5.8 * s, 2 * s, 11.6 * s, 4.6 * s, 2.2 * s); // the flap
    ctx.fillStyle = p.bag.flap; ctx.fill(); ctx.stroke();
    ctx.beginPath();                                    // and its buckle
    ctx.arc(0, 6.6 * s, 1.1 * s, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 0.8 * s; ctx.stroke();
    ctx.restore();
  }

  function drawTadpole(p) {
    const s = p.s * u, x = p.x, y = headY(p), n = p.tail.length;
    ctx.globalAlpha = Math.max(0, p.fade);
    ctx.font = `600 ${8.4 * s}px ${FACE}`;
    // the strand (once cut, from the cut on), then its beads from the 3' end in
    ctx.beginPath();
    ctx.moveTo(backX(p) - (p.cut ? CUT + 2 : 14) * s, backY(p));
    for (let i = 0; i < n; i++) { const b = beadAt(p, i); ctx.lineTo(b.x, b.y); }
    ctx.lineWidth = 1.4 * s; ctx.strokeStyle = STRAND; ctx.stroke();
    for (let i = n - 1; i >= 0; i--) { const b = beadAt(p, i); bead(b.x, b.y, p.tail[i], s); }
    // the head, an eye, the messenger bag, and the 5' cap worn as a cap, brim forward
    const head = () => { ctx.beginPath(); ctx.ellipse(x, y, 16 * s, 11.5 * s, 0, 0, 2 * Math.PI); };
    head();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save();
    ctx.clip();
    drawStrap(p, x, y, s);
    ctx.restore();
    head();
    ctx.lineWidth = 1.7 * s; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 8.6 * s, y - 1.2 * s, 1.9 * s, 0, 2 * Math.PI);
    ctx.fillStyle = INK; ctx.fill();
    drawBag(p, x, y, s);
    ctx.beginPath();
    ctx.ellipse(x + 0.5 * s, y - 8.7 * s, 9.4 * s, 6.7 * s, 0, Math.PI, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = RED; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 10.9 * s, y - 8.5 * s, 7.5 * s, 1.8 * s, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawHelper(h) {
    const hop = h.happy > 0 ? 4 * u * Math.sin(Math.PI * (1 - h.happy / 0.9)) : 0;
    const x = h.x, y = h.y + 1.5 * u * Math.sin(t * 2 + h.phase) - hop, f = h.face;
    // dashing, the body stretches along the way it goes
    const rush = h.dash ? Math.min(1, Math.abs(h.dash.vx) / (170 * u)) : 0;
    const body = tent(h.kind) ? GREY : RED;
    if (h.five) {                                       // a hand raised for the high five, from behind the body
      const r = raised(h.five.k), s = h.five.side;
      const hx = x + s * (8 + 7 * r) * u, hy = y - (2 + 12 * r) * u;
      ctx.beginPath();
      ctx.moveTo(x + s * 6 * u, y - 2 * u); ctx.lineTo(hx, hy);
      ctx.lineWidth = 3.4 * u; ctx.lineCap = 'round'; ctx.strokeStyle = body; ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 3.8 * u, 0, 2 * Math.PI);
      ctx.fillStyle = body; ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(x, y, 12 * u * (1 + 0.2 * rush), 9.2 * u * (1 - 0.12 * rush), 0, 0, 2 * Math.PI);
    ctx.fillStyle = body; ctx.fill();
    if (h.surprise > 0) {                               // startled: an open mouth, and a "!" above
      ctx.beginPath();
      ctx.arc(x + h.look * 1.5 * u, y + 3.8 * u, 1.4 * u, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.globalAlpha = Math.min(1, h.surprise / 0.4);
      ctx.font = `700 ${13 * u}px ${FACE}`;
      ctx.fillStyle = INK;
      ctx.fillText('!', x + 3 * u * f, y - 17 * u - 2 * u * Math.sin(Math.min(1, (1.5 - h.surprise) * 6) * Math.PI));
      ctx.globalAlpha = 1;
    }
    // two eyes, turned the way it looks: open (white, with a pupil), wide and
    // small-pupilled when startled, shut in a blink or a wink (a line), or
    // smiling after a delivery (an arch)
    const blink = h.blinks.length % 2 === 1;            // the queue alternates shut, open, shut
    ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff';
    for (const side of [-1, 1]) {
      const ex = x + side * 3.9 * u + h.look * 2.3 * u, ey = y - 1.8 * u;
      ctx.beginPath();
      if (h.surprise > 0) {
        ctx.arc(ex, ey, 2.9 * u, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + h.look * 0.6 * u, ey, 0.9 * u, 0, 2 * Math.PI);
        ctx.fillStyle = INK; ctx.fill();
      } else if (h.happy > 0) {
        ctx.arc(ex, ey + 1 * u, 1.9 * u, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (blink || Math.sign(h.wink) === side) {
        ctx.moveTo(ex - 1.9 * u, ey); ctx.lineTo(ex + 1.9 * u, ey);
        ctx.stroke();
      } else {
        ctx.ellipse(ex, ey, 2.2 * u, 2.6 * u, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + h.look * 0.8 * u, ey + 0.3 * u, 1.25 * u, 0, 2 * Math.PI);
        ctx.fillStyle = INK; ctx.fill();
      }
    }
    ctx.lineCap = 'butt';
    if (h.target) {                                     // the base it is bringing, held out in front
      ctx.font = `600 ${8.4 * 0.85 * u}px ${FACE}`;
      bead(x + 17 * u * f, y + 2 * u, tent(h.kind) ? 'G' : 'U', 0.85 * u);
    }
    if (W >= 600) {                                     // its name, where there is room to read it
      ctx.font = `500 ${8.5 * u}px ${FACE}`;
      ctx.fillStyle = LABEL;
      ctx.fillText(h.kind, x, y + 18 * u);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawSea();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const c of crumbs) {
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.font = `600 ${8.4 * c.s * u}px ${FACE}`;
      bead(c.x, c.y, c.base, c.s * u * (0.7 + 0.3 * c.life));
    }
    for (const r of rings) {
      ctx.globalAlpha = Math.max(0, r.life);
      ctx.beginPath();
      ctx.arc(r.x, r.y, (5 + 12 * (1 - r.life)) * u, 0, 2 * Math.PI);
      ctx.lineWidth = 1.5 * u; ctx.strokeStyle = r.color; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    [...tadpoles].sort((a, b) => a.s - b.s).forEach(drawTadpole);
    eaters.forEach(drawEater);
    cutters.forEach(drawCutter);
    helpers.forEach(drawHelper);
    for (const c of claps) {                            // the slap of a high five: a few short strokes, flaring
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
      for (const a of [-2.6, -2.05, -1.57, -1.09, -0.54]) {
        const r0 = (6 + 3 * (1 - c.life)) * u, r1 = r0 + (3 + 3 * (1 - c.life)) * u;
        ctx.beginPath();
        ctx.moveTo(c.x + r0 * Math.cos(a), c.y + r0 * Math.sin(a));
        ctx.lineTo(c.x + r1 * Math.cos(a), c.y + r1 * Math.sin(a));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
    for (const f of flights) {                          // a base on its way to a tail
      ctx.font = `600 ${8.4 * 0.85 * u}px ${FACE}`;
      bead(f.x, f.y, tent(f.kind) ? 'G' : 'U', 0.85 * u);
    }
  }

  // ---- Start, and the clock ------------------------------------------------------
  // The scene opens already under way: tadpoles across the width, the ones
  // further on with shorter tails, and some seconds run so the helpers are busy.

  size();
  if (!W || !H) return;
  for (let i = 0, n = wanted(); i < n; i++) {
    const x = (i + 0.5) / n * W + between(-30, 30) * u;
    tadpoles.push(tadpole(x, i % LANES.length, Math.max(3, Math.round(13 - 9 * x / W + between(-2, 2)))));
  }
  // Four across a wide scene, grey and red in turn; a phone has room for two.
  if (W >= 600) [['TENT4A', 0.18], ['TUT4', 0.4], ['TENT4B', 0.6], ['TUT7', 0.82]].forEach(([k, at]) => helpers.push(helper(k, at)));
  else [['TENT4A', 0.3], ['TUT7', 0.7]].forEach(([k, at]) => helpers.push(helper(k, at)));
  for (let i = 0; i < 120; i++) step(1 / 15);

  // About 30 frames a second. A device that cannot keep that up steps down
  // to 20 and then to 12, which spares its main thread: after two seconds at
  // a rate, if for three seconds running the frames come late (half as far
  // apart again as asked), or each holds the main thread for over half the
  // time between them -- this script, and then the browser putting the frame
  // on screen, which on a device without a GPU to draw the canvas is most of
  // it. A message posted at the end of a frame is handled only once that is
  // done, so its delay is the frame's whole cost. The averages leave out the
  // first frame after a pause (out of view, a hidden tab).
  const PERIODS = [30, 45, 78];                         // ms: at 60Hz, every 2nd, 3rd and 5th refresh
  let raf = 0, last = 0, inView = true;
  let tier = 0, period = PERIODS[0], lag = 33, busy = 0, ran = 0, slowFor = 0, began = 0;
  const done = new MessageChannel();
  done.port1.onmessage = () => { busy += (performance.now() - began - busy) * 0.05; };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const gap = now - last;
    if (gap < period) return;
    last = now;
    began = performance.now();
    step(Math.min(0.1, gap / 1000));
    draw();
    if (tier < PERIODS.length - 1 && gap < 200) {
      done.port2.postMessage(0);
      lag += (gap - lag) * 0.05;
      ran += gap;
      slowFor = ran > 2000 && (lag > 1.45 * period || busy > 0.55 * period) ? slowFor + gap : 0;
      if (slowFor > 3000) { period = PERIODS[++tier]; lag = period; ran = slowFor = 0; }
    }
  }
  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;
    draw();
    if (!inView || document.hidden || still.matches) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver((entries) => {
    const was = inView;
    inView = entries[entries.length - 1].isIntersecting;
    if (inView !== was) schedule();
  }).observe(canvas);
  document.addEventListener('visibilitychange', schedule);
  still.addEventListener('change', schedule);
  window.addEventListener('resize', () => {
    size();
    // With motion reduced there is no dash: a helper left outside is simply put back in.
    if (still.matches) helpers.forEach((h) => { h.x = Math.min(W - 24 * u, Math.max(24 * u, h.x)); });
    draw();
  });
  if (document.fonts) document.fonts.ready.then(draw);  // the bead letters, once the face is in
  schedule();
})();
