/* ============================================================
   品牌商品小工具（2026-11-09）
   1. 依成分反查商品：打一個成分，列出資料庫裡所有含它的商品（跨品牌）
   2. 商品卡標示適不適合你：保養品、化妝品用「店內挑選」的膚質設定；保健食品用保健需求設定
   3. 商品一鍵加入店內挑選比較
   注意：資料庫每個商品只記錄 2～3 個主要成分，判斷只能當參考。
   ============================================================ */
(function(){
  'use strict';

  var CAT = { supplement:'保健食品', skincare:'保養品', cosmetic:'化妝品' };
  function $(id){ return document.getElementById(id); }
  function mk(tag, cls, text){ var e = document.createElement(tag); if(cls){ e.className = cls; } if(text != null){ e.textContent = text; } return e; }
  function toHalf(s){ return String(s).replace(/[！-～]/g, function(ch){ return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); }).replace(/　/g, ' '); }
  function syn(s){ return toHalf(s).replace(/維他命/g, '維生素').replace(/輔酵素/g, '輔酶').replace(/荷荷巴/g, '荷荷芭').replace(/介面/g, '界面').replace(/勝肽/g, '胜肽').replace(/透明質酸/g, '玻尿酸'); }
  function norm(s){ return syn(s).toLowerCase().replace(/[\s.\-_'’·・,，()（）\[\]\/／+&%]/g, ''); }

  /* ---------- 成分比對 ---------- */
  function variants(text){
    var t = syn(text);
    var main = t.replace(/[（(][^）)]*[)）]/g, '').trim();
    var inner = (t.match(/[（(][^）)]*[)）]/g) || []).map(function(x){ return x.slice(1, -1).replace(/\d+(\.\d+)?\s*%|\d+\s*(mg|μg|億|iu)/ig, '').trim(); });
    return [t, main].concat(inner).filter(function(v, i, a){ return v && a.indexOf(v) === i; });
  }
  var cache = {};
  /* cat：商品的分類；保健食品只用保健食品知識比、保養品／化妝品只用保養品知識比（避免「金盞花萃取」被當成葉黃素） */
  function keys(text, cat){
    var ck = (cat || '*') + '|' + text;
    if(cache[ck]){ return cache[ck]; }
    var out = {};
    var D = window.__ingDB, P = window.__pick, S = window.__sup;
    variants(text).forEach(function(v){
      var n = norm(v);
      if(!n){ return; }
      var p = P && cat !== 'supplement' ? P.match(v) : null, s = S && (!cat || cat === 'supplement') ? S.match(v) : null;
      if(p && !p.base){ out['p:' + p.k] = 1; }
      if(s && !s.kind){ out['s:' + s.k] = 1; }
      if(D){
        if(D.ALL_ITEMS[v]){ out['d:' + v] = 1; }
        var al = D.EN_ALIAS[v.toLowerCase()]; if(al){ out['d:' + al] = 1; }
        // 保養品／保健食品知識都認不得時，才用「名稱裡含有資料庫成分名」來比（避免「甘油」對到「三酸甘油酯」）
        if(!p && !s){
          Object.keys(D.ALL_ITEMS).forEach(function(name){
            var nn = norm(name);
            if(n.indexOf(nn) !== -1 && !/[a-z0-9]/.test(nn.slice(-1) + nn[0])){ out['d:' + name] = 1; }
          });
        }
      }
      if(typeof window.lookupCode === 'function'){
        window.lookupCode(v).forEach(function(c){ if(c.db){ out['d:' + c.db] = 1; } if(c.pk){ out['p:' + c.pk] = 1; } });
      }
    });
    cache[ck] = out;
    return out;
  }
  function hasCanon(k){ return Object.keys(k).length > 0; }

  /* 打一個成分，找出含它的商品 */
  function productsWith(query){
    var B = window.BRAND_STATIC;
    if(!B || !query){ return []; }
    var qk = keys(query);
    var qn = norm(String(query).replace(/[（(].*?[)）]/g, ''));
    var canon = hasCanon(qk);
    var out = [];
    Object.keys(B).forEach(function(brand){
      var e = B[brand];
      (e.products || []).forEach(function(p){
        var hit = (p.ingredients || []).filter(function(ing){
          if(canon){
            var pk = keys(ing, e.category);
            for(var k in qk){ if(pk[k]){ return true; } }
            return false;
          }
          return qn.length >= 2 && norm(ing).indexOf(qn) !== -1;
        });
        if(hit.length){ out.push({ brand: brand, cat: e.category, p: p, hit: hit }); }
      });
    });
    return out;
  }

  /* ---------- 適不適合你 ---------- */
  function evaluator(cat){
    if(cat === 'supplement'){ return window.__sup && window.__sup.hasProfile() ? window.__sup : null; }
    return window.__pick && window.__pick.hasProfile() ? window.__pick : null;
  }
  function judge(p, cat){
    var R = evaluator(cat);
    if(!R || !p.ingredients || !p.ingredients.length){ return null; }
    return R.evaluate(p.ingredients);
  }
  function badgeText(r){
    return r.tone === 'ok' ? '🟢 適合你' : r.tone === 'mid' ? '🟡 可以考慮' : r.tone === 'meh' ? '⚪ 普通' : '🔴 要小心';
  }
  function guessType(name, cat){
    if(cat === 'supplement'){
      var T = (window.__sup && window.__sup.TYPES) || [];
      if(/軟糖|咀嚼/.test(name)){ return T[3]; }
      if(/雞精|飲|精華飲|滴/.test(name)){ return T[4]; }
      if(/粉|沖泡|包/.test(name)){ return T[2]; }
      if(/魚油|葉黃素|軟膠囊|q10|藻油/i.test(name)){ return T[1]; }
      return T[0];
    }
    var map = [['防曬','防曬乳'],['化妝水','化妝水'],['精華','精華液'],['凝露','凝露'],['凝膠','凝露'],['乳霜','乳霜'],['霜','乳霜'],['乳液','乳液']];
    for(var i = 0; i < map.length; i++){ if(name.indexOf(map[i][0]) !== -1){ return map[i][1]; } }
    return cat === 'cosmetic' ? '其他（彩妝等）' : '乳液';
  }

  /* 商品卡加上「適不適合你」與「加入比較」（buildProductCard 會呼叫） */
  function decorate(card, headMain, bodyInner, item, opts){
    var cat = opts.cat, p = item._src || item;
    var r = judge(p, cat);
    if(r){
      var meta = headMain.querySelector('.product-meta-row') || headMain;
      var b = mk('span', 'fit-badge ' + r.tone, badgeText(r));
      meta.appendChild(b);
    }
    var sec = mk('div', 'product-section fit-section');
    sec.appendChild(mk('p', 'product-section-label', cat === 'supplement' ? '對你的需求來說' : '對你的膚質來說'));
    if(r){
      if(r.good.length){ sec.appendChild(mk('p', 'fit-line good', '🟢 ' + r.good.map(function(e){ return e.ing.k; }).join('、'))); }
      if(r.bad.length){ sec.appendChild(mk('p', 'fit-line bad', '🔴 ' + r.bad.map(function(e){ return e.ing.k + '（' + e.warns[0] + '）'; }).join('；'))); }
      if(!r.good.length && !r.bad.length){ sec.appendChild(mk('p', 'fit-line', '主要成分跟你的設定沒有特別關係。')); }
      sec.appendChild(mk('p', 'fit-note', '只依資料庫記錄的 ' + p.ingredients.length + ' 個主要成分判斷，買之前看包裝全成分，或在店內挑選把全成分打進去。'));
    } else {
      sec.appendChild(mk('p', 'fit-note', '到「🛒 店內挑選」設定' + (cat === 'supplement' ? '你想補的方向' : '膚質') + '後，這裡會標出適不適合你。'));
    }
    var R = cat === 'supplement' ? window.__sup : window.__pick;
    if(R && p.ingredients && p.ingredients.length){
      var row = mk('div', 'fit-actions');
      var btn = mk('button', 'btn-link fit-add', '＋ 加入店內挑選比較');
      btn.type = 'button';
      var full = R.savedCount() >= 3;
      if(full){ btn.textContent = '比較清單已滿 3 個'; btn.disabled = true; }
      btn.addEventListener('click', function(ev){
        ev.stopPropagation();
        var ok = R.add((opts.brand && p.name.indexOf(opts.brand.split(' ')[0]) === -1 ? opts.brand.split(' ')[0] + ' ' : '') + p.name, guessType(p.name, cat), p.ingredients);
        if(!ok){ btn.textContent = '比較清單已滿 3 個'; btn.disabled = true; return; }
        btn.textContent = '✓ 已加入（' + R.savedCount() + ' / 3）';
        btn.disabled = true;
        var go = mk('button', 'btn-link', '去比較 →');
        go.type = 'button';
        go.addEventListener('click', function(e2){ e2.stopPropagation(); openCompare(cat); });
        row.appendChild(go);
      });
      row.appendChild(btn);
      sec.appendChild(row);
    }
    bodyInner.insertBefore(sec, bodyInner.firstChild);
  }

  function openCompare(cat){
    var tab = document.querySelector('.cat-tab[data-cat="' + (cat === 'supplement' ? 'supplement' : 'skincare') + '"]');
    if(tab && !tab.classList.contains('active')){ tab.click(); }
    var st = document.querySelector('.sub-tab[data-mode="pick"]');
    if(st){ st.click(); }
    setTimeout(function(){
      var box = $(cat === 'supplement' ? 'sup-compare' : 'pick-compare');
      if(box && !box.hidden){ box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 60);
  }

  /* ---------- 依成分找商品：畫面 ---------- */
  var finder = { q: '', cat: 'all', list: [] };
  function runFinder(q){
    var input = $('bi-input');
    if(q != null){ input.value = q; }
    var v = input.value.trim();
    var box = $('bi-result'), err = $('bi-error');
    box.textContent = ''; err.hidden = true;
    $('bi-suggest').hidden = true;
    if(!v){ err.textContent = '輸入一個成分，例如：神經醯胺、菸鹼醯胺、葉黃素、EPA。'; err.hidden = false; return; }
    finder.q = v;
    finder.list = productsWith(v);
    renderFinder();
  }
  function renderFinder(){
    var box = $('bi-result');
    box.textContent = '';
    var list = finder.list;
    if(!list.length){
      box.appendChild(mk('p', 'empty-state', '資料庫裡沒有找到含「' + finder.q + '」的商品。資料庫每個商品只記錄幾個主要成分，可能有含但沒記錄到。'));
      return;
    }
    var counts = {}; list.forEach(function(x){ counts[x.cat] = (counts[x.cat] || 0) + 1; });
    var head = mk('p', 'bi-head', '含「' + finder.q + '」的商品：' + list.length + ' 個');
    box.appendChild(head);
    var chips = mk('div', 'filter-row');
    [['all', '全部 ' + list.length]].concat(Object.keys(CAT).filter(function(c){ return counts[c]; }).map(function(c){ return [c, CAT[c] + ' ' + counts[c]]; })).forEach(function(c){
      var b = mk('button', 'filter-chip' + (finder.cat === c[0] ? ' active' : ''), c[1]);
      b.type = 'button';
      b.addEventListener('click', function(){ finder.cat = c[0]; renderFinder(); });
      chips.appendChild(b);
    });
    box.appendChild(chips);
    var shown = list.filter(function(x){ return finder.cat === 'all' || x.cat === finder.cat; });
    if(!shown.length){ finder.cat = 'all'; renderFinder(); return; }
    // 有設定時，依適合程度排序
    var scored = shown.map(function(x){ var r = judge(x.p, x.cat); return { x: x, s: r ? r.pct : -1 }; });
    var anyScore = scored.some(function(y){ return y.s >= 0; });
    if(anyScore){ scored.sort(function(a, b){ return b.s - a.s; }); box.appendChild(mk('p', 'fit-note', '已依「適合你的程度」排序（只依資料庫記錄的主要成分）。')); }
    var listEl = mk('div', 'product-list');
    scored.slice(0, 80).forEach(function(y){
      var x = y.x;
      var item = { name: x.p.name, subcat: x.brand + '・' + (x.p.subcatTag || CAT[x.cat]), ingredients: x.p.ingredients,
        suitable_for: x.p.suitableFor ? x.p.suitableFor.join('、') : '', reason: x.p.reason, caution: x.p.caution || '', _src: x.p };
      var card = window.__buildProductCard(item, { buyLinks: x.brand + ' ' + x.p.name, brand: x.brand, cat: x.cat });
      card.querySelectorAll('.ing-tag').forEach(function(t){ if(x.hit.indexOf(t.textContent) !== -1){ t.classList.add('hit'); } });
      listEl.appendChild(card);
    });
    box.appendChild(listEl);
    if(scored.length > 80){ box.appendChild(mk('p', 'fit-note', '只顯示前 80 個，用上面的分類縮小範圍。')); }
  }

  function setView(v){
    document.querySelectorAll('.bview-btn').forEach(function(b){ var on = b.dataset.bview === v; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('brand-by-name').hidden = v !== 'brand';
    $('brand-by-ing').hidden = v !== 'ing';
  }
  function openFinder(q){
    var st = document.querySelector('.sub-tab[data-mode="brand"]');
    if(st){ st.click(); }
    setView('ing');
    runFinder(q);
    $('brand-by-ing').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* 「依成分查詢」查完後，加一個「看含這個成分的商品」連結 */
  function linkFor(name){
    var box = $('ing-products-link');
    if(!box){ return; }
    box.textContent = '';
    if(!name){ box.hidden = true; return; }
    var n = productsWith(name).length;
    if(!n){ box.hidden = true; return; }
    var b = mk('button', 'btn-link', '🔬 看含「' + name + '」的商品（' + n + ' 個）→');
    b.type = 'button';
    b.addEventListener('click', function(){ openFinder(name); });
    box.appendChild(b);
    box.hidden = false;
  }

  function init(){
    if(!$('brand-by-ing')){ return; }
    document.querySelectorAll('.bview-btn').forEach(function(b){ b.addEventListener('click', function(){ setView(b.dataset.bview); }); });
    $('bi-btn').addEventListener('click', function(){ runFinder(); });
    var inp = $('bi-input');
    inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(s){ s.hide(); } runFinder(); } });
    var s = window.__ingSearch ? window.__ingSearch.attach(inp, $('bi-suggest'), function(r){ runFinder(r.label.replace(/（.*?）/g, '')); }) : null;
    document.querySelectorAll('#bi-quick .chip').forEach(function(c){ c.addEventListener('click', function(){ runFinder(c.textContent); }); });
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.__brandTools = { productsWith: productsWith, keys: keys, decorate: decorate, linkFor: linkFor, openFinder: openFinder, runFinder: runFinder };
})();
