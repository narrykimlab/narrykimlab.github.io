/*
 * The Join us page's scene (_includes/recruit_scene.html): the home page's
 * scene (js/tails.js), with its rules throughout, but for what this page
 * needs. Each mRNA here carries a recruiter on the strand behind its head:
 * ZCCHC14 or ZCCHC2, sitting on a stem-loop, or Pt1, an element of the RNA
 * itself. TENT4A and TENT4B, and here PAPγ too, do not go to a tail of
 * their own accord: the recruiter calls one over (a wave of the hand, rings
 * spreading out) when the home page's TENT4 would have gone to that tail --
 * it is two to seven long and, for TENT4, not ending in a G, and the
 * effector is rested (five to ten seconds after its last visit) and near:
 * here within 130px of the recruiter, as far as the home page's TUTs notice
 * a tail from. The effector looks up with a "!" and rushes over along a
 * dotted line, drawn as the call goes out, docks with a click on the side
 * it was on (on top, for Pt1), and only then throws its bases onto the
 * tail: TENT4A or TENT4B its few A's and a G (mixed tailing) just as on the
 * home page -- AG, AAG or AAGA, the deadenylase then stalling at the G --
 * and PAPγ four A's, two at a throw (cytoplasmic polyadenylation). Then it
 * lets go, pleased, and wanders off. The line goes round the recruiter
 * rather than through it, and no effector is called whose line would cross
 * another mRNA's recruiter or any head. One mRNA calls as the page opens.
 *
 * The rest is the home page's: TUT4 and TUT7 add U's to a tail that is
 * nearly gone, and soon a Pac-Man races in, eats the tail and leaps off
 * over the head (higher here, to clear the recruiter); every twenty to
 * thirty seconds a pair of scissors (an endoribonuclease) swims in from the
 * right, against the stream, and snips the longest-tailed mRNA no helper is
 * at, here between its head and its stem-loop, and from below, as the
 * recruiters sit above the strand; helpers that linger side by side give
 * each other a high five, and one left outside by a narrowing window dashes
 * back in, startled.
 *
 * The same drawing as the home page's, at the same size there (the home
 * scene is drawn for 150px and so is this, at 1 on a wide screen and 0.85
 * on a phone), in the same sea: --sea and --sea-deep in css/main.scss, the
 * water below --sea-top painted once as the canvas's own CSS background.
 * About 30 frames a second, stepping down to 20 and 12 on a device that
 * cannot keep up; nothing is drawn while the scene is out of view or the
 * tab is hidden; under prefers-reduced-motion one still frame is shown; the
 * scene starts the same on every visit.
 *
 * Loaded with defer from _includes/recruit_scene.html, only on /join/.
 */
