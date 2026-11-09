/* ============================================================
   成分搜尋（2026-11-09）：打英文前幾個字母（nia → 菸鹼醯胺）、研究簡稱（NAM、SA、EPA）
   或中文都能找到成分。資料來源：
   - 「依成分查詢」資料庫（window.__ingDB，index.html 提供）
   - 代號與簡稱（codes.js）
   - 店內挑選的成分知識（pick.js）
   ============================================================ */
(function(){
  'use strict';

  var CAT = { supplement:'保健食品', skincare:'保養品', cosmetic:'化妝品' };
  function toHalf(s){ return String(s).replace(/[！-～]/g, function(ch){ return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); }).replace(/　/g, ' '); }
  function norm(s){ return toHalf(s).toLowerCase().replace(/[\s.\-_'’·・,，()（）\[\]\/／+&]/g, ''); }
  function base(label){ return norm(String(label).replace(/[（(].*?[)）]/g, '')); }
  function isAscii(s){ return /^[a-z0-9α-ω%]+$/i.test(s); }

  var INDEX = null;
  function addTerms(list, entry, phrases){
    phrases.forEach(function(p){
      if(!p){ return; }
      var n = norm(p);
      if(!n){ return; }
      var words = toHalf(p).toLowerCase().split(/[\s\-\/(),，、／（）]+/).map(norm).filter(function(w){ return w.length >= 2; });
      list.push({ n:n, show:p, words:words, e:entry });
    });
  }
  function build(){
    var terms = [];
    var D = window.__ingDB;
    if(D){
      Object.keys(D.ALL_ITEMS).forEach(function(name){
        var cat = D.ALL_ITEMS[name], item = D.DB[cat][name];
        var e = { label:name, kind:'db', cat:cat, key:base(name), pri:0, go:name };
        addTerms(terms, e, [name].concat(String(item.en || '').split(/\s*\/\s*/)));
      });
      Object.keys(D.EN_ALIAS).forEach(function(al){
        var name = D.EN_ALIAS[al];
        if(!D.ALL_ITEMS[name]){ return; }
        addTerms(terms, { label:name, kind:'db', cat:D.ALL_ITEMS[name], key:base(name), pri:0, go:name }, [al]);
      });
    }
    (window.INGREDIENT_CODES || []).forEach(function(c){
      // 沒有連到詳細資料的代號，排在保健食品／保養品成分卡後面
      var e = { label:c.zh, kind:'code', code:c, key:base(c.zh), pri:(c.db || c.pk) ? 1 : 2.5, go:c.c };
      addTerms(terms, e, [c.c, c.zh].concat(c.alt, String(c.en).split(/\s*\/\s*/)));
    });
    var P = window.__pick;
    if(P && P.ings){
      P.ings.forEach(function(ing){
        if(ing.base){ return; }
        var e = { label:ing.k, kind:'pick', key:base(ing.k), pri:2, go:ing.k };
        addTerms(terms, e, [ing.k].concat(ing.a));
      });
    }
    var S = window.__sup;
    if(S && S.ings){
      S.ings.forEach(function(ing){
        if(ing.kind === 'sugar'){ return; }
        var e = { label:ing.k, kind:'sup', key:base(ing.k), pri:2, go:ing.k };
        addTerms(terms, e, [ing.k].concat(ing.a));
      });
    }
    INDEX = terms;
  }

  /* 分數：0 完全相同、1 開頭相同、2 某個英文單字開頭相同、3 中間含有 */
  function search(q, max){
    if(!INDEX){ build(); }
    var n = norm(q || '');
    if(!n){ return []; }
    var ascii = isAscii(n);
    if(ascii && n.length < 2){ return []; }
    var best = {};
    INDEX.forEach(function(t){
      var sc = -1;
      if(t.n === n){ sc = 0; }
      else if(t.n.indexOf(n) === 0){ sc = 1; }
      else if(ascii && t.words.some(function(w){ return w.indexOf(n) === 0; })){ sc = 2; }
      else if(t.n.indexOf(n) !== -1 && (!ascii || n.length >= 4)){ sc = 3; }
      if(sc < 0){ return; }
      var k = t.e.key, cur = best[k];
      // 不是直接打簡稱時（打中文或英文開頭），點了就看成分本身，不是看簡稱
      var go = t.e.go;
      if(t.e.kind === 'code' && sc > 0 && (t.e.code.db || t.e.code.pk)){ go = t.e.code.db || t.e.code.pk; }
      var cand = { label:t.e.label, kind:t.e.kind, cat:t.e.cat, code:t.e.code, go:go, score:sc, pri:t.e.pri, show:String(t.show).replace(/[()（）]/g, '').trim(), len:t.n.length };
      if(!cur || sc < cur.score || (sc === cur.score && (cand.pri < cur.pri || (cand.pri === cur.pri && cand.len < cur.len)))){
        // 簡稱完全對上時，保留代號卡（例如 NAM、EPA）
        best[k] = cand;
      }
    });
    return Object.keys(best).map(function(k){ return best[k]; })
      .sort(function(a, b){ return a.score - b.score || a.pri - b.pri || a.len - b.len; })
      .slice(0, max || 8);
  }

  function tagOf(r){
    if(r.kind === 'db'){ return CAT[r.cat] || ''; }
    if(r.kind === 'code'){ return r.code.t === 'E' ? '食品添加物' : r.code.t === 'CI' ? '色素' : r.code.t === 'U' ? '標示' : (/s/.test(r.code.at) && !/[kc]/.test(r.code.at) ? '保健食品' : /[kc]/.test(r.code.at) && !/s/.test(r.code.at) ? '保養品' : '簡稱'); }
    return r.kind === 'sup' ? '保健食品成分' : '保養品成分';
  }

  /* 在輸入框下方顯示建議 */
  function attach(input, box, onChoose){
    function render(){
      box.textContent = '';
      var v = input.value.trim();
      var list = search(v, 8);
      if(!list.length || (list.length === 1 && list[0].score === 0 && norm(list[0].label) === norm(v))){ box.hidden = true; return; }
      list.forEach(function(r){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ing-sug';
        var nm = document.createElement('b'); nm.textContent = r.label; b.appendChild(nm);
        if(norm(r.show) !== norm(r.label)){ var s = document.createElement('span'); s.className = 'ing-sug-sub'; s.textContent = r.show; b.appendChild(s); }
        var tg = document.createElement('span'); tg.className = 'ing-sug-tag'; tg.textContent = tagOf(r); b.appendChild(tg);
        b.addEventListener('click', function(){ box.hidden = true; onChoose(r); });
        box.appendChild(b);
      });
      box.hidden = false;
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function(){ if(input.value.trim()){ render(); } });
    return { render:render, hide:function(){ box.hidden = true; } };
  }

  window.__ingSearch = { search:search, attach:attach, norm:norm, rebuild:function(){ INDEX = null; } };
})();
