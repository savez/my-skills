#!/usr/bin/env python3
"""linkedin_format.py — formattazione Unicode per post LinkedIn (solo stdlib).

Porting 1:1 di pwa/formatter.js: stesso markup, stessi stili, stesso output.
Python perché Hermes Agent è scritto in Python: è sempre disponibile nel suo
ambiente, mentre Node.js è opzionale.

Uso:
  echo "Ciao **mondo**" | linkedin_format.py                 # markup -> LinkedIn
  linkedin_format.py post.md --family serif                  # grassetto/corsivo con grazie
  linkedin_format.py --style boldSans --text "Testo intero"  # uno stile su tutto il testo
  linkedin_format.py --plain < formattato.txt                # torna a testo semplice
  linkedin_format.py --json < post.md                        # testo + conteggi in JSON
  linkedin_format.py --link https://pwa.example/ < post.md   # link alla PWA già compilata
  linkedin_format.py --list-styles
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from urllib.parse import quote

ALPHABETS = {
    "bold":           (0x1D400, 0x1D41A, 0x1D7CE, {}),
    "italic":         (0x1D434, 0x1D44E, None,    {"h": 0x210E}),
    "boldItalic":     (0x1D468, 0x1D482, 0x1D7CE, {}),
    "sans":           (0x1D5A0, 0x1D5BA, 0x1D7E2, {}),
    "boldSans":       (0x1D5D4, 0x1D5EE, 0x1D7EC, {}),
    "italicSans":     (0x1D608, 0x1D622, None,    {}),
    "boldItalicSans": (0x1D63C, 0x1D656, 0x1D7EC, {}),
    "script":         (0x1D49C, 0x1D4B6, None,    {"B": 0x212C, "E": 0x2130, "F": 0x2131, "H": 0x210B, "I": 0x2110,
                                                   "L": 0x2112, "M": 0x2133, "R": 0x211B, "e": 0x212F, "g": 0x210A, "o": 0x2134}),
    "doubleStruck":   (0x1D538, 0x1D552, 0x1D7D8, {"C": 0x2102, "H": 0x210D, "N": 0x2115, "P": 0x2119, "Q": 0x211A,
                                                   "R": 0x211D, "Z": 0x2124}),
    "mono":           (0x1D670, 0x1D68A, 0x1D7F6, {}),
}

UNDERLINE = "\u0332"
STRIKE = "\u0336"
COMBINING_RE = re.compile(r"^[A-Za-z][\u0300-\u036F]+$")


def is_mark(ch):
    return unicodedata.category(ch).startswith("M")


def skip_mark(ch):
    if ch in "\n\r\u200d":
        return True
    cp = ord(ch)
    return 0x2600 <= cp <= 0x27BF or 0x1F000 <= cp <= 0x1FAFF or 0xE000 <= cp <= 0xF8FF


def map_base(ch, spec):
    up, lo, dg, ex = spec
    if ch in ex:
        return chr(ex[ch])
    c = ord(ch)
    if 65 <= c <= 90:
        return chr(up + c - 65)
    if 97 <= c <= 122:
        return chr(lo + c - 97)
    if dg is not None and 48 <= c <= 57:
        return chr(dg + c - 48)
    return ch


def map_alphabet(text, name):
    spec = ALPHABETS[name]
    out = []
    for ch in text:
        d = unicodedata.normalize("NFD", ch)
        if d != ch and COMBINING_RE.match(d):
            out.append(map_base(d[0], spec) + d[1:])
        else:
            out.append(map_base(ch, spec))
    return "".join(out)


def add_mark(text, mark):
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        out.append(ch)
        if is_mark(ch):
            i += 1
            continue
        while i + 1 < n and is_mark(text[i + 1]):
            i += 1
            out.append(text[i])
        if not skip_mark(ch):
            out.append(mark)
        i += 1
    return "".join(out)


def fullwidth(text):
    out = []
    for ch in text:
        c = ord(ch)
        if c == 0x20:
            out.append("\u3000")
        elif 0x21 <= c <= 0x7E:
            out.append(chr(c + 0xFEE0))
        else:
            out.append(ch)
    return "".join(out)


LIST_PREFIX_RE = re.compile(r"^\s*(?:[-*+•▪◦]|\d+[.)]|[✅⬜☐☑\ufe0f]+)\s+")


def listify(text, prefix_fn):
    out, n = [], 0
    for line in text.split("\n"):
        if not line.strip():
            out.append(line)
            continue
        n += 1
        out.append(prefix_fn(n) + LIST_PREFIX_RE.sub("", line, count=1).strip())
    return "\n".join(out)


def sort_lines(text, reverse):
    # Ordinamento case/accent-insensitive approssimato (JS usa localeCompare 'it').
    ls = [l.strip() for l in text.split("\n") if l.strip()]
    key = lambda s: "".join(c for c in unicodedata.normalize("NFD", s.casefold()) if not is_mark(c))
    return "\n".join(sorted(ls, key=key, reverse=reverse))


STYLES = [
    ("normal", "Normale", lambda t: t),
    ("bold", "Grassetto", lambda t: map_alphabet(t, "bold")),
    ("boldSans", "Grassetto sans", lambda t: map_alphabet(t, "boldSans")),
    ("italic", "Corsivo", lambda t: map_alphabet(t, "italic")),
    ("italicSans", "Corsivo sans", lambda t: map_alphabet(t, "italicSans")),
    ("boldItalic", "Grassetto corsivo", lambda t: map_alphabet(t, "boldItalic")),
    ("boldItalicSans", "Grassetto corsivo sans", lambda t: map_alphabet(t, "boldItalicSans")),
    ("sans", "Sans", lambda t: map_alphabet(t, "sans")),
    ("mono", "Monospazio", lambda t: map_alphabet(t, "mono")),
    ("underline", "Sottolineato", lambda t: add_mark(t, UNDERLINE)),
    ("strike", "Barrato", lambda t: add_mark(t, STRIKE)),
    ("boldUnderline", "Grassetto sottolineato", lambda t: add_mark(map_alphabet(t, "boldSans"), UNDERLINE)),
    ("boldStrike", "Grassetto barrato", lambda t: add_mark(map_alphabet(t, "boldSans"), STRIKE)),
    ("script", "Calligrafico", lambda t: map_alphabet(t, "script")),
    ("doubleStruck", "Doppio tratto", lambda t: map_alphabet(t, "doubleStruck")),
    ("fullwidth", "Larghezza piena", fullwidth),
    ("upper", "Maiuscolo", lambda t: t.upper()),
    ("lower", "Minuscolo", lambda t: t.lower()),
    ("numbered", "Elenco numerato", lambda t: listify(t, lambda n: f"{n}. ")),
    ("bullets", "Elenco puntato", lambda t: listify(t, lambda n: "• ")),
    ("checklist", "Checklist", lambda t: listify(t, lambda n: "✅ ")),
    ("sortAsc", "Righe in ordine A→Z", lambda t: sort_lines(t, False)),
    ("sortDesc", "Righe in ordine Z→A", lambda t: sort_lines(t, True)),
]
STYLE_BY_ID = {s[0]: s for s in STYLES}
LINE_STYLES = {"numbered", "bullets", "checklist", "sortAsc", "sortDesc"}

# --- Protezione di URL, #hashtag e @menzioni --------------------------------
_L = r"[^\W_]"  # lettera o cifra Unicode (equivale a [\p{L}\p{N}])
PROTECT_RE = re.compile(
    r"(https?://[^\s<>()*~`]+[^\s<>()*~`.,;:!?'\"_+]"
    r"|www\.[^\s<>()*~`]+[^\s<>()*~`.,;:!?'\"_+]"
    r"|#\w+"
    r"|@[\w.-]*\w)"
)
PH_RE = re.compile("\ue000([\ue100-\uf8ff])\ue001")


def _protect(text, saved):
    def repl(m):
        saved.append(m.group(0))
        return "\ue000" + chr(0xE100 + len(saved) - 1) + "\ue001"
    return PROTECT_RE.sub(repl, text)


def _restore(text, saved):
    return PH_RE.sub(lambda m: saved[ord(m.group(1)) - 0xE100], text)


def apply_style(text, style_id):
    """Applica uno stile a tutto il testo. URL, #hashtag e @menzioni restano intatti."""
    if style_id not in STYLE_BY_ID:
        raise ValueError(f"Stile sconosciuto: {style_id}")
    fn = STYLE_BY_ID[style_id][2]
    if style_id in LINE_STYLES:
        return fn(text)
    saved = []
    return _restore(fn(_protect(text, saved)), saved)