(() => {
  'use strict';

  const canvas = document.querySelector('canvas.recruit-scene');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const INK = '#222224', RED = '#ca2017', GREY = '#3d3d3d';
  const PAC = '#7cb342';                                // the Pac-Man, a soft lime
  const STRAND = '#9fb0b7', A_EDGE = '#9aa3a8', A_TEXT = '#5e676c', LABEL = '#4f6168';
  const NAVY = '#3f5f8f';                               // the recruiters
  const AMBER = '#c98f3d';                              // PAPγ
  const BAGS = [
    { body: '#e8be7c', flap: '#c98f3d', strap: '#8c6326' },  // tan
    { body: '#a9bd5c', flap: '#7f9634', strap: '#5b6d22' },  // olive green
    { body: '#5f7fae', flap: '#3f5f8f', strap: '#2f4870' }   // navy
  ];
  let sea = '#dce9ee', seaDeep = '#bcd3dc', seaTop = 20, water = null;
  const FACE = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';

  // Which effector each recruiter calls.
  const CALLS = { ZCCHC14: 'TENT4', ZCCHC2: 'TENT4', Pt1: 'PAPγ' };
  const RECRUITERS = Object.keys(CALLS);
  const tent = (kind) => kind.startsWith('TENT');
  const tut = (kind) => kind.startsWith('TUT');
  const bodyOf = (kind) => (tent(kind) ? GREY : tut(kind) ? RED : AMBER);
  const baseOf = (kind) => (tent(kind) ? 'G' : tut(kind) ? 'U' : 'A');     // the base it is seen to bring

  // A fixed-seed generator, so the scene starts the same on every visit.
  let seed = 20261104;
  function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const between = (a, b) => a + (b - a) * rand();

  let W = 0, H = 0, u = 1, t = 0;
  const LANES = [0.4, 0.63, 0.86];
  const tadpoles = [], crumbs = [], rings = [], claps = [], helpers = [], flights = [], eaters = [], cutters = [], bubbles = [];
  let nextRecruiter = 0;
  // When the next scissors come: the first, as on the home page, some four
  // seconds after the page opens.
  let snipIn = 10;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; u = W < 600 ? 0.85 : 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(canvas);
    sea = cs.getPropertyValue('--sea').trim() || sea;
    seaDeep = cs.getPropertyValue('--sea-deep').trim() || seaDeep;
    seaTop = parseFloat(cs.getPropertyValue('--sea-top')) || seaTop;
    water = ctx.createLinearGradient(0, 0, 0, H);
    water.addColorStop(0, sea);
    water.addColorStop(1, seaDeep);
  }

  // ---- The sea, as on the home page --------------------------------------------

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

  function drawSea() {
    ctx.beginPath();
    ctx.moveTo(0, seaTop + 2);
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, surface(x));
    ctx.lineTo(W + 8, seaTop + 2);
    ctx.closePath();
    ctx.fillStyle = water;
    ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= W + 8; x += 8) { const y = surface(x); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.lineWidth = 1.6 * u; ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.stroke();
    ctx.lineWidth = 1 * u; ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r * u, 0, 2 * Math.PI); ctx.stroke(); }
  }

  // ---- The mRNAs ---------------------------------------------------------------
  // x is the head's centre. Behind it, a stretch of strand holds the
  // recruiter's stem-loop; the tail streams out beyond that, one bead per base.
  // Once the scissors have cut it (below), that 3' piece, from the cut on,
  // lags behind the head and sinks: it is drawn from backX and backY.

  const UTR = 30;                                       // the stretch before the tail, at s = 1
  const CUT = 26;                                       // where the scissors cut, behind the head's centre
  const headY = (p) => LANES[p.lane] * H + 2.2 * u * Math.sin(t * 1.3 + p.phase);
  const backX = (p) => (p.cut ? p.cut.x : p.x);
  const backY = (p) => headY(p) + (p.cut ? p.cut.sink : 0);
  const spacing = (p) => 10.3 * p.s * u;
  function beadAt(p, i) {
    const s = p.s * u;
    const amp = Math.min(1, (i + 1) / 5) * 5 * s;
    return { x: backX(p) - (23 + UTR) * s - i * spacing(p), y: backY(p) + amp * Math.sin(t * 3.2 + p.phase - i * 0.55) };
  }
  const tailEnd = (p) => beadAt(p, Math.max(0, p.tail.length - 1));
  // The stem-loop's foot, on the strand behind the head.
  const loopX = (p) => backX(p) - 38 * p.s * u;

  function tadpole(x, lane, length) {
    const s = between(0.86, 1.06);
    const rec = RECRUITERS[nextRecruiter++ % RECRUITERS.length];
    return {
      x, lane, s, v: between(16, 25) * s, phase: between(0, 2 * Math.PI), bag: BAGS[Math.floor(between(0, BAGS.length))],
      tail: Array(length).fill('A'), nibble: between(2.5, 5.5),
      stalled: false, marked: false, doom: 0, held: false,
      rec, cool: between(0, 1.5), calling: null, docked: null, ripple: 0, wave: 0,
      cut: null, fade: 1, dying: false, gone: false
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

  // How wide the scene is, 0 up to 1000px across and 1 from 1400px, as on
  // the home page: wider, the TUTs are held back a little.
  const wide = () => Math.min(1, Math.max(0, (W / u - 1000) / 400));

  // A newcomer enters at the left, in the lane with the most room; in a
  // narrow scene with a shorter tail, as on the home page.
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

  // ---- The recruiters ------------------------------------------------------------
  // ZCCHC14 and ZCCHC2 sit on top of the stem-loop; Pt1 is the stem-loop.
  // Each, once its tail is one its effector adds to and while it is well
  // inside the scene, calls the nearest free effector of its kind, and calls
  // again a little after one has been and gone.

  const recruiterAt = (p) => ({ x: loopX(p), y: backY(p) - (p.rec === 'Pt1' ? 17 : 27) * p.s * u });
  // Where the effector docks, as offsets from the recruiter in units of
  // p.s * u: beside the protein, on the side it came from (side, -1 left or
  // 1 right), or on top of Pt1's loop.
  const dockOffset = (p, side) => (p.rec === 'Pt1' ? { x: 0, y: -13 } : { x: 21 * side, y: 1 });

  // The way there, as the same offsets, ending at the dock: straight, unless
  // that line would pass through the recruiter or its stem, when it goes
  // first out to the side it came from, level with the dock (and, from right
  // under or over the recruiter, out sideways at its own height before that).
  function routeFor(h, p, side) {
    const s = p.s * u, r = recruiterAt(p), foot = headY(p);
    const at = (o) => ({ x: r.x + o.x * s, y: r.y + o.y * s });
    const gap = (a, b, c) => {                          // how near segment ab comes to c
      const vx = b.x - a.x, vy = b.y - a.y, k = Math.max(0, Math.min(1, ((c.x - a.x) * vx + (c.y - a.y) * vy) / (vx * vx + vy * vy || 1)));
      return Math.hypot(a.x + k * vx - c.x, a.y + k * vy - c.y);
    };
    // through the recruiter: nearer to it on the way than at the end, and
    // near enough for the bodies to meet (21, the protein's and its own
    // half-widths); or over the stem
    const blocked = (a, b) => {
      const end = Math.hypot(b.x - r.x, b.y - r.y);
      return gap(a, b, r) < Math.min(end, 21 * s) - 1 * s || gap(a, b, { x: r.x, y: (r.y + foot) / 2 }) < 12 * s;
    };
    const me = { x: h.x, y: h.y }, dock = dockOffset(p, side);
    if (!blocked(me, at(dock))) return [dock];
    const beside = { x: 28 * side, y: dock.y };
    if (!blocked(me, at(beside))) return [beside, dock];
    return [{ x: 28 * side, y: (h.y - r.y) / s }, beside, dock];
  }

  // Whether a line through these points (from the effector on) keeps clear
  // of every mRNA's head and every recruiter and its stem: an oval round
  // each, with room to spare, as they all swim on while the effector goes;
  // round p's own recruiter, which the line ends beside, only the recruiter
  // and the stem themselves.
  function clear(way, p) {
    const into = (c, rx, ry) => way.some((b, i) => {
      if (!i) return false;
      const a = way[i - 1];
      const ax = (a.x - c.x) / rx, ay = (a.y - c.y) / ry, vx = (b.x - c.x) / rx - ax, vy = (b.y - c.y) / ry - ay;
      const k = Math.max(0, Math.min(1, -(ax * vx + ay * vy) / (vx * vx + vy * vy || 1)));
      return Math.hypot(ax + k * vx, ay + k * vy) < 1;
    });
    return tadpoles.every((q) => {
      const s = q.s * u, y = headY(q), r = recruiterAt(q);
      if (into({ x: q.x, y }, 22 * s, 17 * s)) return false;
      if (q !== p) return !into({ x: r.x, y: (r.y + y) / 2 }, 17 * s, (y - r.y) / 2 + 12 * s);
      return !into(r, 11 * s, 9 * s) && !into({ x: r.x, y: (r.y + y) / 2 }, 4 * s, (y - r.y) / 2);
    });
  }

  // When a recruiter calls: for a tail the home page's TENT4 would go to,
  // two to seven long and, for TENT4, not ending in a G. Never one the TUTs
  // have marked or the scissors are after, or one a TUT is bringing its U's
  // to.
  function needs(p) {
    const n = p.tail.length;
    if (n < 2 || p.marked || helpers.some((h) => h.target === p)) return false;
    return n <= 7 && (CALLS[p.rec] !== 'TENT4' || p.tail[n - 1] !== 'G');
  }

  // It calls only well inside the scene.
  function stepRecruiter(p, dt) {
    if (p.cool > 0) p.cool -= dt;
    if (p.wave > 0) p.wave = Math.max(0, p.wave - dt);
    const inside = p.x > 0.08 * W && p.x < 0.84 * W;
    if (p.calling) {                                    // calling: a wave and rings, until it comes
      p.wave = 0.3;
      if ((p.ripple -= dt) <= 0) {
        const r = recruiterAt(p);
        rings.push({ x: r.x, y: r.y, life: 1, color: NAVY, wide: true });
        p.ripple = 0.5;
      }
      return;
    }
    if (p.docked || p.cool > 0 || p.dying || !inside || !needs(p)) return;
    call(p, free);
  }

  // An effector free to come: not called or docked, not in a high five or
  // dashing back in, and rested.
  const free = (h) => !h.call && !h.dock && !h.five && !h.dash && h.cool <= 0;

  // How far off a recruiter calls an effector from: as far as the home
  // page's TUTs notice a tail from.
  const FAR = 130;

  // The call goes to the nearest of the effectors of its kind that can come
  // (ok), nearest the recruiter, within call and with a clear way there; if
  // none, it waits and tries again. Where each will dock, and its way there,
  // are settled here, from where the two are as the call goes out.
  function call(p, ok) {
    const r = recruiterAt(p), s = p.s * u;
    const near = helpers.filter((h) => h.kind.startsWith(CALLS[p.rec]) && ok(h) && Math.hypot(h.x - r.x, h.y - r.y) < FAR * u)
      .sort((a, b) => Math.hypot(a.x - r.x, a.y - r.y) - Math.hypot(b.x - r.x, b.y - r.y));
    for (const h of near) {
      const side = Math.sign(h.x - r.x) || 1, route = routeFor(h, p, side);
      if (!clear([{ x: h.x, y: h.y }, ...route.map((o) => ({ x: r.x + o.x * s, y: r.y + o.y * s }))], p)) continue;
      p.calling = h;
      p.ripple = 0;
      h.call = p;
      h.side = side;
      h.route = route;
      h.heard = 0.45;                                   // a moment before it sets off
      h.heardAt = { x: h.x - r.x, y: h.y - r.y };       // and where it is, from the recruiter, till then
      return true;
    }
    return false;
  }

  // ---- The helpers -------------------------------------------------------------
  // TENT4A, TENT4B and PAPγ go only where they are called; TUT4 and TUT7, as
  // on the home page, find a tail of their own: within reach of one they can
  // serve, they lean towards it, unhurried, and throw their U's once close.
  // All wander as the home page's helpers do, between their errands.

  // How near a tail must come for a TUT to notice it.
  const reach = () => (130 - 20 * wide()) * u;

  function helper(kind, at) {
    return { kind, x: at * W, y: between(0.45, 0.8) * H, heading: between(0, 2 * Math.PI),
             face: 1, target: null, cool: between(1, 4), phase: between(0, 6),
             look: 0, lookGoal: 0, lookHold: 0, nextLook: between(2, 7),
             blinks: [], nextBlink: between(0.5, 4), wink: 0, happy: 0,
             surprise: 0, dash: null,
             rest: null, restless: between(4, 6), five: null, fiveCool: between(0, 10), near: new Map(),
             call: null, heard: 0, heardAt: null, side: -1, route: null, dock: null, throws: [], next: 0, after: 0 };
  }

  // Where the next base goes: one bead past the end of the tail.
  function attach(p) {
    const end = tailEnd(p);
    return { x: end.x - spacing(p), y: end.y };
  }

  // A tail a TUT serves, as on the home page: one to five long.
  const serves = (p) => p.tail.length >= 1 && p.tail.length <= 5;

  function notice(h) {
    let best = null, d = reach();
    for (const p of tadpoles) {
      if (p.dying || p.marked || p.held || p.calling || p.docked || !serves(p)) continue;
      if (helpers.some((o) => o !== h && o.target === p)) continue;
      const at = attach(p);
      if (at.x < 0.05 * W || at.x > 0.88 * W) continue;
      const dd = Math.hypot(at.x - h.x, at.y - h.y);
      if (dd < d) { d = dd; best = p; }
    }
    return best;
  }

  // Close enough, a TUT throws its U's: they fly to the end of the tail, and
  // join it when they land (step, below).
  function deliver(h) {
    const p = h.target;
    flights.push({ p, kind: h.kind, bases: ['U', 'U'], x0: h.x + 17 * u * h.face, y0: h.y + 2 * u, k: 0, x: 0, y: 0 });
    p.held = true;
    h.target = null;
    h.cool = between(3, 6) * (1 + 0.6 * wide());
    h.happy = 0.9;                                      // pleased with itself: smiling eyes and a hop
  }

  function land(f) {
    const p = f.p, end = tailEnd(p);
    p.tail.push(...f.bases);
    p.held = flights.some((o) => o !== f && o.p === p);
    if (tut(f.kind)) { p.marked = true; p.doom = between(0.3, 1); }   // the Pac-Man is on its way
    else { p.stalled = false; p.nibble = Math.max(p.nibble, 2.5); }
    rings.push({ x: end.x - spacing(p), y: end.y, life: 1, color: bodyOf(f.kind) });
  }

  // The face, between errands, as on the home page; called, it looks to
  // where it is going, and docked, at the tail.
  function stepFace(h, dt) {
    if (h.blinks.length) { h.blinks[0] -= dt; if (h.blinks[0] <= 0) h.blinks.shift(); }
    if (h.wink) h.wink = Math.abs(h.wink) - dt > 0 ? Math.sign(h.wink) * (Math.abs(h.wink) - dt) : 0;
    if (h.happy > 0) h.happy = Math.max(0, h.happy - dt);
    if (h.surprise > 0) h.surprise = Math.max(0, h.surprise - dt);
    if ((h.nextBlink -= dt) <= 0 && h.surprise <= 0) {
      const r = rand();
      if (r < 0.18) h.wink = (rand() < 0.5 ? -1 : 1) * 0.4;
      else if (r < 0.38) h.blinks = [0.11, 0.1, 0.11];
      else h.blinks = [0.13];
      h.nextBlink = between(1.8, 5.5);
    }
    if (h.lookHold > 0) h.lookHold -= dt;
    else if ((h.nextLook -= dt) <= 0) {
      h.lookGoal = rand() < 0.5 ? -1 : 1;
      h.lookHold = between(0.6, 1.3);
      h.nextLook = between(3, 8);
    }
    if (h.dash) h.lookGoal = h.face;
    else if (h.five) h.lookGoal = h.five.side;
    else if (h.call) h.lookGoal = Math.sign(recruiterAt(h.call).x - h.x) || h.face;
    else if (h.dock) h.lookGoal = -1;
    else if (h.lookHold <= 0) h.lookGoal = h.target ? Math.sign(attach(h.target).x - h.x) || h.face : 0.6 * h.face;
    h.look += (h.lookGoal - h.look) * Math.min(1, 9 * dt);
  }

  // Never on top of another helper, nor, unless it is reaching that tail (p),
  // on top of an mRNA: its head, its recruiter and stem, or a bead.
  function keepClear(h, p, dt) {
    const away = (x, y, reach) => {
      const ox = h.x - x, oy = h.y - y, od = Math.hypot(ox, oy) || 1;
      if (od < reach) { const push = (reach - od) * Math.min(1, 3 * dt); h.x += ox / od * push; h.y += oy / od * push; }
    };
    for (const o of helpers) if (o !== h) away(o.x, o.y, 60 * u);
    for (const q of tadpoles) {
      away(q.x, headY(q), 30 * u);
      const r = recruiterAt(q);
      away(r.x, r.y, 26 * u);
      away(r.x, (r.y + backY(q)) / 2, 22 * u);
      if (q !== p) for (let i = 0; i < q.tail.length; i++) { const b = beadAt(q, i); away(b.x, b.y, 18 * u); }
    }
  }

  // Left outside by a narrowing window, a helper is startled and dashes
  // back in, gliding on a little way once inside, as on the home page.
  function dash(h, dt) {
    const out = h.x < -6 * u ? 1 : h.x > W + 6 * u ? -1 : 0;
    if (out && !h.dash) {
      if (h.five) { h.five.mate.five = null; h.five = null; }
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
    if (h.x > 24 * u && h.x < W - 24 * u) {
      const k = Math.exp(-d.drag * dt), c = Math.cos(d.turn * dt), s = Math.sin(d.turn * dt);
      [d.vx, d.vy] = [k * (d.vx * c - d.vy * s), k * (d.vx * s + d.vy * c) + between(-40, 40) * u * dt];
      if (Math.hypot(d.vx, d.vy) < 10 * u) { h.heading = Math.atan2(d.vy, d.vx); h.dash = null; }
      keepClear(h, null, dt);
    } else {
      h.surprise = Math.max(h.surprise, 1);
    }
    if (h.y < 30 * u) h.y += (30 * u - h.y) * Math.min(1, 3 * dt);
    if (h.y > H - 12 * u) { h.y = H - 12 * u; d.vy = -Math.abs(d.vy); }
    h.face = d.vx > 0 ? 1 : -1;
    return true;
  }

  // Two helpers that find themselves side by side for a while, neither on an
  // errand, give each other a high five, as on the home page.
  const FIVE = 1;
  const raised = (k) => {
    const e = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
    return k < 0.45 ? e(k / 0.45) : 1 - e((k - 0.62) / 0.35);
  };

  function meet(dt) {
    const idle = (h) => !h.five && !h.dash && !h.target && !h.call && !h.dock && h.happy <= 0 && h.fiveCool <= 0;
    for (let i = 0; i < helpers.length; i++) {
      for (let j = i + 1; j < helpers.length; j++) {
        const a = helpers[i], b = helpers[j];
        const close = Math.abs(a.x - b.x) < 100 * u && Math.abs(a.y - b.y) < 36 * u;
        const was = a.near.get(b) || 0;
        const now = close && idle(a) && idle(b) ? was + dt : Math.max(0, was - 2 * dt);
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
    const ease = Math.min(1, 8 * dt);
    h.x += (f.x - h.x) * ease;
    h.y += (f.y - h.y) * ease;
    if (f.k >= 0.45 && !f.slapped) {
      f.slapped = true;
      h.happy = 0.9;
      if (f.side > 0) claps.push({ x: f.x + 18 * u, y: f.y - 14 * u, life: 1 });
    }
    if (f.k >= FIVE) {
      h.five = null;
      h.heading = (f.side > 0 ? Math.PI : 0) + between(-0.7, 0.7);
      h.fiveCool = between(40, 80);
      h.rest = null;
    }
  }

  function dockTo(h, p) {
    h.call = null;
    h.dock = p;
    p.calling = null;
    p.docked = h;
    rings.push({ x: h.x, y: h.y, life: 1, color: bodyOf(h.kind) });
    h.throws = tent(h.kind) ? [['A', 'A', 'G', 'A'].slice(0, Math.round(between(2, 4)))] : [['A', 'A'], ['A', 'A']];
    if (h.throws[0].length === 2 && tent(h.kind)) h.throws[0][1] = 'G';
    h.next = 0.35;
    h.after = 0.7;
  }

  // Done, an effector lets go, and rests five to ten seconds before it
  // comes again, as the home page's TENT4s rest after a delivery; the
  // recruiter waits a moment before it calls again.
  function letGo(h, p) {
    h.dock = null;
    if (p) { p.docked = null; p.cool = between(1, 2); }
    h.happy = 0.9;                                      // pleased with itself: smiling eyes and a hop
    h.cool = between(5, 10);
    h.heading = between(0.6, 1.2) * (rand() < 0.5 ? -1 : 1);
    h.rest = null;
  }

  // Docked: carried along with the mRNA, throwing a batch at a time.
  function stepDocked(h, dt) {
    const p = h.dock;
    if (p.gone || p.dying) { letGo(h, null); return; }
    const r = recruiterAt(p), o = dockOffset(p, h.side), s = p.s * u;
    h.x = r.x + o.x * s; h.y = r.y + o.y * s; h.face = -1;
    if (h.throws.length) {
      if ((h.next -= dt) <= 0) {
        // from its left, or, docked to the right of the protein, from its top
        const right = p.rec !== 'Pt1' && h.side > 0;
        flights.push({ p, kind: h.kind, bases: h.throws.shift(), x0: h.x - (right ? 0 : 15) * u, y0: h.y - (right ? 10 : -2) * u, k: 0, x: h.x, y: h.y });
        p.held = true;
        h.next = 0.45;
      }
    } else if (!flights.some((f) => f.p === p) && (h.after -= dt) <= 0) letGo(h, p);
  }

  // Called: a "!", then there by the route it was given with the call. While
  // the "!" shows, it drifts along with the mRNA, so that the route still
  // starts where it is.
  function stepCalled(h, dt) {
    const p = h.call;
    if (p.gone || p.dying || p.x > 0.92 * W) { p.calling = null; h.call = null; return; }
    const r = recruiterAt(p), s = p.s * u;
    if (h.heard > 0) {
      h.x = r.x + h.heardAt.x; h.y = r.y + h.heardAt.y;
      if (h.surprise <= 0) h.surprise = 0.6;
      h.heard -= dt;
      return;
    }
    let left = 180 * u * dt;                            // how far it goes this frame
    while (left > 0 && h.route.length) {
      const o = h.route[0], to = { x: r.x + o.x * s, y: r.y + o.y * s };
      const dx = to.x - h.x, dy = to.y - h.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.5) h.face = dx > 0 ? 1 : -1;
      if (d > left) { h.x += dx / d * left; h.y += dy / d * left; left = 0; }
      else { h.x = to.x; h.y = to.y; left -= d; h.route.shift(); }
    }
    if (!h.route.length) dockTo(h, p);
  }

  function stepHelper(h, dt) {
    stepFace(h, dt);
    if (h.dock) { stepDocked(h, dt); return; }
    if (h.call) { stepCalled(h, dt); return; }
    if (dash(h, dt)) return;
    if (h.fiveCool > 0) h.fiveCool -= dt;
    if (h.five) { highFive(h, dt); return; }
    h.cool -= dt;
    let p = null, at = null, dist = Infinity;
    if (tut(h.kind)) {                                  // a TUT looks for a tail, as on the home page
      p = h.target;
      if (p && (p.gone || p.dying || p.marked || p.held || p.calling || p.docked || !serves(p))) p = h.target = null;
      if (!p && h.cool <= 0) p = h.target = notice(h);
      if (p) {
        at = attach(p);
        dist = Math.hypot(at.x - h.x, at.y - h.y);
        if (dist > 1.4 * reach()) { p = h.target = null; at = null; }
      }
    }
    // Wandering: the heading drifts at random, flattened, and near an edge
    // it turns back inwards (from the top a little sooner than on the home
    // page, so that the "!" a call brings stays in view); a tail a TUT has
    // noticed only bends its course.
    h.heading += between(-1, 1) * 2.4 * dt;
    const inx = h.x < 50 * u ? 1 : h.x > W - 50 * u ? -1 : 0;
    const iny = h.y < 34 * u ? 1 : h.y > H - 28 * u ? -1 : 0;
    if (inx || iny) {
      const off = Math.atan2(iny, inx) - h.heading;
      h.heading += Math.atan2(Math.sin(off), Math.cos(off)) * Math.min(1, 1.6 * dt);
    }
    // never held in one spot for long: after a few seconds it lets go of any
    // tail and sets off for somewhere else
    if (!h.rest || Math.hypot(h.x - h.rest.x, h.y - h.rest.y) > 16 * u) h.rest = { x: h.x, y: h.y, time: 0 };
    else if ((h.rest.time += dt) > h.restless) {
      h.heading = Math.atan2((between(0.4, 0.8) * H - h.y) / 0.55, between(0.15, 0.85) * W - h.x);
      h.restless = between(4, 6);
      h.rest = null;
      if (p) { p = h.target = null; at = null; h.cool = Math.max(h.cool, 3); }
    }
    let vx = Math.cos(h.heading), vy = 0.55 * Math.sin(h.heading);
    if (h.x < 40 * u) vx += 1.2; else if (h.x > W - 40 * u) vx -= 1.2;
    if (h.y < 28 * u) vy += 0.8; else if (h.y > H - 22 * u) vy -= 0.8;
    if (at) { vx += 1.1 * (at.x - h.x) / dist; vy += 1.1 * (at.y - h.y) / dist; }
    const len = Math.hypot(vx, vy) || 1, speed = (at ? 22 : 12) * u;
    h.x += vx / len * speed * dt;
    h.y += vy / len * speed * dt;
    if (Math.abs(vx) > 0.15) h.face = vx > 0 ? 1 : -1;
    keepClear(h, p, dt);
    h.y = Math.min(H - 12 * u, Math.max(26 * u, h.y));
    if (p && dist < 26 * u) deliver(h);
  }

  // ---- The Pac-Man -------------------------------------------------------------
  // As on the home page: soon after a TUT's U's land, a Pac-Man races in from
  // the left between the lanes, gobbles the tail bead by bead from its 3'
  // end, and leaps over the head (here clearing the recruiter too) and off
  // to the right, leaving the mRNA to fade.

  function eater(p) {
    const cruise = (p.lane === 0 ? 0.515 : p.lane === 2 ? 0.745 : rand() < 0.5 ? 0.515 : 0.745) * H;
    return { p, x: -16 * u, y: cruise, cruise, v: Math.max(300 * u, (tailEnd(p).x + 16 * u) / 1.2),
             mode: 'rush', chomp: 0, bite: 0, angle: 0, hop: null };
  }

  function flee(e) {
    e.mode = 'flee';
    e.v = Math.max(e.v, 120 * u);
    e.hop = { x0: e.x, x1: e.p.gone ? e.x : e.p.x + 30 * e.p.s * u, y0: e.y };
  }

  function stepEaters(dt) {
    for (let i = eaters.length - 1; i >= 0; i--) {
      const e = eaters[i], p = e.p, x = e.x, y = e.y;
      e.chomp += dt;
      if (e.mode !== 'flee' && p.gone) flee(e);
      if (e.mode === 'rush') {
        const end = tailEnd(p);
        e.x += e.v * dt;
        const k = Math.min(1, Math.max(0, (end.x - e.x) / (60 * u)));
        e.y += (end.y + (e.cruise - end.y) * k - e.y) * Math.min(1, 10 * dt);
        if (e.x >= end.x - 9 * u) { e.mode = 'eat'; e.bite = 0.05; }
      } else if (e.mode === 'eat') {
        const end = tailEnd(p);
        e.x += (end.x - 3 * u - e.x) * Math.min(1, 14 * dt);
        e.y += (end.y - e.y) * Math.min(1, 14 * dt);
        if ((e.bite -= dt) <= 0) {
          p.tail.pop();
          e.bite = 0.12;
          if (!p.tail.length) { p.dying = true; flee(e); }
        }
      } else {
        e.v = Math.min(700 * u, e.v + 1500 * u * dt);
        e.x += e.v * dt;
        const h = e.hop, s = h.x1 > h.x0 ? Math.min(1, (e.x - h.x0) / (h.x1 - h.x0)) : 1;
        e.y = h.y0 + (e.cruise - h.y0) * s - 52 * u * Math.sin(Math.PI * s);
        if (e.x > W + 30 * u) { eaters.splice(i, 1); continue; }
      }
      if (Math.hypot(e.x - x, e.y - y) > 0.5 * u) e.angle = Math.atan2(e.y - y, e.x - x);
    }
  }

  function drawEater(e) {
    const r = 10.5 * u, gape = (0.04 + 0.22 * Math.abs(Math.sin(e.chomp * Math.PI / 0.12))) * Math.PI;
    if (e.mode !== 'eat') {
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
  // The home page's, every twenty to thirty seconds: a pair of scissors
  // swims in from the right, against the stream, along the open water beside
  // the lane of the longest-tailed mRNA in view that no helper is at, turns
  // blades towards the strand, closes in and snips twice; the two pieces
  // drift apart and fade away, and the scissors draw back and swim off to
  // the left, pleased. Here it always comes along the water below the lane,
  // as the recruiters sit above the strand, and cuts between the head and
  // the stem-loop (CUT).

  const below = (lane) => (lane < LANES.length - 1 ? (LANES[lane] + LANES[lane + 1]) / 2 * H : H - 9 * u);

  function sendCutter() {
    let best = null;
    for (const p of tadpoles) {
      if (p.dying || p.marked || p.held || p.calling || p.docked || helpers.some((h) => h.target === p)) continue;
      if (p.x < 0.3 * W || p.x > 0.75 * W) continue;
      if (!best || p.tail.length > best.tail.length) best = p;
    }
    if (!best) return false;
    best.marked = true;                                 // no effector is called to it now, and it loses no more beads
    const cruise = below(best.lane);
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
      // tail; one with an effector docked slows a little, so the work is seen.
      let v = p.v * (p.docked ? 0.6 : 1);
      for (const q of tadpoles) {
        if (q === p || q.lane !== p.lane || q.x <= p.x) continue;
        const gap = tailEnd(q).x - 8 * q.s * u - (p.x + 17 * p.s * u);
        if (gap < 12 * u) v = 0;
        else if (gap < 40 * u) v = Math.min(v, q.v);
      }
      p.x += v * u * dt;
      if (p.cut) { p.cut.x += 0.3 * v * u * dt; p.cut.sink += 5 * u * dt; }   // the 3' piece falls behind
      // No bead is lost to a tail a helper is bringing a base to, called to
      // or docked at, nor to a uridylated one or one the scissors are after.
      const attended = p.held || p.calling || p.docked || helpers.some((h) => h.target === p);
      if (!p.dying && !p.marked && !attended && (p.nibble -= dt) <= 0) nibble(p);
      if (p.doom > 0 && (p.doom -= dt) <= 0) eaters.push(eater(p));
      stepRecruiter(p, dt);
      if (p.dying && (p.fade -= dt / 2.2) <= 0) p.gone = true;
      if (tailEnd(p).x > W + 12 * u) p.gone = true;
      if (p.gone && p.calling) { p.calling.call = null; p.calling = null; }
    }
    for (let i = tadpoles.length - 1; i >= 0; i--) if (tadpoles[i].gone) tadpoles.splice(i, 1);
    if (tadpoles.length < wanted()) spawn();
    for (const c of crumbs) { c.x += c.vx * u * dt; c.y += c.vy * u * dt; c.life -= dt / 1.6; }
    for (const r of rings) r.life -= dt / (r.wide ? 1.1 : 0.7);
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

  function rounded(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const swingOf = (p) => 0.16 * Math.sin(t * 3.2 + p.phase + 0.8);

  function drawStrap(p, x, y, s) {
    const a = swingOf(p), sx = -5 * s, sy = 2.2 * s;
    const gx = x + 3 * s + sx * Math.cos(a) - sy * Math.sin(a);
    const gy = y + 6 * s + sx * Math.sin(a) + sy * Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(x - 5 * s, y + 1 * s, x - 13 * s, y - 13 * s);
    ctx.lineWidth = 1.7 * s; ctx.strokeStyle = p.bag.strap; ctx.stroke();
  }

  function drawBag(p, x, y, s) {
    ctx.save();
    ctx.translate(x + 3 * s, y + 6 * s);
    ctx.rotate(swingOf(p));
    rounded(-5.8 * s, 2 * s, 11.6 * s, 8.8 * s, 2.2 * s);
    ctx.fillStyle = p.bag.body; ctx.fill();
    ctx.lineWidth = 1.1 * s; ctx.strokeStyle = INK; ctx.stroke();
    rounded(-5.8 * s, 2 * s, 11.6 * s, 4.6 * s, 2.2 * s);
    ctx.fillStyle = p.bag.flap; ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 6.6 * s, 1.1 * s, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 0.8 * s; ctx.stroke();
    ctx.restore();
  }

  // The stem-loop on the strand behind the head: two strands paired, with a
  // rung or two between them, and a loop on top. Pt1's loop is filled while
  // it calls.
  function drawStemLoop(p, s) {
    const x = loopX(p), y = backY(p);
    ctx.lineWidth = 1.4 * s; ctx.strokeStyle = STRAND;
    ctx.beginPath();
    ctx.moveTo(x - 2.8 * s, y); ctx.lineTo(x - 2.8 * s, y - 12 * s);
    ctx.moveTo(x + 2.8 * s, y); ctx.lineTo(x + 2.8 * s, y - 12 * s);
    ctx.stroke();
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(x - 2.8 * s, y - 4 * s); ctx.lineTo(x + 2.8 * s, y - 4 * s);
    ctx.moveTo(x - 2.8 * s, y - 8.5 * s); ctx.lineTo(x + 2.8 * s, y - 8.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 16.6 * s, 5 * s, 0, 2 * Math.PI);
    if (p.rec === 'Pt1') {
      ctx.fillStyle = p.calling ? 'rgba(63, 95, 143, 0.35)' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1.6 * s; ctx.strokeStyle = NAVY;
    } else {
      ctx.lineWidth = 1.4 * s; ctx.strokeStyle = STRAND;
    }
    ctx.stroke();
  }

  // ZCCHC14 and ZCCHC2: a small navy body with a face, on the loop; while
  // calling, a hand raised and waving towards the effector.
  function drawProtein(p, s) {
    const r = recruiterAt(p), x = r.x, y = r.y;
    if (p.calling || p.wave > 0) {
      const toward = Math.sign(p.calling ? p.calling.x - x : -1) || -1;
      const a = -Math.PI / 2 + toward * (0.5 + 0.35 * Math.sin(t * 11));
      const hx = x + toward * 5 * s + 11 * s * Math.cos(a), hy = y - 2 * s + 11 * s * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(x + toward * 5 * s, y - 2 * s); ctx.lineTo(hx, hy);
      ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.strokeStyle = NAVY; ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 3.2 * s, 0, 2 * Math.PI);
      ctx.fillStyle = NAVY; ctx.fill();
      ctx.lineCap = 'butt';
    }
    ctx.beginPath();
    ctx.ellipse(x, y, 9.5 * s, 7.5 * s, 0, 0, 2 * Math.PI);
    ctx.fillStyle = NAVY; ctx.fill();
    const look = p.calling ? Math.sign(p.calling.x - x) || -1 : p.docked ? -1 : 0;
    for (const side of [-1, 1]) {
      const ex = x + side * 3 * s + look * 1.6 * s, ey = y - 1.4 * s;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 1.8 * s, 2.1 * s, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + look * 0.6 * s, ey + 0.2 * s, 1 * s, 0, 2 * Math.PI);
      ctx.fillStyle = INK; ctx.fill();
    }
  }

  function drawTadpole(p) {
    const s = p.s * u, x = p.x, y = headY(p), n = p.tail.length;
    ctx.globalAlpha = Math.max(0, p.fade);
    ctx.font = `600 ${8.4 * s}px ${FACE}`;
    ctx.beginPath();                                    // the strand, past the stem-loop, then the beads; once cut, in two
    ctx.moveTo(x - 14 * s, y);
    if (p.cut) { ctx.lineTo(x - (CUT - 2) * s, y); ctx.moveTo(backX(p) - (CUT + 2) * s, backY(p)); }
    ctx.lineTo(backX(p) - (23 + UTR) * s, backY(p));
    for (let i = 0; i < n; i++) { const b = beadAt(p, i); ctx.lineTo(b.x, b.y); }
    ctx.lineWidth = 1.4 * s; ctx.strokeStyle = STRAND; ctx.stroke();
    for (let i = n - 1; i >= 0; i--) { const b = beadAt(p, i); bead(b.x, b.y, p.tail[i], s); }
    drawStemLoop(p, s);
    if (p.rec !== 'Pt1') drawProtein(p, s);
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
    if (W >= 600) {                                     // the recruiter's name: above the protein, beside Pt1's loop
      const r = recruiterAt(p);
      ctx.font = `500 ${8.5 * u}px ${FACE}`;
      ctx.fillStyle = LABEL;
      if (p.rec === 'Pt1') { ctx.textAlign = 'left'; ctx.fillText(p.rec, r.x + 8 * s, r.y + 1 * s); ctx.textAlign = 'center'; }
      else ctx.fillText(p.rec, r.x, r.y - 15 * s);
    }
    ctx.globalAlpha = 1;
  }

  // The line a called effector follows to where it will dock, by its route.
  function drawPath(h) {
    const p = h.call, r = recruiterAt(p), s = p.s * u;
    ctx.save();
    ctx.setLineDash([3 * u, 4 * u]);
    ctx.lineWidth = 1.3 * u; ctx.strokeStyle = bodyOf(h.kind);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    for (const o of h.route) ctx.lineTo(r.x + o.x * s, r.y + o.y * s);
    ctx.stroke();
    ctx.restore();
  }

  // As the home page's helpers are drawn: a body in its colour, two eyes, a
  // hand for a high five, a "!" when startled or called, the base it brings
  // held out in front, and its name where there is room to read it.
  function drawHelper(h) {
    const hop = h.happy > 0 ? 4 * u * Math.sin(Math.PI * (1 - h.happy / 0.9)) : 0;
    const x = h.x, y = h.y + (h.dock ? 0 : 1.5 * u * Math.sin(t * 2 + h.phase)) - hop, f = h.face;
    const rush = h.dash ? Math.min(1, Math.abs(h.dash.vx) / (170 * u)) : h.call && h.route ? 0.7 : 0;
    const body = bodyOf(h.kind);
    if (h.five) {
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
    if (h.surprise > 0) {
      ctx.beginPath();
      ctx.arc(x + h.look * 1.5 * u, y + 3.8 * u, 1.4 * u, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.globalAlpha = Math.min(1, h.surprise / 0.4);
      ctx.font = `700 ${13 * u}px ${FACE}`;
      ctx.fillStyle = INK;
      ctx.fillText('!', x + 3 * u * f, y - 17 * u - 2 * u * Math.sin(Math.min(1, (1.5 - h.surprise) * 6) * Math.PI));
      ctx.globalAlpha = 1;
    }
    const blink = h.blinks.length % 2 === 1;
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
    if (h.target || h.call) {
      ctx.font = `600 ${8.4 * 0.85 * u}px ${FACE}`;
      bead(x + 17 * u * f, y + 2 * u, baseOf(h.kind), 0.85 * u);
    }
    if (W >= 600) {
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
      ctx.globalAlpha = Math.max(0, r.life) * (r.wide ? 0.7 : 1);
      ctx.beginPath();
      ctx.arc(r.x, r.y, (r.wide ? 9 + 26 * (1 - r.life) : 5 + 12 * (1 - r.life)) * u, 0, 2 * Math.PI);
      ctx.lineWidth = 1.5 * u; ctx.strokeStyle = r.color; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    [...tadpoles].sort((a, b) => a.s - b.s).forEach(drawTadpole);
    eaters.forEach(drawEater);
    cutters.forEach(drawCutter);
    helpers.forEach((h) => { if (h.call) drawPath(h); });
    helpers.forEach(drawHelper);
    for (const c of claps) {                            // the slap of a high five
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
    for (const f of flights) {                          // a base on its way to a tail, as on the home page
      ctx.font = `600 ${8.4 * 0.85 * u}px ${FACE}`;
      bead(f.x, f.y, baseOf(f.kind), 0.85 * u);
    }
  }

  // ---- Start, and the clock ------------------------------------------------------
  // As on the home page: under way from the start, about 30 frames a second,
  // stepping down on a device that cannot keep up, and nothing drawn while
  // out of view or in a hidden tab.

  size();
  if (!W || !H) return;
  for (let i = 0, n = wanted(); i < n; i++) {
    const x = (i + 0.5) / n * W + between(-30, 30) * u;
    tadpoles.push(tadpole(x, i % LANES.length, Math.max(3, Math.round(13 - 9 * x / W + between(-2, 2)))));
  }
  // The home page's four across a wide scene, grey and red in turn, and
  // PAPγ in the middle; a phone has room for three.
  if (W >= 600) [['TENT4A', 0.18], ['TUT4', 0.4], ['PAPγ', 0.5], ['TENT4B', 0.6], ['TUT7', 0.82]].forEach(([k, at]) => helpers.push(helper(k, at)));
  else [['TENT4A', 0.2], ['PAPγ', 0.5], ['TUT7', 0.8]].forEach(([k, at]) => helpers.push(helper(k, at)));
  for (let i = 0; i < 90; i++) step(1 / 15);
  // And one recruiting at once, as the page opens: any call the warm-up
  // left half done is dropped, and the mRNA nearest the middle of the view
  // that can call an effector of its kind with a clear way calls it. Its
  // tail is first made one that effector adds to (cut back to six, ending
  // in an A), and, if none is within call, the first of its kind is put
  // beside the recruiter, which, done before the first frame is drawn, no
  // one sees.
  for (const h of helpers) if (h.call) { h.call.calling = null; h.call = null; h.surprise = 0; }
  for (const p of [...tadpoles].sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2))) {
    if (p.dying || p.docked || p.marked || p.x < 0.12 * W || p.x > 0.8 * W) continue;
    if (helpers.some((o) => o.target === p)) continue;
    if (!needs(p)) { p.tail = p.tail.slice(0, 6); while (p.tail.length && p.tail[p.tail.length - 1] !== 'A') p.tail.pop(); }
    if (!needs(p)) continue;
    const ok = (h) => !h.dock && !h.five && !h.dash;
    if (call(p, ok)) break;
    const r = recruiterAt(p), h = helpers.find((o) => o.kind.startsWith(CALLS[p.rec]) && ok(o));
    if (!h) continue;
    h.x = r.x - 50 * u; h.y = Math.max(26 * u, r.y + 4 * u);
    if (call(p, ok)) break;
  }

  const PERIODS = [30, 45, 78];
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
  if (document.fonts) document.fonts.ready.then(draw);
  schedule();
})();
