/*
 * formatter.js — formattazione "finta" per LinkedIn tramite caratteri Unicode.
 * LinkedIn non supporta il rich text: grassetto/corsivo sono ottenuti sostituendo
 * le lettere ASCII con i "Mathematical Alphanumeric Symbols" (U+1D400–U+1D7FF)
 * e sottolineato/barrato aggiungendo diacritici combinanti (U+0332 / U+0336).
 *
 * Funziona sia nel browser (window.LIFormat) sia in Node (require).
 * Implementazione clean-room. La skill Hermes ne usa un porting Python 1:1 (linkedin_format.py).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LIFormat = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // [inizio maiuscole, inizio minuscole, inizio cifre | null, eccezioni]
  // Le eccezioni coprono i "buchi" del blocco matematico: quelle lettere esistevano
  // già in Letterlike Symbols (U+2100–U+214F) e Unicode non le ha duplicate.
  var ALPHABETS = {
    bold:           [0x1D400, 0x1D41A, 0x1D7CE, {}],
    italic:         [0x1D434, 0x1D44E, null,    { h: 0x210E }],
    boldItalic:     [0x1D468, 0x1D482, 0x1D7CE, {}],
    sans:           [0x1D5A0, 0x1D5BA, 0x1D7E2, {}],
    boldSans:       [0x1D5D4, 0x1D5EE, 0x1D7EC, {}],
    italicSans:     [0x1D608, 0x1D622, null,    {}],
    boldItalicSans: [0x1D63C, 0x1D656, 0x1D7EC, {}],
    script:         [0x1D49C, 0x1D4B6, null,    { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 }],
    doubleStruck:   [0x1D538, 0x1D552, 0x1D7D8, { C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 }],
    mono:           [0x1D670, 0x1D68A, 0x1D7F6, {}]
  };

  var UNDERLINE = '\u0332';
  var STRIKE = '\u0336';
  var COMBINING_RE = /^[A-Za-z][\u0300-\u036F]+$/;

  function isMark(ch) { return /\p{M}/u.test(ch); }

  // Caratteri dopo cui NON si mette il diacritico di sottolineato/barrato.
  function skipMark(ch) {
    if (ch === '\n' || ch === '\r' || ch === '\u200D') return true;
    var cp = ch.codePointAt(0);
    return (cp >= 0x2600 && cp <= 0x27BF) ||   // simboli/dingbat (molte emoji)
           (cp >= 0x1F000 && cp <= 0x1FAFF) || // emoji
           (cp >= 0xE000 && cp <= 0xF8FF);     // Private Use (segnaposto interni)
  }

  function mapBase(ch, spec) {
    var ex = spec[3];
    if (Object.prototype.hasOwnProperty.call(ex, ch)) return String.fromCodePoint(ex[ch]);
    var c = ch.charCodeAt(0);
    if (ch.length === 1) {
      if (c >= 65 && c <= 90) return String.fromCodePoint(spec[0] + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(spec[1] + c - 97);
      if (spec[2] !== null && c >= 48 && c <= 57) return String.fromCodePoint(spec[2] + c - 48);
    }
    return ch;
  }

  // Le lettere accentate (à è é ì ò ù…) non hanno una versione "matematica":
  // le scomponiamo (NFD), trasformiamo la lettera base e lasciamo l'accento combinante.
  function mapAlphabet(text, name) {
    var spec = ALPHABETS[name];
    var out = '';
    for (var ch of text) {
      var d = ch.normalize('NFD');
      if (d !== ch && COMBINING_RE.test(d)) out += mapBase(d[0], spec) + d.slice(1);
      else out += mapBase(ch, spec);
    }
    return out;
  }

  // Aggiunge il diacritico dopo ogni cluster (carattere base + suoi accenti).
  function addMark(text, mark) {
    var out = '';
    var chars = Array.from(text);
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      out += ch;
      if (isMark(ch)) continue;
      while (i + 1 < chars.length && isMark(chars[i + 1])) out += chars[++i];
      if (!skipMark(ch)) out += mark;
    }
    return out;
  }

  function fullwidth(text) {
    var out = '';
    for (var ch of text) {
      var c = ch.codePointAt(0);
      if (c === 0x20) out += '\u3000';
      else if (c >= 0x21 && c <= 0x7E) out += String.fromCodePoint(c + 0xFEE0);
      else out += ch;
    }
    return out;
  }

  function lines(text) { return text.split('\n'); }
  function stripListPrefix(l) { return l.replace(/^\s*(?:[-*+•▪◦]|\d+[.)]|[✅⬜☐☑️]+)\s+/u, ''); }

  function listify(text, prefixFn) {
    var n = 0;
    return lines(text).map(function (l) {
      if (!l.trim()) return l;
      n++;
      return prefixFn(n) + stripListPrefix(l).trim();
    }).join('\n');
  }

  function sortLines(text, dir) {
    var ls = lines(text).filter(function (l) { return l.trim(); }).map(function (l) { return l.trim(); });
    ls.sort(function (a, b) { return a.localeCompare(b, 'it', { sensitivity: 'base' }); });
    if (dir < 0) ls.reverse();
    return ls.join('\n');
  }

  // Stili "a testo intero", come nella lista di Typegrow (+ monospace).
  var STYLES = [
    { id: 'normal',             label: 'Normale',               fn: function (t) { return t; } },
    { id: 'bold',               label: 'Grassetto',             fn: function (t) { return mapAlphabet(t, 'bold'); } },
    { id: 'boldSans',           label: 'Grassetto sans',        fn: function (t) { return mapAlphabet(t, 'boldSans'); } },
    { id: 'italic',             label: 'Corsivo',               fn: function (t) { return mapAlphabet(t, 'italic'); } },
    { id: 'italicSans',         label: 'Corsivo sans',          fn: function (t) { return mapAlphabet(t, 'italicSans'); } },
    { id: 'boldItalic',         label: 'Grassetto corsivo',     fn: function (t) { return mapAlphabet(t, 'boldItalic'); } },
    { id: 'boldItalicSans',     label: 'Grassetto corsivo sans', fn: function (t) { return mapAlphabet(t, 'boldItalicSans'); } },
    { id: 'sans',               label: 'Sans',                  fn: function (t) { return mapAlphabet(t, 'sans'); } },
    { id: 'mono',               label: 'Monospazio',            fn: function (t) { return mapAlphabet(t, 'mono'); } },
    { id: 'underline',          label: 'Sottolineato',          fn: function (t) { return addMark(t, UNDERLINE); } },
    { id: 'strike',             label: 'Barrato',               fn: function (t) { return addMark(t, STRIKE); } },
    { id: 'boldUnderline',      label: 'Grassetto sottolineato', fn: function (t) { return addMark(mapAlphabet(t, 'boldSans'), UNDERLINE); } },
    { id: 'boldStrike',         label: 'Grassetto barrato',     fn: function (t) { return addMark(mapAlphabet(t, 'boldSans'), STRIKE); } },
    { id: 'script',             label: 'Calligrafico',          fn: function (t) { return mapAlphabet(t, 'script'); } },
    { id: 'doubleStruck',       label: 'Doppio tratto',         fn: function (t) { return mapAlphabet(t, 'doubleStruck'); } },
    { id: 'fullwidth',          label: 'Larghezza piena',       fn: fullwidth },
    { id: 'upper',              label: 'Maiuscolo',             fn: function (t) { return t.toLocaleUpperCase('it'); } },
    { id: 'lower',              label: 'Minuscolo',             fn: function (t) { return t.toLocaleLowerCase('it'); } },
    { id: 'numbered',           label: 'Elenco numerato',       fn: function (t) { return listify(t, function (n) { return n + '. '; }); } },
    { id: 'bullets',            label: 'Elenco puntato',        fn: function (t) { return listify(t, function () { return '• '; }); } },
    { id: 'checklist',          label: 'Checklist',             fn: function (t) { return listify(t, function () { return '✅ '; }); } },
    { id: 'sortAsc',            label: 'Righe in ordine A→Z',   fn: function (t) { return sortLines(t, 1); } },
    { id: 'sortDesc',           label: 'Righe in ordine Z→A',   fn: function (t) { return sortLines(t, -1); } }
  ];
  var STYLE_BY_ID = {};
  STYLES.forEach(function (s) { STYLE_BY_ID[s.id] = s; });

  // Stili di elenco/ordinamento lavorano per righe: niente segnaposto.
  var LINE_STYLES = { numbered: 1, bullets: 1, checklist: 1, sortAsc: 1, sortDesc: 1 };

  function protect(text, saved) {
    return text.replace(PROTECT_RE, function (m) {
      saved.push(m);
      return '\uE000' + String.fromCharCode(0xE100 + saved.length - 1) + '\uE001';
    });
  }
  function restore(text, saved) {
    return text.replace(/\uE000([\uE100-\uF8FF])\uE001/g, function (_, c) { return saved[c.charCodeAt(0) - 0xE100]; });
  }

  // Applica uno stile a tutto il testo. URL, #hashtag e @menzioni restano intatti.
  function applyStyle(text, id) {
    var s = STYLE_BY_ID[id];
    if (!s) throw new Error('Stile sconosciuto: ' + id);
    if (LINE_STYLES[id]) return s.fn(text);
    var saved = [];
    return restore(s.fn(protect(text, saved)), saved);
  }

  // ---------------------------------------------------------------------------
  // Markup → LinkedIn: il formato che Hermes (o tu) scrivete.
  //   **grassetto**  __grassetto__  *corsivo*  _corsivo_  ***grassetto corsivo***
  //   ++sottolineato++  ~~barrato~~  `monospazio`
  //   # Titolo → grassetto   - punto → •   - [ ] / - [x] → ⬜ / ✅
  //   > citazione → ▍ corsivo   --- → riga divisoria
  // URL, #hashtag e @menzioni non vengono MAI trasformati, anche dentro **…**:
  // con caratteri Unicode smetterebbero di essere link/hashtag cliccabili.
  // ---------------------------------------------------------------------------
  var PROTECT_RE = /(https?:\/\/[^\s<>()*~`]+[^\s<>()*~`.,;:!?'"_+]|www\.[^\s<>()*~`]+[^\s<>()*~`.,;:!?'"_+]|#[\p{L}\p{N}_]+|@[\p{L}\p{N}_.-]*[\p{L}\p{N}_])/gu;

  var INLINE = [
    { re: /`([^`\n]+)`/,                                   flag: 'code' },
    { re: /\*\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*\*/,           flag: 'bi' },
    { re: /\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*/,               flag: 'b' },
    { re: /(?<![\p{L}\p{N}_])__(?!\s)([\s\S]+?)(?<!\s)__(?![\p{L}\p{N}_])/u, flag: 'b' },
    { re: /\+\+(?!\s)([\s\S]+?)(?<!\s)\+\+/,               flag: 'u' },
    { re: /~~(?!\s)([\s\S]+?)(?<!\s)~~/,                   flag: 's' },
    { re: /(?<![*\p{L}\p{N}])\*(?![\s*])([^*\n]+?)(?<![\s*])\*(?![*\p{L}\p{N}])/u, flag: 'i' },
    { re: /(?<![\p{L}\p{N}_])_(?![\s_])([^_\n]+?)(?<![\s_])_(?![\p{L}\p{N}_])/u, flag: 'i' }
  ];

  function styleRun(text, f, family) {
    if (!text) return text;
    var serif = family === 'serif';
    var out = text;
    if (f.code) out = mapAlphabet(out, 'mono');
    else if (f.b && f.i) out = mapAlphabet(out, serif ? 'boldItalic' : 'boldItalicSans');
    else if (f.b) out = mapAlphabet(out, serif ? 'bold' : 'boldSans');
    else if (f.i) out = mapAlphabet(out, serif ? 'italic' : 'italicSans');
    if (f.u) out = addMark(out, UNDERLINE);
    if (f.s) out = addMark(out, STRIKE);
    return out;
  }

  function renderInline(text, flags, family) {
    var out = '';
    var rest = text;
    while (rest.length) {
      var best = null;
      for (var k = 0; k < INLINE.length; k++) {
        if (flags.code) break; // niente markup dentro `codice`
        var m = INLINE[k].re.exec(rest);
        if (m && (best === null || m.index < best.m.index)) best = { m: m, flag: INLINE[k].flag };
      }
      if (!best) { out += styleRun(rest, flags, family); break; }
      out += styleRun(rest.slice(0, best.m.index), flags, family);
      var nf = Object.assign({}, flags);
      if (best.flag === 'bi') { nf.b = true; nf.i = true; } else nf[best.flag] = true;
      out += renderInline(best.m[1], nf, family);
      rest = rest.slice(best.m.index + best.m[0].length);
    }
    return out;
  }

  function fromMarkup(text, opts) {
    opts = opts || {};
    var family = opts.family === 'serif' ? 'serif' : 'sans';
    var bullet = opts.bullet || '•';
    var saved = [];
    var src = protect(String(text).replace(/\r\n?/g, '\n'), saved);

    var outLines = lines(src).map(function (line) {
      var m;
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return '━━━━━━━━━━';
      if ((m = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line))) return renderInline(m[1], { b: true }, family);
      if ((m = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(line))) return m[1] + (m[2] === ' ' ? '⬜ ' : '✅ ') + renderInline(m[3], {}, family);
      if ((m = /^(\s*)[-*+]\s+(.*)$/.exec(line))) return m[1] + bullet + ' ' + renderInline(m[2], {}, family);
      if ((m = /^\s*>\s?(.*)$/.exec(line))) return '▍' + renderInline(m[1], { i: true }, family);
      return renderInline(line, {}, family);
    });

    return restore(outLines.join('\n'), saved);
  }

  // Testo senza markup (per applicarci sopra uno stile intero).
  function stripMarkup(text, opts) { return toPlain(fromMarkup(text, opts)); }

  // Conteggio: LinkedIn ha un limite di 3000 caratteri per post. Non è documentato
  // se conti code point o unità UTF-16: ogni lettera "matematica" vale 1 code point
  // ma 2 unità UTF-16, quindi riportiamo entrambi e usiamo il più prudente.
  function count(text) {
    return { codePoints: Array.from(text).length, utf16: text.length, limit: 3000 };
  }

  // Inverso (best effort): riporta le lettere matematiche ad ASCII e toglie i
  // diacritici di sottolineato/barrato. Utile per "pulire" un testo già formattato.
  function toPlain(text) {
    var rev = {};
    Object.keys(ALPHABETS).forEach(function (name) {
      var s = ALPHABETS[name];
      for (var i = 0; i < 26; i++) {
        var U = String.fromCharCode(65 + i), L = String.fromCharCode(97 + i);
        rev[mapBase(U, s)] = U; rev[mapBase(L, s)] = L;
      }
      if (s[2] !== null) for (var d = 0; d < 10; d++) rev[String.fromCodePoint(s[2] + d)] = String(d);
    });
    var out = '';
    for (var ch of text) {
      if (ch === UNDERLINE || ch === STRIKE) continue;
      var c = ch.codePointAt(0);
      if (c >= 0xFF01 && c <= 0xFF5E) out += String.fromCodePoint(c - 0xFEE0);
      else if (c === 0x3000) out += ' ';
      else out += rev[ch] || ch;
    }
    return out.normalize('NFC');
  }

  return {
    STYLES: STYLES.map(function (s) { return { id: s.id, label: s.label }; }),
    applyStyle: applyStyle,
    fromMarkup: fromMarkup,
    stripMarkup: stripMarkup,
    toPlain: toPlain,
    count: count
  };
});