# --- Markup -> LinkedIn ------------------------------------------------------
INLINE = [
    (re.compile(r"`([^`\n]+)`"), "code"),
    (re.compile(r"\*\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*\*"), "bi"),
    (re.compile(r"\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*"), "b"),
    (re.compile(r"(?<!\w)__(?!\s)([\s\S]+?)(?<!\s)__(?!\w)"), "b"),
    (re.compile(r"\+\+(?!\s)([\s\S]+?)(?<!\s)\+\+"), "u"),
    (re.compile(r"~~(?!\s)([\s\S]+?)(?<!\s)~~"), "s"),
    (re.compile(r"(?<![*]|" + _L + r")\*(?![\s*])([^*\n]+?)(?<![\s*])\*(?![*]|" + _L + r")"), "i"),
    (re.compile(r"(?<!\w)_(?![\s_])([^_\n]+?)(?<![\s_])_(?!\w)"), "i"),
]


def style_run(text, f, family):
    if not text:
        return text
    serif = family == "serif"
    out = text
    if f.get("code"):
        out = map_alphabet(out, "mono")
    elif f.get("b") and f.get("i"):
        out = map_alphabet(out, "boldItalic" if serif else "boldItalicSans")
    elif f.get("b"):
        out = map_alphabet(out, "bold" if serif else "boldSans")
    elif f.get("i"):
        out = map_alphabet(out, "italic" if serif else "italicSans")
    if f.get("u"):
        out = add_mark(out, UNDERLINE)
    if f.get("s"):
        out = add_mark(out, STRIKE)
    return out


