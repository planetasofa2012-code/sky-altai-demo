/* Общая анимация гостевых страниц: появление блоков при прокрутке. Только прозрачность и сдвиг, без библиотек.
   Элементу с атрибутом data-rv добавляется класс rv (скрыт и смещён), а при появлении на экране класс in.
   Если JavaScript не сработал или в системе включено «уменьшить движение», всё остаётся видимым. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reveal(root) {
    var els = Array.prototype.slice.call((root || document).querySelectorAll('[data-rv]:not(.rv)'));
    els.forEach(function (el, i) { el.classList.add('rv'); el.style.setProperty('--i', el.getAttribute('data-rv') || (i % 5)); });
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  window.FX = { reduce: reduce, reveal: reveal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { reveal(); });
  else reveal();
})();
