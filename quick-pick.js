/* ============================================================
   店內挑選：不用打字的輸入方式（2026-11-10）
   1. 📋 點選常見成分：下拉選單選類別 → 點成分按鈕加入（再點一次取消）
   2. 🏷️ 從品牌選商品：下拉選品牌 → 選商品 → 自動帶入名稱和主要成分
   3. ⭐ 查評價：用商品名稱一鍵開 Google、Dcard、PTT、UrCosme 的評價搜尋
   保養品版、保健食品版共用。
   ============================================================ */
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }
  function mk(tag, cls, text){ var e = document.createElement(tag); if(cls){ e.className = cls; } if(text != null){ e.textContent = text; } return e; }

  var SKIN_GROUPS = [
    ['常見基底（通常排最前面）', ['水','甘油','丁二醇','丙二醇','二丙二醇','1,2-己二醇','戊二醇','甜菜鹼','海藻糖','辛酸/癸酸三酸甘油酯','聚二甲基矽氧烷','卡波姆','三仙膠']],
    ['保濕', ['玻尿酸','神經醯胺','泛醇','尿囊素','角鯊烷','乳木果油','凡士林','尿素','膠原蛋白','吡咯烷酮羧酸鈉','荷荷芭油','膽固醇']],
    ['美白淡斑', ['菸鹼醯胺','維生素C','傳明酸','熊果素','麴酸','抗壞血酸葡糖苷','乙基維生素C','甘草萃取','穀胱甘肽']],
    ['抗老', ['視黃醇','視黃醇棕櫚酸酯','羥基頻哪酮視黃酸酯','胜肽','輔酶Q10','補骨脂酚','二裂酵母','維生素E']],
    ['控油抗痘', ['水楊酸','壬二酸','吡咯烷酮羧酸鋅','茶樹精油','杏仁酸','硫磺']],
    ['舒緩修護', ['積雪草','甘草酸二鉀','燕麥萃取','依克多因','紅沒藥醇','蘆薈','洋甘菊萃取','綠茶萃取']],
    ['去角質（酸類）', ['甘醇酸','乳酸','杏仁酸','葡萄糖酸內酯','水楊酸']],
    ['防曬', ['氧化鋅','二氧化鈦','甲氧基肉桂酸乙基己酯','二苯甲酮-3','奧克立林','雙-乙基己氧苯酚甲氧苯基三嗪']],
    ['要小心的', ['酒精','香料','精油','薄荷醇','甲基異噻唑啉酮','苯氧乙醇','對羥基苯甲酸酯','月桂醇硫酸酯鈉','色素','礦物油','肉豆蔻酸異丙酯','椰子油','羊毛脂']]
  ];
  var SUP_GROUPS = [
    ['魚油／Omega-3', ['魚油（rTG型）','魚油（TG型）','魚油（EE型）','EPA','DHA','藻油','亞麻仁油']],
    ['護眼', ['葉黃素','游離型葉黃素','玉米黃素','蝦紅素','山桑子','β-胡蘿蔔素']],
    ['維生素', ['綜合維生素','B群','維生素C','維生素D3','維生素E','維生素K2','葉酸','生物素','維生素A','菸鹼酸']],
    ['礦物質', ['鈣','碳酸鈣','檸檬酸鈣','鎂','甘胺酸鎂','鐵','甘胺酸亞鐵','鋅','硒']],
    ['腸胃', ['益生菌','益生元','膳食纖維','β-葡聚醣','酵素']],
    ['骨骼關節', ['葡萄糖胺','軟骨素','MSM','UC-II','薑黃','黑胡椒萃取']],
    ['心血管・精神', ['輔酶Q10','紅麴','納豆激酶','銀杏','白藜蘆醇','人蔘','瑪卡','雞精','芝麻素','靈芝','牛磺酸','咖啡因']],
    ['睡眠放鬆', ['GABA','色胺酸','茶胺酸']],
    ['美容・女性', ['膠原蛋白','玻尿酸','大豆異黃酮','蔓越莓','肌醇','燕窩']],
    ['運動', ['乳清蛋白','植物蛋白','肌酸','支鏈胺基酸','電解質']],
    ['膠囊與添加物', ['明膠','植物膠囊','硬脂酸鎂','二氧化矽','微晶纖維素','大豆油','砂糖','果糖','蔗糖素','香料','色素']]
  ];

  var CAT_OF = { skin: ['skincare','cosmetic'], sup: ['supplement'] };
  window.__quickPick = { SKIN_GROUPS: SKIN_GROUPS, SUP_GROUPS: SUP_GROUPS, bump: {} };

  function store(k, v){ try{ if(v === undefined){ return JSON.parse(localStorage.getItem(k) || 'null'); } localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
  function splitTokens(v){ return v.split(/[,，、;；\n\r]+/).map(function(s){ return s.trim(); }).filter(Boolean); }

  function setup(mode){
    var isSup = mode === 'sup';
    var input = $(isSup ? 'sup-input' : 'pick-input');
    var nameEl = $(isSup ? 'sup-name' : 'pick-name');
    var typeEl = $(isSup ? 'sup-type' : 'pick-type');
    if(!input){ return; }
    var R = function(){ return isSup ? window.__sup : window.__pick; };
    var groups = (isSup ? SUP_GROUPS : SKIN_GROUPS).map(function(g){
      // 只留店內挑選認得的成分
      var items = [], seen = {};
      g[1].forEach(function(label){
        var ing = R() && R().match(label);
        if(!ing || seen[label]){ return; }
        seen[label] = 1; items.push({ label: label, k: ing.k });
      });
      return { title: g[0], items: items };
    }).filter(function(g){ return g.items.length; });

    // 工具列
    var bar = mk('div', 'qp-bar');
    var b1 = mk('button', 'qp-btn', '📋 點選常見成分'); b1.type = 'button';
    var b2 = mk('button', 'qp-btn', '🏷️ 從品牌選商品'); b2.type = 'button';
    bar.appendChild(b1); bar.appendChild(b2);
    var p1 = mk('div', 'qp-panel'); p1.hidden = true;
    var p2 = mk('div', 'qp-panel'); p2.hidden = true;
    input.parentNode.insertBefore(bar, input);
    input.parentNode.insertBefore(p1, input);
    input.parentNode.insertBefore(p2, input);
    function toggle(btn, panel, other, otherBtn){
      var open = panel.hidden;
      panel.hidden = !open; btn.classList.toggle('on', open);
      if(open){ other.hidden = true; otherBtn.classList.remove('on'); }
    }
    b1.addEventListener('click', function(){ toggle(b1, p1, p2, b2); renderChips(); });
    b2.addEventListener('click', function(){ toggle(b2, p2, p1, b1); });

    /* --- 1. 點選常見成分 --- */
    var row1 = mk('div', 'qp-row');
    var lab = mk('label', 'adv-label', '類別'); lab.htmlFor = mode + '-qp-group';
    var sel = mk('select', 'text-field qp-select'); sel.id = mode + '-qp-group';
    var favOpt = mk('option', null, '⭐ 我常找的'); favOpt.value = 'fav'; sel.appendChild(favOpt);
    groups.forEach(function(g, i){ var o = mk('option', null, g.title + '（' + g.items.length + '）'); o.value = i; sel.appendChild(o); });
    row1.appendChild(lab); row1.appendChild(sel);
    p1.appendChild(row1);
    var favTools = mk('div', 'qp-fav-tools'); favTools.hidden = true;
    var favIn = mk('input', 'text-field'); favIn.type = 'text'; favIn.placeholder = isSup ? '自己加，例：EPA' : '自己加，例：nia';
    var favAdd = mk('button', 'btn btn-secondary', '＋ 加入'); favAdd.type = 'button';
    var favEdit = mk('button', 'pick-link', '整理'); favEdit.type = 'button';
    favTools.appendChild(favIn); favTools.appendChild(favAdd); favTools.appendChild(favEdit);
    p1.appendChild(favTools);
    var favMsg = mk('p', 'pick-hint'); favMsg.hidden = true;
    p1.appendChild(favMsg);
    var chips = mk('div', 'qp-chips');
    p1.appendChild(chips);
    p1.appendChild(mk('p', 'pick-hint', isSup ? '點一下加入、再點一次取消。有寫含量的話，加入後在成分後面補上（例如：EPA 400mg）。' : '點一下加入、再點一次取消。照包裝上的順序點，判斷會比較準（排越前面含量越多）。'));
    sel.addEventListener('change', renderChips);
    function nm(s){ return String(s).toLowerCase().replace(/[\s　]/g, ''); }
    var allItems = [], firstOfK = {}, labelSet = {};
    groups.forEach(function(g){ g.items.forEach(function(it){ allItems.push(it); labelSet[nm(it.label)] = 1; if(!firstOfK[it.k]){ firstOfK[it.k] = it; } }); });

    /* ⭐ 我常找的：保養品、保健食品分開記（存在這台裝置的瀏覽器） */
    var FAV_KEY = 'mm_fav_' + mode;
    var fav = store(FAV_KEY) || {};
    var favEditing = false;
    function labelFor(tok){
      var t = String(tok).trim();
      if(labelSet[nm(t)]){ return allItems.filter(function(it){ return nm(it.label) === nm(t); })[0].label; }
      var ing = R() && R().match(t);
      return ing && !ing.kind && !ing.base ? ing.k : '';
    }
    function bump(tok, pin){
      var l = labelFor(tok);
      if(!l){ return ''; }
      var f = fav[l] || { n: 0, t: 0 };
      f.n += pin ? 0 : 1; f.t = Date.now(); if(pin){ f.pin = 1; }
      fav[l] = f;
      store(FAV_KEY, fav);
      return l;
    }
    function favItems(){
      return Object.keys(fav).filter(function(l){ var ing = R().match(l); return !!ing; })
        .sort(function(a, b){ return (fav[b].pin || 0) - (fav[a].pin || 0) || fav[b].n - fav[a].n || fav[b].t - fav[a].t; })
        .slice(0, 24).map(function(l){ return { label: l, k: R().match(l).k, fav: fav[l] }; });
    }
    function syncFavOpt(){ var n = favItems().length; favOpt.textContent = '⭐ 我常找的' + (n ? '（' + n + '）' : ''); }
    favAdd.addEventListener('click', function(){
      var added = [];
      splitTokens(favIn.value).forEach(function(t){ var l = bump(t, true); if(l){ added.push(l); } });
      favMsg.hidden = false;
      favMsg.textContent = added.length ? '已加入：' + added.join('、') : '認不得這個成分，換個寫法試試（中文、英文、簡稱都可以）。';
      if(added.length){ favIn.value = ''; }
      syncFavOpt(); renderChips();
    });
    favIn.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); favAdd.click(); } });
    favEdit.addEventListener('click', function(){ favEditing = !favEditing; favEdit.textContent = favEditing ? '完成' : '整理'; renderChips(); });
    window.__quickPick.bump[mode] = bump;
    /* 按鈕亮起：成分欄裡有完全一樣的字；或是打了別的寫法（例如 glycerin）時，亮同成分的第一個按鈕 */
    function chosen(){
      var r = R(), exact = {}, kOnly = {};
      splitTokens(input.value).forEach(function(t){
        var n = nm(t);
        if(labelSet[n]){ exact[n] = 1; return; }
        var ing = r.match(t); if(ing){ kOnly[ing.k] = 1; }
      });
      return { exact: exact, kOnly: kOnly };
    }
    function renderChips(){
      if(p1.hidden){ return; }
      chips.textContent = '';
      var isFav = sel.value === 'fav';
      favTools.hidden = !isFav;
      if(!isFav){ favMsg.hidden = true; favEditing = false; favEdit.textContent = '整理'; }
      syncFavOpt();
      var g = isFav ? { items: favItems() } : (groups[+sel.value] || groups[0]);
      if(isFav && !g.items.length){
        chips.appendChild(mk('p', 'pick-hint', '還沒有紀錄。你點過的成分、在店內挑選判斷過的、在「依成分查詢」查過的，會自動出現在這裡（' + (isSup ? '保健食品' : '保養品') + '另外記）；也可以用上面的欄位自己加。'));
        return;
      }
      if(isFav && favEditing){
        g.items.forEach(function(it){
          var b = mk('button', 'pick-chip qp-del', '✕ ' + it.label);
          b.type = 'button';
          b.addEventListener('click', function(){ delete fav[it.label]; store(FAV_KEY, fav); renderChips(); });
          chips.appendChild(b);
        });
        var clr = mk('button', 'pick-link', '全部清掉'); clr.type = 'button';
        clr.addEventListener('click', function(){ fav = {}; store(FAV_KEY, fav); renderChips(); });
        chips.appendChild(clr);
        return;
      }
      var st = chosen();
      g.items.forEach(function(it){
        var active = !!st.exact[nm(it.label)] || (!!st.kOnly[it.k] && (isFav ? !labelSet[nm(it.label)] || firstOfK[it.k] === it : firstOfK[it.k] === it));
        var b = mk('button', 'pick-chip' + (active ? ' on' : ''), (active ? '✓ ' : '') + (isFav && it.fav.pin ? '📌 ' : '') + it.label);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(active));
        b.addEventListener('click', function(){
          var toks = splitTokens(input.value);
          if(active){
            var r = R();
            toks = toks.filter(function(t){
              if(nm(t) === nm(it.label)){ return false; }
              if(!labelSet[nm(t)] && firstOfK[it.k] === it){ var ing = r.match(t); if(ing && ing.k === it.k){ return false; } }
              return true;
            });
          } else {
            toks.push(it.label);
            bump(it.label);
          }
          input.value = toks.length ? toks.join('、') + '、' : '';
          input.dispatchEvent(new Event('input'));
        });
        chips.appendChild(b);
      });
    }
    input.addEventListener('input', renderChips);
    // 按「看適不適合我」時，把認得的成分記進「我常找的」
    var runBtn = $(isSup ? 'sup-btn' : 'pick-btn');
    if(runBtn){ runBtn.addEventListener('click', function(){ var seen = {}; splitTokens(input.value).forEach(function(t){ var l = labelFor(t); if(l && !seen[l]){ seen[l] = 1; bump(t); } }); }); }
    if(favItems().length){ sel.value = 'fav'; }

    /* --- 2. 從品牌選商品 --- */
    var B = window.BRAND_STATIC || {};
    var brands = Object.keys(B).filter(function(n){ return CAT_OF[mode].indexOf(B[n].category) !== -1; })
      .sort(function(a, b){ return a.localeCompare(b, 'zh-Hant'); });
    var row2 = mk('div', 'qp-grid');
    var f1 = mk('div', 'adv-field'); var l1 = mk('label', 'adv-label', '品牌（' + brands.length + ' 個）'); l1.htmlFor = mode + '-qp-brand';
    var sb = mk('select', 'text-field qp-select'); sb.id = mode + '-qp-brand';
    sb.appendChild(mk('option', null, '選品牌…')).value = '';
    brands.forEach(function(n){ var o = mk('option', null, n); o.value = n; sb.appendChild(o); });
    f1.appendChild(l1); f1.appendChild(sb);
    var f2 = mk('div', 'adv-field'); var l2 = mk('label', 'adv-label', '商品'); l2.htmlFor = mode + '-qp-prod';
    var sp = mk('select', 'text-field qp-select'); sp.id = mode + '-qp-prod'; sp.disabled = true;
    sp.appendChild(mk('option', null, '先選品牌')).value = '';
    f2.appendChild(l2); f2.appendChild(sp);
    row2.appendChild(f1); row2.appendChild(f2);
    p2.appendChild(row2);
    var note = mk('p', 'pick-hint', '資料庫每個商品只記錄 2～3 個主要成分；帶入後可以再照包裝補上其他成分，判斷會更準。找不到的商品就用「點選常見成分」。');
    p2.appendChild(note);
    sb.addEventListener('change', function(){
      sp.textContent = '';
      var e = B[sb.value];
      if(!e){ sp.appendChild(mk('option', null, '先選品牌')).value = ''; sp.disabled = true; return; }
      sp.appendChild(mk('option', null, '選商品…（' + e.products.length + ' 個）')).value = '';
      e.products.forEach(function(p, i){ var o = mk('option', null, p.name + (p.subcatTag ? '｜' + p.subcatTag : '')); o.value = i; sp.appendChild(o); });
      sp.disabled = false;
    });
    sp.addEventListener('change', function(){
      var e = B[sb.value], p = e && e.products[+sp.value];
      if(!p){ return; }
      var short = sb.value.split(' ')[0];
      nameEl.value = (p.name.indexOf(short) === -1 ? short + ' ' : '') + p.name;
      input.value = (p.ingredients || []).join('、') + '、';
      if(typeEl && window.__brandTools && window.__brandTools.guessType){
        var t = window.__brandTools.guessType(p.name, e.category);
        if([].some.call(typeEl.options, function(o){ return o.value === t; })){ typeEl.value = t; typeEl.dispatchEvent(new Event('change')); }
      }
      input.dispatchEvent(new Event('input'));
      nameEl.dispatchEvent(new Event('input'));
      p2.hidden = true; b2.classList.remove('on');
      input.focus();
    });

    /* --- 3. 查評價 --- */
    var rv = mk('div', 'qp-review');
    var rb = mk('button', 'qp-btn', '⭐ 查這個商品的評價'); rb.type = 'button';
    var links = mk('div', 'review-links'); links.hidden = true;
    rv.appendChild(rb); rv.appendChild(links);
    var grid = nameEl.closest('.adv-grid');
    grid.parentNode.insertBefore(rv, grid.nextSibling);
    function renderLinks(){
      var n = nameEl.value.trim();
      links.textContent = '';
      if(!n){ links.appendChild(mk('p', 'pick-hint', '先在「商品名稱」打上品牌和商品名（或用「從品牌選商品」帶入），再按一次。')); links.hidden = false; return; }
      reviewLinks(n, isSup ? 'supplement' : 'skincare').forEach(function(a){ links.appendChild(a); });
      links.hidden = false;
    }
    rb.addEventListener('click', function(){ if(!links.hidden && links.dataset.n === nameEl.value.trim()){ links.hidden = true; return; } links.dataset.n = nameEl.value.trim(); renderLinks(); });
    nameEl.addEventListener('input', function(){ if(!links.hidden){ links.dataset.n = nameEl.value.trim(); renderLinks(); } });
  }

  /* 評價搜尋連結：用 Google 搜尋各評價網站（不需要金鑰，開新分頁） */
  function reviewLinks(name, cat){
    var q = function(s){ return 'https://www.google.com/search?q=' + encodeURIComponent(s); };
    var list = [
      ['Google 評價', q(name + ' 評價')],
      ['Dcard', q('site:dcard.tw ' + name)],
      ['PTT', q('site:ptt.cc ' + name)]
    ];
    if(cat !== 'supplement'){ list.push(['UrCosme 美妝評價', q('site:urcosme.com ' + name)]); }
    else { list.push(['成分與副作用', q(name + ' 成分 副作用')]); }
    return list.map(function(l){
      var a = mk('a', 'buy-link', l[0] + ' →');
      a.href = l[1]; a.target = '_blank'; a.rel = 'noopener';
      return a;
    });
  }

  function init(){
    setup('skin'); setup('sup');
    // 「依成分查詢」查過的成分：保健食品分類記到保健食品、其他記到保養品
    var ti = $('text-input');
    function logSearch(){
      setTimeout(function(){
        var v = ti.value.trim(); if(!v){ return; }
        var a = document.querySelector('.cat-tab.active');
        var mode = a && a.dataset.cat === 'supplement' ? 'sup' : 'skin';
        var f = window.__quickPick.bump[mode];
        if(f){ f(v); }
      }, 30);
    }
    var sb = $('search-btn');
    if(sb){ sb.addEventListener('click', logSearch); }
    if(ti){ ti.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ logSearch(); } }); }
    var sug = $('ing-suggest');
    if(sug){ sug.addEventListener('click', function(e){ if(e.target.closest('.ing-sug')){ logSearch(); } }); }
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.__quickPick.reviewLinks = reviewLinks;
})();
