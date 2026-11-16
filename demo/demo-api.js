/* «Сервер в браузере» для статичного демо на GitHub Pages: отвечает на запросы страницы брони (/api/...) по данным
   из demo-data.js с теми же правилами, что в настоящем сервере: холодные дома только апрель-октябрь, минимальный срок,
   цены по периодам (округление до 50 ₽), доп. место 700 ₽, окна бани с перерывом 30 минут. Заявки никуда не отправляются. */
(function () {
  var D = window.DEMO_DATA, EXTRA = 700, BUF = 30, OPEN = 600, CLOSE = 1380, STEP = 30;
  var realFetch = window.fetch.bind(window);
  function addDays(s, n) { var d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function nights(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }
  function min(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function unitOpen(u, a, b) {
    if (u.season === 'all') return true;
    for (var d = a; d < b; d = addDays(d, 1)) { var m = +d.slice(5, 7); if (m < 4 || m > 10) return false; }
    return true;
  }
  function busy(uid, a, b) {
    return D.bookings.some(function (x) { return x.unit_id === uid && x.check_in < b && x.check_out > a; });
  }
  function minStay(a) {
    var best = 1, note = '';
    D.stay_rules.forEach(function (r) { if (r.active && r.date_from <= a && r.date_to >= a && r.min_nights > best) { best = r.min_nights; note = r.note; } });
    return [best, note];
  }
  function pct(d) {
    var p = 0;
    D.price_rules.slice().sort(function (x, y) { return x.id - y.id; }).forEach(function (r) { if (r.active && r.date_from <= d && r.date_to >= d) p = r.percent; });
    return p;
  }
  function nightPrice(price, p) { return p === 0 ? price : Math.max(0, Math.round(price * (100 + p) / 100 / 50) * 50); }
  function cost(price, a, b, beds) {
    var room = 0, n = nights(a, b);
    for (var d = a; d < b; d = addDays(d, 1)) room += nightPrice(price, pct(d));
    return { nights: n, room: room, room_base: n * price, extra: n * beds * EXTRA, total: room + beds * n * EXTRA };
  }
  function ok(body) { return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  function fail(code, msg) { return new Response(JSON.stringify({ detail: msg }), { status: code, headers: { 'Content-Type': 'application/json' } }); }

  function handle(path, q, opt) {
    if (path === '/today') return ok({ date: D.today });
    if (path === '/menu') return ok(D.menu);
    if (path === '/calendar') {
      var y = +q.month.slice(0, 4), m = +q.month.slice(5), out = [], d = q.month + '-01', last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (var i = 0; i < last; i++) {
        var nx = addDays(d, 1), open = D.units.filter(function (u) { return unitOpen(u, d, nx); });
        var free = d < D.today ? 0 : open.filter(function (u) { return !busy(u.id, d, nx); }).length;
        out.push({ date: d, free: free, total: open.length, min_nights: minStay(d)[0], price_pct: pct(d) });
        d = nx;
      }
      return ok(out);
    }
    if (path === '/min-stay') {
      var ms = minStay(q.from), n = nights(q.from, q.to);
      return ok({ min_nights: ms[0], nights: n, ok: n >= ms[0], note: ms[1] });
    }
    if (path === '/availability') {
      var g = +q.guests || 1, res = [];
      D.units.slice().sort(function (x, y) { return x.sort - y.sort || x.id - y.id; }).forEach(function (u) {
        if (u.capacity >= g && unitOpen(u, q.from, q.to) && !busy(u.id, q.from, q.to)) {
          var need = Math.max(0, g - u.base_guests), c = cost(u.price, q.from, q.to, need);
          res.push(Object.assign({}, u, { nights: c.nights, extra_needed: need, price_total: c.total, price_room: c.room, price_room_base: c.room_base }));
        }
      });
      return ok(res);
    }
    if (path === '/bath/free') {
      var dur = +q.duration || 120, free = [];
      for (var t = OPEN; t + dur <= CLOSE; t += STEP) {
        var clash = D.bath.some(function (s) { return s.date === q.date && t < min(s.end) + BUF && min(s.start) < t + dur + BUF; });
        if (!clash) free.push({ start: hm(t), end: hm(t + dur) });
      }
      return ok(free);
    }
    if (path === '/checkout') {
      var body = {}; try { body = JSON.parse(opt.body); } catch (e) {}
      var st = body.stay || {}, u = D.units.filter(function (x) { return x.id === st.unit_id; })[0];
      if (!u) return fail(404, 'Номер не найден');
      var need = minStay(st.check_in);
      if (nights(st.check_in, st.check_out) < need[0]) return fail(409, 'При заезде бронь возможна от ' + need[0] + ' ночей');
      var c = cost(u.price, st.check_in, st.check_out, st.extra_beds || 0), foodSum = 0, bathPrice = 0;
      (body.food || []).forEach(function (f) { var it = D.menu.filter(function (x) { return x.id === f.menu_item_id; })[0]; if (it) foodSum += it.price * f.qty; });
      var hold = new Date(Date.now() + 12 * 3600e3), prepay = Math.ceil(c.total * 0.3 / 100) * 100;
      return ok({ booking: { id: 100 + Math.floor(Math.random() * 800), total: c.total, prepay_required: prepay, status: 'new', hold_until: hold.toISOString().slice(0, 19) },
                  bath: body.bath ? { id: 1, status: 'new', price: bathPrice } : null,
                  order: (body.food || []).length ? { id: 1, total: foodSum } : null, duplicate: false, demo: true });
    }
    return fail(404, 'В демо этого нет');
  }

  window.fetch = function (url, opt) {
    if (typeof url === 'string' && url.indexOf('/api/') === 0) {
      var u = new URL(url, 'http://x'), q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; });
      return Promise.resolve(handle(u.pathname.slice(4), q, opt || {}));
    }
    return realFetch(url, opt);
  };
})();