def render_inline(text, flags, family):
    out = []
    rest = text
    while rest:
        best = None
        if not flags.get("code"):
            for rx, flag in INLINE:
                m = rx.search(rest)
                if m and (best is None or m.start() < best[0].start()):
                    best = (m, flag)
        if best is None:
            out.append(style_run(rest, flags, family))
            break
        m, flag = best
        out.append(style_run(rest[:m.start()], flags, family))
        nf = dict(flags)
        if flag == "bi":
            nf["b"] = nf["i"] = True
        else:
            nf[flag] = True
        out.append(render_inline(m.group(1), nf, family))
        rest = rest[m.end():]
    return "".join(out)


HR_RE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$")
H_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$")
CHECK_RE = re.compile(r"^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$")
BULLET_RE = re.compile(r"^(\s*)[-*+]\s+(.*)$")
QUOTE_RE = re.compile(r"^\s*>\s?(.*)$")


def from_markup(text, family="sans", bullet="•"):
    family = "serif" if family == "serif" else "sans"
    saved = []
    src = _protect(re.sub(r"\r\n?", "\n", str(text)), saved)
    out = []
    for line in src.split("\n"):
        if HR_RE.match(line):
            out.append("━━━━━━━━━━")
        elif (m := H_RE.match(line)):
            out.append(render_inline(m.group(1), {"b": True}, family))
        elif (m := CHECK_RE.match(line)):
            out.append(m.group(1) + ("⬜ " if m.group(2) == " " else "✅ ") + render_inline(m.group(3), {}, family))
        elif (m := BULLET_RE.match(line)):
            out.append(m.group(1) + bullet + " " + render_inline(m.group(2), {}, family))
        elif (m := QUOTE_RE.match(line)):
            out.append("▍" + render_inline(m.group(1), {"i": True}, family))
        else:
            out.append(render_inline(line, {}, family))
    return _restore("\n".join(out), saved)


