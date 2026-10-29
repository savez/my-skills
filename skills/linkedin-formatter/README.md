# ✍️ linkedin-formatter

**Grassetto, corsivo ed elenchi nei post LinkedIn, scritti dal tuo agente AI.**

LinkedIn accetta solo testo semplice. Questa skill insegna all'agente a scrivere il post in markup (quello che un LLM usa già) e a convertirlo in caratteri Unicode che su LinkedIn appaiono formattati. La conversione la fa uno script, non il modello: il risultato è sempre identico e non ci sono lettere sbagliate.

[![Python](https://img.shields.io/badge/Python-3.8%2B%20·%20stdlib%20only-3776AB?logo=python&logoColor=white)](scripts/linkedin_format.py)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-D97757?logo=anthropic&logoColor=white)](#claude-code)
[![Hermes Agent](https://img.shields.io/badge/Hermes%20Agent-compatible-6E56CF)](#hermes-agent)

## 👀 Prima e dopo

L'agente scrive:

```markdown
# 🚀 Ho lanciato un progetto
È **open source** e *gratuito*.
Usa ++Unicode++, non ~~rich text~~.
- [x] skill pronta
- [ ] la tua stella
> provalo oggi
---
https://github.com/savez/my-skills #opensource @savez
```

Tu incolli su LinkedIn:

```
🚀 𝗛𝗼 𝗹𝗮𝗻𝗰𝗶𝗮𝘁𝗼 𝘂𝗻 𝗽𝗿𝗼𝗴𝗲𝘁𝘁𝗼
È 𝗼𝗽𝗲𝗻 𝘀𝗼𝘂𝗿𝗰𝗲 e 𝘨𝘳𝘢𝘵𝘶𝘪𝘵𝘰.
Usa U̲n̲i̲c̲o̲d̲e̲, non r̶i̶c̶h̶ ̶t̶e̶x̶t̶.
✅ skill pronta
⬜ la tua stella
▍𝘱𝘳𝘰𝘷𝘢𝘭𝘰 𝘰𝘨𝘨𝘪
━━━━━━━━━━
https://github.com/savez/my-skills #opensource @savez
```

## ✨ Caratteristiche

- 🔗 **Link, #hashtag e @menzioni protetti**: restano testo normale anche dentro un grassetto, così continuano a funzionare.
- 🇮🇹 **Accenti italiani**: à è é ì ò ù non hanno una forma "matematica" in Unicode; la lettera viene trasformata e l'accento resta come diacritico.
- 📏 **Conteggio caratteri**: con `--json` ottieni il testo e il conteggio rispetto al limite di 3000 caratteri di LinkedIn.
- 🎨 **23 stili** da applicare a tutto il testo: calligrafico, doppio tratto, monospazio, elenchi numerati, ordinamento righe e altri.
- ↩️ **Togli formattazione**: riporta a testo semplice un post già formattato, per modificarlo.
- 📦 **Zero dipendenze**: solo Python 3.8+ e la libreria standard.

## 🚀 Installazione

Dalla root del repository:

### Claude Code

```bash
mkdir -p ~/.claude/skills/linkedin-formatter
cp -r skills/linkedin-formatter/SKILL.md skills/linkedin-formatter/scripts ~/.claude/skills/linkedin-formatter/
```

### Hermes Agent

La skill usa lo strumento `terminal` di Hermes (`requires_toolsets: [terminal]`), che deve essere attivo.

```bash
mkdir -p ~/.hermes/skills/linkedin-formatter
cp -r skills/linkedin-formatter/SKILL.md skills/linkedin-formatter/scripts ~/.hermes/skills/linkedin-formatter/
```

Poi chiedi all'agente qualcosa come *"scrivimi un post LinkedIn su…"* o *"formatta questo testo per LinkedIn"*.

## 📝 Markup supportato

| Scrivi | Ottieni |
|---|---|
| `**testo**`, `__testo__` | 𝘁𝗲𝘀𝘁𝗼 (grassetto) |
| `*testo*`, `_testo_` | 𝘵𝘦𝘴𝘵𝘰 (corsivo) |
| `***testo***` | 𝙩𝙚𝙨𝙩𝙤 (grassetto corsivo) |
| `++testo++` | t̲e̲s̲t̲o̲ (sottolineato) |
| `~~testo~~` | t̶e̶s̶t̶o̶ (barrato) |
| `` `testo` `` | 𝚝𝚎𝚜𝚝𝚘 (monospazio) |
| `# Titolo` | riga intera in grassetto |
| `- punto` | `• punto` |
| `- [ ] da fare` / `- [x] fatto` | `⬜` / `✅` |
| `> citazione` | `▍` + corsivo |
| `---` | `━━━━━━━━━━` |

Gli stili si possono annidare (`**grassetto con *corsivo***`). Il `_` dentro le parole (`nome_file`) non diventa corsivo.

## 🖥️ Uso da terminale

Lo script funziona anche da solo, senza agente:

```bash
S=skills/linkedin-formatter/scripts/linkedin_format.py

python3 $S post.md                              # markup → testo per LinkedIn
echo 'Ciao **mondo**' | python3 $S --json       # testo + conteggio caratteri
python3 $S --family serif post.md               # grassetto/corsivo con grazie
python3 $S --style script --text 'Testo'        # 𝒯ℯ𝓈𝓉ℴ
python3 $S --plain < formattato.txt             # torna a testo semplice
python3 $S --list-styles                        # elenco degli stili
```

## ⚠️ Da sapere

- Le **menzioni vere** (con notifica) non si creano col testo: vanno aggiunte a mano in LinkedIn.
- Il testo formattato **non è indicizzato** dalla ricerca di LinkedIn e i **lettori di schermo** lo leggono male: usa la formattazione per titolo e 2-4 parole chiave, non per paragrafi interi.
- La skill lo sa già e si regola di conseguenza.

## 🙏 Ispirazione

Ispirato al LinkedIn Text Formatter di [Typegrow](https://typegrow.com). Il codice è scritto da zero a partire dagli standard Unicode e non deriva dal loro.
