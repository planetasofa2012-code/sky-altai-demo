/* Белая собака-помощник «Стрелка» (такая собака есть у хозяев базы).
   — на компьютере бежит за курсором мыши и останавливается рядом;
   — на телефоне и при «меньше анимации» сидит в углу (не бегает);
   — по нажатию открывает чат: отвечает на вопросы гостей по заготовленным ответам (без ИИ).
   Чего она не знает, не выдумывает, а отправляет к хозяевам по телефону.
   Подключение: <script src="dog.js" defer></script>  */
(function () {
  'use strict';
  if (window.__skyDog) return; window.__skyDog = true;

  var NAME = 'Стрелка';
  var PHONE = '+7 952 906-16-26', TEL = 'tel:+79529061626';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var chase = fine && !reduce;

  /* ───────── знания: ключевые слова → ответ (текст + необязательные ссылки) ───────── */
  var KB = [
    { k: ['привет', 'здравств', 'добрый', 'хай', 'hello'], a: 'Гав! Я ' + NAME + ', помогаю гостям Скай Алтая. Спросите про дома, цены, баню, дорогу или бронь.' },
    { k: ['спасибо', 'благодар'], a: 'Пожалуйста! Если что-то ещё нужно, я рядом.' },
    { k: ['дом', 'номер', 'какие есть', 'типы', 'варианты', 'размещен', 'жиль', 'фото', 'посмотр'],
      a: 'У нас 8 домов, 5 типов: Дом на берегу (1 шт.), Дом Семейный (1), 2-х комнатный (2), Студия (2) и Стандарт (2). Фото каждого можно посмотреть и сравнить в шоуруме.',
      links: [['Шоурум номеров', 'rooms.html']] },
    { k: ['цен', 'стоит', 'сколько', 'стоимост', 'тариф', 'руб', 'дорого', 'дешев', 'скидк'],
      a: 'Цены «от» за сутки: Дом на берегу 7 000 ₽, Дом Семейный 10 000 ₽, 2-х комнатный 6 000 ₽, Студия 6 000 ₽, Стандарт 5 000 ₽. Точную сумму для ваших дат и гостей посчитает календарь брони. Вне сезона бывает дешевле.',
      links: [['Календарь и расчёт', 'book.html']] },
    { k: ['доп', 'допол', 'ребен', 'ребён', 'дет', 'сколько человек', 'сколько гост', 'вмест', 'кроват', 'мест'],
      a: 'В каждом доме 2 основных места. Дальше доп. места по 700 ₽ за сутки, для любого возраста, но при брони нужно указать возраст каждого. Всего гостей: Дом на берегу до 3, Дом Семейный до 5, 2-х комнатный до 4, Студия до 3, Стандарт до 4.' },
    { k: ['зим', 'холод', 'отоплен', 'новый год', 'новогод', 'круглый год', 'круглогод'],
      a: 'Зимой работают 4 дома: Дом Семейный, два 2-х комнатных и одна Студия. Остальные дома принимают гостей с апреля по октябрь.' },
    { k: ['кухн', 'wifi', 'wi-fi', 'вайфай', 'интернет', 'тв', 'телевиз', 'терасс', 'террас', 'вид', 'курить', 'курящ', 'удобств', 'есть в номер'],
      a: 'Во всех домах есть кухня, Wi-Fi и ТВ, своя терраса с видом на реку. Номера для некурящих.' },
    { k: ['бассейн', 'беседк', 'мангал', 'барбекю', 'шашлык', 'качел', 'площадк', 'батут', 'песочниц', 'шезлонг', 'территор', 'двор', 'гулять', 'с детьми', 'для детей'],
      a: 'На территории есть бассейн с шезлонгами, беседки и мангальная зона под навесом, качели, детская площадка с батутом и песочницей. Условия пользования бассейном и мангалом уточните у хозяев по телефону ' + PHONE + '.',
      links: [['Фото территории', 'site.html#territoriya']] },
    { k: ['парков', 'машин', 'авто', 'припарк'], a: 'Парковка на территории бесплатная.' },
    { k: ['бан', 'парил', 'купел'],
      a: 'У нас баня на дровах с купелью. Время сеанса можно выбрать на странице брони (отметка «Добавить баню»). Цену и условия лучше уточнить у хозяев по телефону ' + PHONE + '.',
      links: [['Выбрать время', 'book.html']] },
    { k: ['пельмен', 'вареник', 'блин', 'заморо', 'еда', 'еду', 'питан', 'поесть', 'завтрак', 'кормят'],
      a: 'Хозяйка сама делает пельмени, вареники и блины и отдаёт их замороженными при заезде или выезде. Варить нужно самим на кухне своего дома. Заказать можно вместе с бронью, вес и цену уточняет хозяйка: ' + PHONE + '.', links: [['Заказать с бронью', 'book.html#food']] },
    { k: ['как добрат', 'доехать', 'дорог', 'адрес', 'где наход', 'расстоян', 'км', 'далеко', 'чемал', 'манжерок', 'горнолыж', 'ороктой', 'гэс', 'озер', 'озёр', 'горно-алтайск', 'достопримеч', 'рядом'],
      a: 'База в селе Элекмонар на Катуни, примерно в 6 км от Чемала. Примерно: Чемальская ГЭС около 7 км, Ороктойский мост около 10 км, Голубые озёра около 15 км, Каракольские озёра около 40 км, Манжерок и горнолыжка около 60 км, Горно-Алтайск около 96 км. Это ориентировочные цифры.',
      links: [['Что рядом', 'site.html#ryadom']] },
    { k: ['брон', 'заброни', 'резерв', 'предоплат', 'оплат', 'как заказать', 'как снять', 'свободн', 'даты', 'дата'],
      a: 'Выберите даты в календаре на странице брони, укажите ФИО и телефон. Бронь подтверждается после предоплаты, а до этого мы держим дом за вами ограниченное время. Размер предоплаты сообщит администратор.',
      links: [['Забронировать', 'book.html']] },
    { k: ['минимальн', 'на сколько ноч', 'одну ноч', 'на одну', 'на сутки', 'на 1 ноч', 'мин срок', 'минимум'],
      a: 'В высокий сезон и праздники бывает минимальный срок брони, обычно 2–3 ночи. Такие даты в календаре отмечены пометкой «от 3».',
      links: [['Календарь', 'book.html']] },
    { k: ['телефон', 'позвон', 'связат', 'контакт', 'номер телефона', 'хозяин', 'хозяйк', 'администратор', 'человек'],
      a: 'Хозяева на связи по телефону ' + PHONE + ', можно и написать в мессенджер: Telegram или MAX (кнопки в разделе «Бронирование и вопросы» внизу сайта).',
      links: [['Позвонить', TEL]] },
    { k: ['собак', 'кошк', 'животн', 'питомц', 'с собакой', 'с кошкой'], a: 'Про проживание с животными я наверняка не знаю, а выдумывать не буду. Уточните, пожалуйста, у хозяев по телефону ' + PHONE + '.', links: [['Позвонить', TEL]] },
    { k: ['заезд', 'выезд', 'во сколько', 'время заезда', 'расчётный', 'расчетный', 'возврат', 'отмен', 'вернут'],
      a: 'Точные часы заезда и выезда и условия возврата предоплаты мне не передали. Лучше уточнить у хозяев по телефону ' + PHONE + '.', links: [['Позвонить', TEL]] },
    { k: ['как тебя', 'кто ты', 'имя', 'зовут'], a: 'Я ' + NAME + ', белая собака и помощник хозяев Скай Алтая. Отвечаю на частые вопросы, а сложные передаю людям.' }
  ];
  var CHIPS = ['Какие есть дома?', 'Сколько стоит?', 'Работаете зимой?', 'Что рядом?', 'Как забронировать?'];
  var FALLBACK = 'Гав, точного ответа у меня на это нет, а выдумывать не хочу. Лучше спросите у хозяев: ' + PHONE + '.';

  function norm(s) { return String(s).toLowerCase().replace(/ё/g, 'е'); }
  function answer(q) {
    var t = norm(q), best = null, bs = 0;
    KB.forEach(function (e) {
      var s = 0;
      e.k.forEach(function (w) { if (t.indexOf(norm(w)) !== -1) s += w.length > 3 ? 2 : 1; });
      if (s > bs) { bs = s; best = e; }
    });
    return best ? best : { a: FALLBACK, links: [['Позвонить', TEL]] };
  }

  /* ───────── собака: рисунок ───────── */
  var SVG =
    '<svg viewBox="0 0 128 96" width="100%" height="100%" aria-hidden="true" focusable="false">' +
    '<ellipse class="sh" cx="62" cy="90" rx="40" ry="5"/>' +
    // пушистый хвост-«сабля», свисает назад и вниз
    '<g class="tailw"><path class="fur" d="M30 40 C14 40 4 54 6 72 C7 80 12 84 16 78 C16 66 24 56 38 52 Z"/></g>' +
    '<g class="leg b1"><rect class="fur" x="27" y="56" width="10" height="32" rx="5"/></g>' +
    '<g class="leg f1"><rect class="fur" x="72" y="56" width="10" height="32" rx="5"/></g>' +
    '<ellipse class="fur" cx="56" cy="48" rx="35" ry="19"/>' +
    // пушистые «штанишки» и воротник
    '<path class="fur" d="M26 56 q-6 6 -2 12 q4 -1 6 -4 q2 4 8 2 q2 -6 -2 -10 Z"/>' +
    '<g class="leg b2"><rect class="fur" x="40" y="58" width="10" height="30" rx="5"/></g>' +
    '<g class="leg f2"><rect class="fur" x="82" y="58" width="10" height="30" rx="5"/></g>' +
    '<path class="fur" d="M78 32 C70 40 72 56 82 62 q4 -4 8 0 q3 -3 8 -1 q2 -8 -2 -16 Z"/>' +
    '<g class="head">' +
    // два стоячих острых уха
    '<path class="fur" d="M94 18 L96 -4 L110 14 Z"/><path class="ear" d="M98 14 L99 3 L106 13 Z"/>' +
    '<path class="fur" d="M82 22 L80 -2 L97 14 Z"/><path class="ear" d="M85 18 L84 5 L93 14 Z"/>' +
    '<circle class="fur" cx="98" cy="30" r="16"/>' +
    // длинная морда
    '<path class="fur" d="M100 24 L124 33 Q130 37 124 42 L102 44 Z"/>' +
    '<ellipse class="nf" cx="107" cy="34" rx="9" ry="6"/>' +
    '<circle class="nose" cx="125.5" cy="35.5" r="3.4"/>' +
    '<circle class="eye" cx="104" cy="25" r="2.6"/><circle class="eyeh" cx="105" cy="24" r="0.9"/>' +
    '<path class="mouth" d="M104 41 Q114 46 123 41" fill="none"/>' +
    '<path class="tongue" d="M112 43 q1 11 7 8 q3 -4 0 -9 z"/>' +
    '</g></svg>';

  var CSS =
    '.sd-dog{position:fixed;left:0;top:0;width:104px;height:78px;z-index:60;pointer-events:none;will-change:transform;-webkit-tap-highlight-color:transparent}' +
    '.sd-dog.idle,.sd-dog.sit{pointer-events:auto;cursor:pointer}' +
    '.sd-in{width:100%;height:100%;transform-origin:50% 90%;transition:transform .15s}' +
    '.sd-dog.left .sd-in{transform:scaleX(-1)}' +
    '.sd-dog svg{display:block;overflow:visible;filter:drop-shadow(0 2px 3px rgba(20,34,28,.28))}' +
    '.sd-dog .fur{fill:#fff;stroke:#9DB2AC;stroke-width:2;stroke-linejoin:round}' +
    '.sd-dog .nf{fill:#fff;stroke:none}.sd-dog .ear{fill:#F6D9D2;stroke:none}.sd-dog .nose{fill:#22302B}.sd-dog .eye{fill:#22302B}.sd-dog .eyeh{fill:#fff}' +
    '.sd-dog .mouth{stroke:#22302B;stroke-width:2;stroke-linecap:round}.sd-dog .tongue{fill:#F29AA6;stroke:#D97A88;stroke-width:1.2}' +
        '.sd-dog .sh{fill:rgba(20,34,28,.16)}' +
    '.sd-dog .tailw{transform-box:fill-box;transform-origin:90% 90%}' +
    '.sd-dog .leg{transform-box:fill-box;transform-origin:50% 8%}' +
    '.sd-dog .head{transform-box:fill-box;transform-origin:30% 80%}' +
    '@media(prefers-reduced-motion:no-preference){' +
    '.sd-dog .tailw{animation:sdwag .7s ease-in-out infinite alternate}' +
    '.sd-dog.walk .tailw{animation-duration:.3s}' +
    '.sd-dog.walk .b1,.sd-dog.walk .f2{animation:sdstep .28s ease-in-out infinite alternate}' +
    '.sd-dog.walk .b2,.sd-dog.walk .f1{animation:sdstep .28s ease-in-out infinite alternate-reverse}' +
    '.sd-dog.walk .sd-in svg{animation:sdbob .28s ease-in-out infinite}' +
    '.sd-dog.idle .head,.sd-dog.sit .head{animation:sdnod 3.6s ease-in-out infinite}' +
    '.sd-dog.hi{animation:sdhop .5s ease}}' +
    '@keyframes sdwag{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}' +
    '@keyframes sdstep{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}' +
    '@keyframes sdbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}' +
    '@keyframes sdnod{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}}' +
    '@keyframes sdhop{0%,100%{margin-top:0}40%{margin-top:-14px}}' +
    '.sd-tip{position:fixed;z-index:61;background:#fff;color:#1d2a24;border:1px solid #D9E1DD;border-radius:14px;padding:8px 12px;font:600 13.5px/1.35 Manrope,Arial,sans-serif;box-shadow:0 8px 24px rgba(20,34,28,.18);max-width:220px;pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .25s,transform .25s}' +
    '.sd-tip.on{opacity:1;transform:none}' +
    '.sd-chat{position:fixed;right:16px;bottom:16px;z-index:62;width:min(380px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 32px));display:flex;flex-direction:column;background:#fff;border:1px solid #D9E1DD;border-radius:20px;box-shadow:0 20px 60px rgba(20,34,28,.28);font:500 15px/1.45 Manrope,Arial,sans-serif;color:#1d2a24;overflow:hidden;transform:translateY(16px) scale(.97);opacity:0;visibility:hidden;transition:transform .25s ease,opacity .25s ease,visibility 0s .25s}' +
    '.sd-chat.open{transform:none;opacity:1;visibility:visible;transition:transform .25s ease,opacity .25s ease}' +
    '.sd-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1F4D3C;color:#fff}' +
    '.sd-h b{font:700 16px Unbounded,Manrope,Arial,sans-serif}.sd-h small{display:block;font-weight:500;font-size:12px;opacity:.85}' +
    '.sd-x{margin-left:auto;border:0;background:rgba(255,255,255,.16);color:#fff;width:34px;height:34px;border-radius:50%;font-size:20px;line-height:1;cursor:pointer}' +
    '.sd-x:hover{background:rgba(255,255,255,.28)}' +
    '.sd-m{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#F5F8F7;min-height:150px}' +
    '.sd-b{max-width:88%;padding:9px 13px;border-radius:16px;white-space:pre-wrap;animation:sdin .25s ease}' +
    '.sd-b.bot{background:#fff;border:1px solid #D9E1DD;border-bottom-left-radius:4px;align-self:flex-start}' +
    '.sd-b.me{background:#1F8A8A;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}' +
    '.sd-b a{display:inline-block;margin:6px 6px 0 0;padding:6px 12px;border-radius:99px;background:#E3F2F1;color:#0F5E5E;font-weight:700;font-size:13.5px;text-decoration:none}' +
    '.sd-b a:hover{background:#CDE8E7}' +
    '.sd-c{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0;background:#fff}' +
    '.sd-c button{border:1px solid #BFD6D4;background:#fff;color:#0F5E5E;border-radius:99px;padding:6px 11px;font:600 13px Manrope,Arial,sans-serif;cursor:pointer}' +
    '.sd-c button:hover{background:#E3F2F1}' +
    '.sd-f{display:flex;gap:8px;padding:10px 12px 12px;background:#fff}' +
    '.sd-f input{flex:1;min-width:0;font:500 16px Manrope,Arial,sans-serif;border:1.5px solid #D9E1DD;border-radius:12px;padding:10px 12px}' +
    '.sd-f input:focus{outline:2px solid #1F8A8A;border-color:transparent}' +
    '.sd-f button{border:0;background:#1F8A8A;color:#fff;border-radius:12px;padding:0 16px;font:700 15px Manrope,Arial,sans-serif;cursor:pointer}' +
    '.sd-f button:hover{background:#17706F}' +
    '.sd-note{padding:0 14px 10px;font-size:11.5px;color:#5B655F;background:#fff}' +
    '@keyframes sdin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '@media(max-width:700px){.sd-chat{right:8px;bottom:70px;max-height:calc(100vh - 90px)}}';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function init() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var dog = el('div', 'sd-dog sit'); dog.setAttribute('role', 'button'); dog.tabIndex = 0;
    dog.setAttribute('aria-label', 'Спросить помощника: белая собака ' + NAME);
    var inn = el('div', 'sd-in'); inn.innerHTML = SVG; dog.appendChild(inn);
    var tip = el('div', 'sd-tip', 'Гав! Спросите меня');
    var chat = el('div', 'sd-chat'); chat.setAttribute('role', 'dialog'); chat.setAttribute('aria-label', 'Чат с помощником ' + NAME);
    var head = el('div', 'sd-h'); var hb = el('div'); hb.appendChild(el('b', '', NAME)); hb.appendChild(el('small', '', 'Помощник хозяев Скай Алтая'));
    var x = el('button', 'sd-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть чат'); head.appendChild(hb); head.appendChild(x);
    var msgs = el('div', 'sd-m'); msgs.setAttribute('aria-live', 'polite');
    var chips = el('div', 'sd-c');
    var form = el('form', 'sd-f'); var inp = el('input'); inp.type = 'text'; inp.placeholder = 'Задайте вопрос'; inp.setAttribute('aria-label', 'Ваш вопрос'); inp.autocomplete = 'off';
    var send = el('button', '', 'Ок'); send.type = 'submit'; form.appendChild(inp); form.appendChild(send);
    var note = el('div', 'sd-note', 'Отвечаю по заготовленным ответам, не как человек. Сложное передаю хозяевам: ' + PHONE + '.');
    chat.appendChild(head); chat.appendChild(msgs); chat.appendChild(chips); chat.appendChild(form); chat.appendChild(note);
    document.body.appendChild(dog); document.body.appendChild(tip); document.body.appendChild(chat);

    /* положение и бег */
    var W = 104, H = 78, pos = { x: 24, y: 0 }, tgt = { x: 0, y: 0 }, mouse = null, opened = false, moving = false, lastMove = 0;
    function home() {
      var mob = window.innerWidth <= 700;
      return { x: 12, y: window.innerHeight - H - (mob ? 76 : 14) };
    }
    pos = home(); tgt = { x: pos.x, y: pos.y };
    function place() { dog.style.transform = 'translate(' + Math.round(pos.x) + 'px,' + Math.round(pos.y) + 'px)'; }
    place();
    function setMode(m) { dog.classList.remove('idle', 'sit', 'walk'); dog.classList.add(m === 'walk' ? 'walk' : 'sit'); if (m !== 'walk') dog.classList.add('idle'); }
    setMode('idle');

    function loop() {
      if (chase && mouse && !opened) {
        // собака останавливается рядом с курсором, чтобы не закрывать то, на что вы нажимаете
        var cx = pos.x + W / 2, cy = pos.y + H / 2, dx = mouse.x - cx, dy = mouse.y - 8 - cy, d = Math.hypot(dx, dy), stop = 110;
        if (d > stop) {
          var sp = Math.min(9, (d - stop) * 0.07 + 1.2);
          pos.x += dx / d * sp; pos.y += dy / d * sp;
          pos.x = Math.max(0, Math.min(window.innerWidth - W, pos.x));
          pos.y = Math.max(0, Math.min(window.innerHeight - H, pos.y));
          if (Math.abs(dx) > 6) dog.classList.toggle('left', dx < 0);
          if (!moving) { moving = true; setMode('walk'); tip.classList.remove('on'); }
          place();
        } else if (moving) { moving = false; setMode('idle'); if (Math.abs(dx) > 6) dog.classList.toggle('left', dx < 0); }
      } else if (opened) {
        var ex = tgt.x - pos.x, ey = tgt.y - pos.y, ed = Math.hypot(ex, ey);
        if (ed > 3) { var s = Math.min(10, ed * 0.12 + 1); pos.x += ex / ed * s; pos.y += ey / ed * s; if (Math.abs(ex) > 6) dog.classList.toggle('left', ex < 0); if (!moving) { moving = true; setMode('walk'); } place(); }
        else if (moving) { moving = false; setMode('idle'); }
      }
      requestAnimationFrame(loop);
    }
    if (chase) {
      window.addEventListener('mousemove', function (e) { mouse = { x: e.clientX, y: e.clientY }; lastMove = Date.now(); }, { passive: true });
      document.addEventListener('mouseleave', function () { mouse = null; });
    }
    window.addEventListener('resize', function () {
      if (!chase) { pos = home(); place(); }
      pos.x = Math.max(0, Math.min(window.innerWidth - W, pos.x)); pos.y = Math.max(0, Math.min(window.innerHeight - H, pos.y)); place();
    });
    requestAnimationFrame(loop);

    /* подсказка */
    var tipTimer;
    function showTip(t, ms) {
      if (opened) return; tip.textContent = t;
      var r = dog.getBoundingClientRect(), left = Math.max(8, Math.min(window.innerWidth - 230, r.left - 40)), top = r.top - 50;
      if (top < 8) top = r.bottom + 6; tip.style.left = left + 'px'; tip.style.top = top + 'px'; tip.classList.add('on');
      clearTimeout(tipTimer); tipTimer = setTimeout(function () { tip.classList.remove('on'); }, ms || 3500);
    }
    setTimeout(function () { showTip('Гав! Я ' + NAME + '. Спросите меня о базе', 5000); if (!reduce) { dog.classList.add('hi'); setTimeout(function () { dog.classList.remove('hi'); }, 600); } }, 1800);
    dog.addEventListener('mouseenter', function () { if (!moving && !opened) showTip('Нажмите, отвечу на вопросы', 2500); });

    /* чат */
    function say(who, text, links) {
      var b = el('div', 'sd-b ' + who); b.appendChild(document.createTextNode(text));
      if (links && links.length) { b.appendChild(document.createElement('br')); links.forEach(function (l) { var a = el('a', '', l[0]); a.href = l[1]; b.appendChild(a); }); }
      msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight;
    }
    function ask(q) {
      q = q.trim(); if (!q) return;
      say('me', q); dog.classList.add('talk');
      var r = answer(q); setTimeout(function () { say('bot', r.a, r.links); dog.classList.remove('talk'); }, 350);
    }
    CHIPS.forEach(function (c) { var b = el('button', '', c); b.type = 'button'; b.addEventListener('click', function () { ask(c); }); chips.appendChild(b); });
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(inp.value); inp.value = ''; });

    function open() {
      if (opened) return; opened = true; tip.classList.remove('on');
      chat.classList.add('open');
      if (!msgs.children.length) say('bot', 'Гав! Я ' + NAME + ', помощник хозяев Скай Алтая. Расскажу про дома, цены, баню, дорогу и бронь. Спросите или выберите вопрос ниже.');
      // собака садится рядом с окном чата
      var cr = chat.getBoundingClientRect();
      tgt = { x: Math.max(0, cr.left - W + 8), y: Math.max(0, cr.top - H + 22) };
      if (!chase || reduce) { pos = { x: tgt.x, y: tgt.y }; place(); }
      setTimeout(function () { inp.focus({ preventScroll: true }); }, 280);
    }
    function close() {
      if (!opened) return; opened = false; chat.classList.remove('open'); mouse = mouse; if (!chase) { pos = home(); place(); }
      dog.focus({ preventScroll: true });
    }
    dog.addEventListener('click', function () { opened ? close() : open(); });
    dog.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opened ? close() : open(); } });
    x.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