def count(text):
    return {"codePoints": len(text), "utf16": len(text.encode("utf-16-le")) // 2, "limit": 3000}


def to_plain(text):
    rev = {}
    for spec in ALPHABETS.values():
        for i in range(26):
            u, l = chr(65 + i), chr(97 + i)
            rev[map_base(u, spec)] = u
            rev[map_base(l, spec)] = l
        if spec[2] is not None:
            for d in range(10):
                rev[chr(spec[2] + d)] = str(d)
    out = []
    for ch in text:
        if ch in (UNDERLINE, STRIKE):
            continue
        c = ord(ch)
        if 0xFF01 <= c <= 0xFF5E:
            out.append(chr(c - 0xFEE0))
        elif c == 0x3000:
            out.append(" ")
        else:
            out.append(rev.get(ch, ch))
    return unicodedata.normalize("NFC", "".join(out))


def strip_markup(text, family="sans"):
    """Testo senza markup (per applicarci sopra uno stile intero)."""
    return to_plain(from_markup(text, family=family))


def main(argv=None):
    p = argparse.ArgumentParser(description="Formatta testo per LinkedIn con caratteri Unicode.")
    p.add_argument("input", nargs="?", help="file da leggere, '-' per stdin, oppure testo diretto")
    p.add_argument("--text", help="testo da formattare (alternativa a file/stdin)")
    p.add_argument("--style", help="applica uno stile a tutto il testo invece di interpretare il markup")
    p.add_argument("--family", choices=["sans", "serif"], default="sans", help="famiglia per **grassetto**/*corsivo* (default: sans)")
    p.add_argument("--bullet", default="•", help="simbolo per gli elenchi puntati (default: •)")
    p.add_argument("--plain", action="store_true", help="converte testo già formattato in testo semplice")
    p.add_argument("--json", action="store_true", help="stampa JSON con testo e conteggi")
    p.add_argument("--link", nargs="?", const=os.environ.get("LINKEDIN_FORMATTER_URL", ""), default=None,
                   help="stampa un link alla PWA precompilato col markup (base URL o env LINKEDIN_FORMATTER_URL)")
    p.add_argument("--list-styles", action="store_true")
    a = p.parse_args(argv)

    if a.list_styles:
        for sid, label, _ in STYLES:
            print(f"{sid}\t{label}")
        return 0

    if a.text is not None:
        src = a.text
    elif a.input and a.input != "-":
        if os.path.isfile(a.input):
            with open(a.input, encoding="utf-8") as fh:
                src = fh.read()
        else:
            src = a.input  # permette: linkedin_format.py "testo breve"
    else:
        src = sys.stdin.read()

    if a.link is not None:
        if not a.link:
            p.error("--link richiede un URL base o la variabile LINKEDIN_FORMATTER_URL")
        print(a.link.split("#", 1)[0] + "#text=" + quote(src.rstrip("\n"), safe=""))
        return 0

    if a.plain:
        result = to_plain(src)
    elif a.style:
        if a.style not in STYLE_BY_ID:
            p.error(f"stile sconosciuto: {a.style} (vedi --list-styles)")
        result = apply_style(strip_markup(src, a.family), a.style)
    else:
        result = from_markup(src, family=a.family, bullet=a.bullet)

    if a.json:
        c = count(result)
        c["overLimit"] = max(c["codePoints"], c["utf16"]) > c["limit"]
        print(json.dumps({"text": result, "count": c}, ensure_ascii=False))
    else:
        sys.stdout.write(result if result.endswith("\n") else result + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
