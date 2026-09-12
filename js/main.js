// ============ 顶部导航：滚动后显示分割线 ============
const navbar = document.getElementById('navbar');

function onScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============ 移动端菜单开关 ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// 点击菜单项后收起移动端菜单
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============ 作品卡片滚动入场 ============
const cards = document.querySelectorAll('.work-card');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  cards.forEach((card, i) => {
    // 轻微错开，形成依次入场效果
    card.style.transitionDelay = `${(i % 3) * 80}ms`;
    observer.observe(card);
  });
} else {
  cards.forEach((card) => card.classList.add('visible'));
}

// ============ 作品画廊：点击图片全屏查看（灯箱） ============
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(item) {
    const img = item.querySelector('img');
    const figcaption = item.querySelector('figcaption');
    if (!img) return;

    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = figcaption
      ? figcaption.textContent.replace(/\s+/g, ' ').trim()
      : img.alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.gallery-item, .char-figure').forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  lightboxClose.addEventListener('click', closeLightbox);

  // 点击遮罩空白处关闭
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Esc 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}

/* ==========================================================
   首页 Hero — Live2D 风格鼠标视差
   鼠标位置归一化为 -1 ~ 1，rAF 缓动写入 --mx / --my
   ========================================================== */
(function () {
  const hero = document.querySelector('.hero--live');
  if (!hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (reduceMotion || isTouch) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let running = false;

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  });

  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function loop() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    hero.style.setProperty('--mx', currentX.toFixed(4));
    hero.style.setProperty('--my', currentY.toFixed(4));

    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }
})();

