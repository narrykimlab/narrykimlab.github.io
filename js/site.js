/*
 * The site's script: the home page photo carousel, the photos page's
 * viewer, the Cite window of the paper lists, the topic list on
 * /publications/by-topic/, and the email buttons on the people and member
 * pages. It drives Bootstrap 3's carousel classes
 * itself, without jQuery or Bootstrap's own JS.
 *
 * Loaded with `defer` from _includes/head.html, so it runs once the document
 * is parsed. It lives in a file, not inline, so the site works under a
 * Content-Security-Policy without 'unsafe-inline' in script-src.
 */
(() => {
  'use strict';

  // Calls done() once el's own CSS transition ends, or after ms in case no
  // transitionend arrives (Bootstrap 3 used the same fallback).
  function afterTransition(el, ms, done) {
    let finished = false;
    const finish = (e) => {
      if (finished || (e && e.target !== el)) return;
      finished = true;
      el.removeEventListener('transitionend', finish);
      done();
    };
    el.addEventListener('transitionend', finish);
    setTimeout(finish, ms + 50);
  }

  // Carousel: <div class="carousel slide" data-ride="carousel"
  //   data-interval="3000" data-pause="hover"> as in _pages/home.md.
  function carousel(root) {
    const items = root.querySelectorAll('.carousel-inner > .item');
    const dots = root.querySelectorAll('.carousel-indicators [data-slide-to]');
    const interval = parseInt(root.dataset.interval, 10) || 5000;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = Math.max(0, [...items].findIndex((item) => item.classList.contains('active')));
    let sliding = false;
    let hovered = false;
    let focused = false;
    let timer = null;

    // Every slide but the first is loading="lazy", and a lazy image inside a
    // hidden slide only starts loading once that slide slides in. Asking for
    // the next one ahead of time keeps it from arriving blank.
    function preload(index) {
      const img = items[index].querySelector('img[loading="lazy"]');
      if (img) img.loading = 'eager';
    }

    function slide(to, type) {
      if (sliding || to === current) return;
      const from = items[current];
      const next = items[to];
      const direction = type === 'next' ? 'left' : 'right';
      sliding = true;
      dots[current]?.classList.remove('active');
      dots[to]?.classList.add('active');
      next.classList.add(type);
      void next.offsetWidth;  // lay it out off-screen so the move animates
      from.classList.add(direction);
      next.classList.add(direction);
      afterTransition(from, 600, () => {
        next.classList.remove(type, direction);
        next.classList.add('active');
        from.classList.remove('active', direction);
        current = to;
        sliding = false;
        preload((to + 1) % items.length);
      });
    }

    const step = (by) => slide((current + by + items.length) % items.length, by > 0 ? 'next' : 'prev');
    const goTo = (index) => slide(index, index > current ? 'next' : 'prev');

    function stop() {
      clearInterval(timer);
      timer = null;
    }
    // Restarts the countdown, as Bootstrap did after every manual move. Under
    // prefers-reduced-motion the slides only move when asked to.
    function start() {
      stop();
      if (!hovered && !focused && !still.matches) timer = setInterval(() => step(1), interval);
    }

    root.addEventListener('click', (e) => {
      const control = e.target.closest('[data-slide], [data-slide-to]');
      if (!control) return;
      e.preventDefault();
      if (control.dataset.slideTo !== undefined) goTo(parseInt(control.dataset.slideTo, 10));
      else step(control.dataset.slide === 'prev' ? -1 : 1);
      start();
    });

    root.addEventListener('keydown', (e) => {
      if (/^(input|textarea)$/i.test(e.target.tagName)) return;
      // The arrows are links with role="button", and a button answers Space
      // as well as the Enter a link already does.
      if (e.key === ' ' && e.target.matches('[data-slide]')) {
        e.preventDefault();
        e.target.click();
        return;
      }
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else return;
      e.preventDefault();
      start();
    });

    // Keyboard focus anywhere in the carousel holds it still, as the mouse
    // does, so a keyboard user can stop it (WCAG 2.2.2). Only focus the
    // browser shows counts: a mouse click on an arrow focuses it too, and
    // should not stop the carousel once the mouse moves away.
    root.addEventListener('focusin', (e) => {
      if (!e.target.matches(':focus-visible')) return;
      focused = true;
      stop();
    });
    root.addEventListener('focusout', (e) => {
      if (root.contains(e.relatedTarget)) return;
      focused = false;
      start();
    });

    if (root.dataset.pause === 'hover') {
      // Mouse only: a tap on a phone also fires enter but never leave, which
      // would stop the carousel for good.
      root.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        hovered = true;
        stop();
      });
      root.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        hovered = false;
        start();
      });
    }

    preload((current + 1) % items.length);
    start();
    still.addEventListener('change', start);
  }

  document.querySelectorAll('[data-ride="carousel"]').forEach(carousel);

  // Photo viewer: <dialog class="lightbox"> on the photos page. A click on a
  // photo (a link marked data-lightbox) opens it over the darkened page; the
  // buttons, the arrow keys and a sideways swipe move through the photos in
  // page order, newest first, wrapping round at the ends; the close button,
  // Escape and a click on the dark ground close it, and focus goes back to the
  // photo it was opened from. A click meant for a new tab still goes to the
  // file, and so does every click where dialogs are not supported.
  //
  // Focus rests on the dialog itself (tabindex="-1", no ring), not on a
  // button: the browser would otherwise draw its keyboard ring on whichever
  // button had focus at the first arrow key. A mouse click on a button hands
  // focus back to the dialog for the same reason; Tab still reaches the
  // buttons, ring and all.
  function lightbox(dialog) {
    const links = [...document.querySelectorAll('a[data-lightbox]')];
    if (!links.length || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('.lightbox-img');
    const date = dialog.querySelector('.lightbox-date');
    const text = dialog.querySelector('.lightbox-text');
    const count = dialog.querySelector('.lightbox-count');
    const wrap = (i) => (i + links.length) % links.length;
    let current = 0;
    let opener = null;
    let openedByKey = false;
    let swipedAt = 0;

    function show(i) {
      current = wrap(i);
      const link = links[current];
      const thumb = link.querySelector('img');
      img.src = link.href;
      img.alt = thumb ? thumb.alt : '';
      date.textContent = link.dataset.date || '';
      text.textContent = link.dataset.caption || '';
      count.textContent = `${current + 1} / ${links.length}`;
      // Fetch the neighbours now, so the next move shows its photo at once.
      [current - 1, current + 1].forEach((j) => { new Image().src = links[wrap(j)].href; });
    }

    function close() {
      dialog.close();
    }

    links.forEach((link, i) => {
      link.addEventListener('click', (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        opener = link;
        openedByKey = e.detail === 0;   // Enter on the link, not a click
        show(i);
        document.documentElement.classList.add('lightbox-open');
        dialog.showModal();
        dialog.focus();
      });
    });

    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('lightbox-open');
      img.removeAttribute('src');
      // Back on the photo it was opened from, with the keyboard ring only if
      // it was opened from the keyboard: after a mouse click, Escape would
      // otherwise ring the photo. .quiet-focus holds the ring off until focus
      // leaves the photo, so Tab back to it shows the ring as ever.
      const photo = opener;
      if (!photo) return;
      if (!openedByKey) {
        photo.classList.add('quiet-focus');
        photo.addEventListener('blur', () => photo.classList.remove('quiet-focus'), { once: true });
      }
      photo.focus();
    });

    // e.detail is the click count: 0 for Enter or Space, which keep focus on
    // the button they pressed.
    const button = (selector, action) => {
      dialog.querySelector(selector).addEventListener('click', (e) => {
        action();
        if (e.detail > 0 && dialog.open) dialog.focus();
      });
    };
    button('.lightbox-prev', () => show(current - 1));
    button('.lightbox-next', () => show(current + 1));
    button('.lightbox-close', close);

    // The dark ground is the dialog and its stage around the photo; a click
    // there closes the viewer, unless it ended a swipe.
    dialog.addEventListener('click', (e) => {
      if (Date.now() - swipedAt < 500) return;
      if (e.target === dialog || e.target.classList.contains('lightbox-stage')) close();
    });

    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else return;
      e.preventDefault();
    });

    // One finger moving sideways at least 50px, and more sideways than up or
    // down, is a swipe; two fingers are a pinch, left to the browser.
    let startX = null;
    let startY = null;
    dialog.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { startX = null; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    dialog.addEventListener('touchend', (e) => {
      if (startX === null || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      swipedAt = Date.now();
      show(current + (dx < 0 ? 1 : -1));
    });
  }

  document.querySelectorAll('dialog.lightbox').forEach(lightbox);

  // Cite window: <dialog class="cite-dialog"> (_includes/cite_dialog.html)
  // on the pages that list papers. A Cite button under a paper opens it with
  // that paper's citation in the form chosen at the top -- APA, Nature,
  // BibTeX, EndNote or RIS -- from /publications/cite.json
  // (_plugins/citations.rb), fetched the first time a button is pressed.
  // Copy puts the text on the clipboard, or, where the browser will not,
  // selects it to copy by hand; the three reference-manager forms can also
  // be saved as a file. The close button, Escape and a click on the dimmed
  // page close it, and focus goes back to the button it was opened from,
  // ringed only if it was opened from the keyboard (as in the photo viewer).
  // The buttons stay hidden where dialogs are not supported.
  //
  // Everything shown is set as text (textContent), never parsed as HTML.
  function citeWindow(dialog) {
    const buttons = document.querySelectorAll('button.cite-button');
    if (!buttons.length || typeof dialog.showModal !== 'function') return;
    const paper = dialog.querySelector('.cite-paper');
    const text = dialog.querySelector('.cite-text');
    const formats = [...dialog.querySelectorAll('[data-format]')];
    const save = dialog.querySelector('.cite-save');
    const status = dialog.querySelector('.cite-status');
    // The forms that are also files: extension and media type.
    const FILES = {
      bibtex: ['bib', 'application/x-bibtex'],
      endnote: ['enw', 'application/x-endnote-refer'],
      ris: ['ris', 'application/x-research-info-systems'],
    };
    let citations = null;   // the fetch of cite.json, made once
    let id = null;          // the paper shown
    let entry = null;       // its citations, once loaded
    let format = 'apa';
    let opener = null;
    let openedByKey = false;

    // A failed fetch is forgotten, so the next Cite button tries again.
    const load = () => citations || (citations = fetch(dialog.dataset.src, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`cite.json: ${r.status}`);
        return r.json();
      })
      .catch((e) => {
        citations = null;
        throw e;
      }));

    function show() {
      formats.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.format === format)));
      const file = FILES[format];
      text.classList.toggle('cite-code', Boolean(file));
      text.textContent = entry ? entry[format] : text.textContent;
      save.hidden = !(entry && file);
      if (file) save.textContent = `Download .${file[0]}`;
      status.textContent = '';
    }

    function open(button, byKey) {
      opener = button;
      openedByKey = byKey;
      id = button.dataset.cite;
      entry = null;
      paper.textContent = button.closest('p, li')?.querySelector('.publi_title')?.textContent || '';
      text.textContent = 'Loading…';
      show();
      document.documentElement.classList.add('cite-open');
      dialog.showModal();
      dialog.focus();
      const asked = id;
      load().then((all) => {
        if (asked !== id || !dialog.open) return;   // closed, or another paper since
        entry = Object.prototype.hasOwnProperty.call(all, id) ? all[id] : null;
        if (!entry) text.textContent = 'No citation was found for this paper.';
        show();
      }, () => {
        if (asked !== id || !dialog.open) return;
        text.textContent = 'The citation could not be loaded. Close this and try again.';
      });
    }

    buttons.forEach((button) => {
      button.hidden = false;
      // e.detail is the click count: 0 for Enter or Space.
      button.addEventListener('click', (e) => open(button, e.detail === 0));
    });

    formats.forEach((b) => b.addEventListener('click', () => {
      format = b.dataset.format;
      show();
    }));

    dialog.querySelector('.cite-copy').addEventListener('click', () => {
      if (!entry) return;
      const byHand = () => {
        const range = document.createRange();
        range.selectNodeContents(text);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'Selected: press Ctrl+C (⌘C on a Mac) to copy.';
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(entry[format]).then(() => { status.textContent = 'Copied.'; }, byHand);
      } else {
        byHand();
      }
    });

    save.addEventListener('click', () => {
      const file = FILES[format];
      if (!entry || !file) return;
      const url = URL.createObjectURL(new Blob([entry[format]], { type: `${file[1]};charset=utf-8` }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${id}.${file[0]}`;
      dialog.append(link);   // inside the dialog: the page behind it is inert
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    });

    dialog.querySelector('.cite-close').addEventListener('click', () => dialog.close());

    // The dialog's box is all .cite-box, so a click on the dialog itself is
    // a click on the dimmed page around it -- if it began there too: a
    // selection dragged out of the text ends in a click on the dialog.
    let downOutside = false;
    dialog.addEventListener('pointerdown', (e) => { downOutside = e.target === dialog; });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && downOutside) dialog.close();
    });

    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('cite-open');
      id = null;
      const button = opener;
      if (!button) return;
      if (!openedByKey) {
        button.classList.add('quiet-focus');
        button.addEventListener('blur', () => button.classList.remove('quiet-focus'), { once: true });
      }
      button.focus();
    });
  }

  document.querySelectorAll('dialog.cite-dialog').forEach(citeWindow);

  // The topic list beside the papers on /publications/by-topic/ marks the
  // topic being read: the last heading to have scrolled above a line a third
  // of the way down the window. Above the first topic, and past the last
  // (the book chapters and patents), none is marked.
  document.querySelectorAll('.topic-nav').forEach((nav) => {
    const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.hash.slice(1), a]));
    const headings = [...document.querySelectorAll('.topic-sections h2[id]')];
    let marked = null;
    let queued = false;

    function mark() {
      queued = false;
      const line = window.innerHeight / 3;
      let current = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > line) break;
        current = heading;
      }
      const link = (current && links.get(current.id)) || null;
      if (link === marked) return;
      marked?.removeAttribute('aria-current');
      link?.setAttribute('aria-current', 'true');
      marked = link;
    }

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(mark);
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    mark();
  });

  // An email button holds the address as text with a hidden word inside it
  // (_includes/email_chip.html), which address harvesters reading the HTML
  // pick up as is. Here it becomes a mailto link like the buttons beside it.
  document.querySelectorAll('span.email-chip').forEach((chip) => {
    const copy = chip.cloneNode(true);
    copy.querySelectorAll('.qb-hidden').forEach((el) => el.remove());
    const link = document.createElement('a');
    link.className = chip.className;
    link.href = 'mailto:' + copy.textContent.trim();
    link.append(...chip.childNodes);
    chip.replaceWith(link);
  });
})();
