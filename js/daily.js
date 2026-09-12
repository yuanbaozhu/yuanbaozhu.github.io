/* ==========================================================
   《日常》漫画分镜 — 滚动预览 + 全部分镜浏览
   后续上传分镜：把 null 换成 "../images/daily-p-06.jpg" 即可，
   滚动预览与浏览页会自动同步，无需改 HTML。
   ========================================================== */
(function () {
  'use strict';

  var TOTAL = 27;
  var IMG_PREFIX = '../images/daily-p-';
  // 前 5 页已上传；其余保持 null，页面自动渲染占位
  var PAGES = (function () {
    var arr = new Array(TOTAL).fill(null);
    for (var i = 1; i <= 27; i++) {
      arr[i - 1] = IMG_PREFIX + (i < 10 ? '0' + i : String(i)) + '.jpg';
    }
    return arr;
  })();

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function pageEl(index, clone) {
    var no = pad(index + 1);
    var fig = document.createElement('figure');
    fig.className = 'daily-reel-page' + (PAGES[index] ? '' : ' is-empty');
    if (PAGES[index]) {
      var img = document.createElement('img');
      img.src = PAGES[index];
      img.alt = '日常漫画分镜 第' + no + '页';
      // 第一组（可见轨道）立即加载，复制组懒加载
      img.loading = clone ? 'lazy' : 'eager';
      img.decoding = 'async';
      fig.appendChild(img);
    } else {
      var noEl = document.createElement('span');
      noEl.className = 'daily-reel-pageno';
      noEl.textContent = no + ' / ' + TOTAL;
      var todo = document.createElement('span');
      todo.className = 'daily-reel-todo';
      todo.textContent = '分镜待上传';
      fig.appendChild(noEl);
      fig.appendChild(todo);
    }
    return fig;
  }

  // ---------- 1. 首页矩形滚动预览：两个独立 grid 纵向堆叠，translateY -50% 无缝 ----------
  function initReel() {
    var track = document.getElementById('dailyReelTrack');
    if (!track) return;
    for (var loop = 0; loop < 2; loop++) {
      var grid = document.createElement('div');
      grid.className = 'daily-reel-grid';
      var frag = document.createDocumentFragment();
      for (var i = 0; i < TOTAL; i++) frag.appendChild(pageEl(i, loop === 1));
      grid.appendChild(frag);
      track.appendChild(grid);
    }
  }

  // ---------- 2. 全部分镜浏览页 ----------
  function initAllPage() {
    var list = document.getElementById('dailyAllList');
    if (!list) return;
    var frag = document.createDocumentFragment();
    PAGES.forEach(function (src, i) {
      var no = pad(i + 1);
      var li = document.createElement('li');
      li.className = 'daily-all-item' + (src ? '' : ' is-empty');
      var fig = document.createElement('figure');
      fig.className = 'daily-all-figure';
      if (src) {
        (function (idx) {
          fig.setAttribute('tabindex', '0');
          fig.setAttribute('role', 'button');
          fig.setAttribute('aria-label', '放大查看第' + pad(idx + 1) + '页');
          var img = document.createElement('img');
          img.src = src;
          img.alt = '日常漫画分镜 第' + no + '页';
          img.loading = 'lazy';
          img.decoding = 'async';
          fig.appendChild(img);
          var open = function () { openLightbox(idx); };
          fig.addEventListener('click', open);
          fig.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
          });
        })(i);
      } else {
        var todo = document.createElement('span');
        todo.className = 'daily-all-todo';
        todo.textContent = '第' + no + '页 · 分镜待上传';
        fig.appendChild(todo);
      }
      li.appendChild(fig);
      var cap = document.createElement('p');
      cap.className = 'daily-all-pageno';
      cap.textContent = no + ' / ' + TOTAL;
      li.appendChild(cap);
      frag.appendChild(li);
    });
    list.appendChild(frag);
  }

  // ---------- 3. 独立灯箱（仅在已上传页之间左右切换） ----------
  var lb, lbImg, lbCap, current = 0;
  function uploadedIndexes() {
    var ids = [];
    PAGES.forEach(function (s, i) { if (s) ids.push(i); });
    return ids;
  }
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'daily-lightbox';
    lb.hidden = true;
    lb.innerHTML =
      '<button class="daily-lightbox-btn daily-lightbox-close" aria-label="关闭">&times;</button>' +
      '<button class="daily-lightbox-btn daily-lightbox-prev" aria-label="上一页">‹</button>' +
      '<img class="daily-lightbox-img" alt="" />' +
      '<button class="daily-lightbox-btn daily-lightbox-next" aria-label="下一页">›</button>' +
      '<p class="daily-lightbox-cap"></p>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.daily-lightbox-img');
    lbCap = lb.querySelector('.daily-lightbox-cap');
    lb.querySelector('.daily-lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.daily-lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.daily-lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  }
  function show(index) {
    current = index;
    lbImg.src = PAGES[index];
    lbImg.alt = '日常漫画分镜 第' + pad(index + 1) + '页';
    lbCap.textContent = pad(index + 1) + ' / ' + TOTAL;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function openLightbox(index) {
    if (!lb) buildLightbox();
    show(index);
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
  }
  function step(dir) {
    var ids = uploadedIndexes();
    var pos = ids.indexOf(current);
    var next = (pos + dir + ids.length) % ids.length;
    show(ids[next]);
  }
  document.addEventListener('keydown', function (e) {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // ---------- init ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initReel(); initAllPage(); });
  } else {
    initReel();
    initAllPage();
  }
})();