/* ==========================================================
   深海写实视频背景（全站循环播放）+ 水波纹 + 作品卡漂浮
   ========================================================== */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- 1. 全站深海视频背景（循环播放列表） ---------- */
  const isSubpage = location.pathname.indexOf('/works/') !== -1;
  const mediaBase = isSubpage ? '../media/' : 'media/';
  const clips = ['ocean-sardines.mp4', 'ocean-coral.mp4'];

  const bg = document.createElement('div');
  bg.className = 'ocean-video-bg';
  bg.setAttribute('aria-hidden', 'true');
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = mediaBase + clips[0];
  bg.appendChild(video);
  document.body.appendChild(bg);

  let clipIndex = 0;
  function playClip(i) {
    bg.classList.add('is-switching');
    setTimeout(() => {
      video.src = mediaBase + clips[i];
      video.load();
      video.play().catch(() => {});
      const onReady = () => {
        bg.classList.remove('is-switching');
        video.removeEventListener('canplay', onReady);
      };
      video.addEventListener('canplay', onReady);
    }, 500);
  }
  video.addEventListener('ended', () => {
    clipIndex = (clipIndex + 1) % clips.length;
    playClip(clipIndex);
  });
  video.addEventListener('error', () => {
    /* 视频缺失时保留深海底色，不中断浏览 */
  });
  video.play().catch(() => {});

  /* 视频层鼠标视差（Live2D 感，全站跟随） */
  if (!reduceMotion && !isCoarse) {
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = false;
    window.addEventListener(
      'pointermove',
      (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!raf) {
          raf = true;
          requestAnimationFrame(step);
        }
      },
      { passive: true }
    );
    function step() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      document.documentElement.style.setProperty('--vmx', cx.toFixed(4));
      document.documentElement.style.setProperty('--vmy', cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        requestAnimationFrame(step);
      } else {
        raf = false;
      }
    }
  }

  if (reduceMotion) return;

  /* ---------- 2. 鼠标水波纹（全站跟随） ---------- */
  let lastRX = -999;
  let lastRY = -999;
  let lastRT = 0;

  function spawnRipple(x, y, size, strong) {
    const r = document.createElement('span');
    r.className = 'ocean-ripple';
    r.style.cssText =
      'left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;' +
      '--rr:' + (Math.random() * 26 - 13).toFixed(1) + 'deg;' +
      'animation-duration:' + (strong ? 1 : 0.8 + Math.random() * 0.25).toFixed(2) + 's;';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      const dx = e.clientX - lastRX;
      const dy = e.clientY - lastRY;
      if (now - lastRT < 110 && dx * dx + dy * dy < 3600) return;
      lastRX = e.clientX;
      lastRY = e.clientY;
      lastRT = now;
      spawnRipple(e.clientX, e.clientY, 60 + Math.random() * 40);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') return;
      spawnRipple(e.clientX, e.clientY, 120, true);
    },
    { passive: true }
  );

  /* ---------- 3. 作品卡：水中漂浮 + 鼠标拨动 + 卡面涟漪 ---------- */
  const grid = document.querySelector('.works-grid');

  if (grid && !isCoarse) {
    const cards = Array.from(grid.querySelectorAll('.work-card')).map((el) => ({
      el,
      link: el.querySelector('.work-link'),
      cover: el.querySelector('.work-cover'),
      phase: Math.random() * Math.PI * 2,
      speed: 0.55 + Math.random() * 0.5,
      bobY: 0,
      bobR: 0,
      rx: 0,
      ry: 0,
      tx: 0,
      ty: 0,
      tRx: 0,
      tRy: 0,
      tTx: 0,
      tTy: 0,
      lastCrx: -999,
      lastCry: -999,
    }));

    cards.forEach((c) => {
      c.el.addEventListener('pointermove', (e) => {
        const rect = c.el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        c.tRy = nx * 7; // rotateY：左右拨动
        c.tRx = -ny * 6; // rotateX：上下拨动
        c.tTx = nx * 5;
        c.tTy = ny * 5;

        // 卡面涟漪（划过封面泛起水纹）
        if (!c.cover) return;
        const coverRect = c.cover.getBoundingClientRect();
        const cx = e.clientX - coverRect.left;
        const cy = e.clientY - coverRect.top;
        const ddx = cx - c.lastCrx;
        const ddy = cy - c.lastCry;
        if (cx >= 0 && cy >= 0 && cx <= coverRect.width && cy <= coverRect.height &&
            ddx * ddx + ddy * ddy > 3000) {
          c.lastCrx = cx;
          c.lastCry = cy;
          const r = document.createElement('span');
          r.className = 'card-ripple';
          r.style.left = cx + 'px';
          r.style.top = cy + 'px';
          r.style.width = r.style.height = 46 + Math.random() * 30 + 'px';
          c.cover.appendChild(r);
          r.addEventListener('animationend', () => r.remove());
        }
      });

      c.el.addEventListener('pointerleave', () => {
        c.tRx = 0;
        c.tRy = 0;
        c.tTx = 0;
        c.tTy = 0;
      });
    });

    function floatTick(now) {
      const t = now / 1000;
      cards.forEach((c) => {
        const tbY = Math.sin(t * c.speed * 1.7 + c.phase) * 7;
        const tbR = Math.sin(t * c.speed * 1.2 + c.phase * 1.6) * 0.7;
        c.bobY += (tbY - c.bobY) * 0.06;
        c.bobR += (tbR - c.bobR) * 0.06;
        c.rx += (c.tRx - c.rx) * 0.12;
        c.ry += (c.tRy - c.ry) * 0.12;
        c.tx += (c.tTx - c.tx) * 0.12;
        c.ty += (c.tTy - c.ty) * 0.12;

        const s = c.link.style;
        s.setProperty('--bobY', c.bobY.toFixed(2) + 'px');
        s.setProperty('--bobR', c.bobR.toFixed(2) + 'deg');
        s.setProperty('--rx', c.rx.toFixed(2) + 'deg');
        s.setProperty('--ry', c.ry.toFixed(2) + 'deg');
        s.setProperty('--tx', c.tx.toFixed(2) + 'px');
        s.setProperty('--ty', c.ty.toFixed(2) + 'px');
      });
      requestAnimationFrame(floatTick);
    }
    requestAnimationFrame(floatTick);
  }
})();
