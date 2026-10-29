# Testo per LinkedIn — PWA + skill Hermes

Clone funzionale del LinkedIn Text Formatter di Typegrow, riscritto da zero.

```
skills/linkedin-formatter/
  SKILL.md                     istruzioni per l'agente (Hermes, Claude Code, …)
  scripts/linkedin_format.py   CLI Python (solo stdlib)
  pwa/                         app installabile (statica, offline)
    index.html  formatter.js  manifest.webmanifest  sw.js  icons/
```

Due linguaggi, scelti per dove girano:

- **PWA → JavaScript vanilla** (niente framework, build o npm). `formatter.js`
  funziona come `<script>` nel browser (espone `window.LIFormat`) e anche con
  `require()` in Node.
- **Skill Hermes → Python.** Hermes Agent è scritto in Python, quindi Python è
  sempre presente nel suo ambiente; Node.js è opzionale (serve solo per gli
  strumenti browser e il bridge WhatsApp). Con Python la skill non aggiunge
  dipendenze all'App di Home Assistant.

```js
// Nel browser
LIFormat.fromMarkup('Ciao **mondo**')        // "Ciao 𝗺𝗼𝗻𝗱𝗼"
LIFormat.applyStyle('Testo', 'script')       // "𝒯ℯ𝓈𝓉ℴ"
LIFormat.toPlain('𝗺𝗼𝗻𝗱𝗼')                    // "mondo"
LIFormat.count(testo)                        // { codePoints, utf16, limit: 3000 }

// In Node
const LIFormat = require('./formatter.js');
```

Le due implementazioni producono lo stesso output: verificato su 208
combinazioni di testi e opzioni (markup, tutti gli stili, `--plain`, `--json`,
`--link`). Unica differenza nota: l'ordinamento A→Z/Z→A di righe che iniziano
con simboli, perché JS usa `localeCompare('it')`. Se cambi la logica in un
file, replica la modifica nell'altro.

## Cosa fa il sito originale (analisi)

| Risultato | Come lo so |
|---|---|
| È un'app Next.js (asset sotto `/_next/static/`) | *osservato* nell'HTML della pagina |
| La trasformazione avviene con simboli Unicode, non con rich text | *dichiarato* nelle FAQ della pagina |
| Offre 21 stili: Normal, Bold, Bold Sans, Italic, Italic Sans, Bold Italic, Bold Italic Sans, Sans, Underline, Strikethrough, Bold Underline, Bold Strikethrough, Script, Doublestruck, Fullwidth, Uppercase, Lowercase, Numbered List, Bullet Points, Checklist, Ascending/Descending List | *osservato* nella UI |
| Due modalità: stile su tutto il testo, oppure formattazione di parti selezionate | *dichiarato* nella pagina |
| Nessuna chiamata a server per formattare | *dedotto*: il bundle JS non è stato scaricato |
| "Ascending/Descending List" = ordinare le righe | *dedotto* dalla voce "Sorting List" nelle FAQ |

Limite: il container non raggiunge `typegrow.com`, quindi il bundle JS non è
stato letto. Il comportamento è ricostruito dalla pagina e dagli standard
Unicode; il codice non deriva dal loro.

## Differenze rispetto a Typegrow

- **Markup** (`**grassetto**`, `*corsivo*`, `++sottolineato++`, `~~barrato~~`,
  `` `mono` ``, `# titolo`, `- elenco`, `- [ ]`, `> citazione`, `---`): è il
  formato naturale di un LLM, quindi Hermes scrive markup e lo script converte.
- **URL, #hashtag e @menzioni protetti**: restano in testo normale anche dentro
  un grassetto o uno stile intero, altrimenti smettono di essere cliccabili.
- **Accenti italiani**: à è é ì ò ù non hanno una forma "matematica"; la lettera
  base viene trasformata e l'accento resta come diacritico combinante (NFD).
- **Monospazio** in più; "Grassetto sottolineato/barrato" usano il bold sans.
- **Conteggio a doppio valore** (es. `179–252 / 3000`): ogni lettera Unicode
  vale 1 code point ma 2 unità UTF-16; LinkedIn non documenta quale conti,
  quindi l'avviso scatta sul valore più alto.
- **Togli formattazione**: riporta a testo semplice un post già formattato.

## Deploy della PWA

Serve HTTPS: senza contesto sicuro non funzionano né il service worker né la
copia negli appunti con un tap. Due strade semplici:

1. **Home Assistant**: copia `pwa/` in `/config/www/li-formatter/` e apri
   `https://<tuo-ha>/local/li-formatter/`. Funziona via Nabu Casa o il tuo
   reverse proxy; `/local/` è pubblico, ma l'app non contiene dati.
2. **Hosting statico** (es. un sottodominio di smzstudio.it).

Dopo una modifica ai file, incrementa `VERSION` in `sw.js`, altrimenti i client
installati continuano a usare la versione in cache.

Precompilazione: `…/#text=<markup codificato>`. Il testo dopo `#` non arriva al
server. Su Android, la PWA installata compare anche nel menu Condividi
(`share_target`): condividi un testo da qualsiasi app e si apre già compilata.

## Installazione della skill Hermes

Serve solo Python 3.8+, già presente con Hermes. La skill usa lo strumento
`terminal` di Hermes (`requires_toolsets: [terminal]`), che deve essere attivo.

```bash
# dalla root del repo (nell'App HA: la cartella skills montata nel container)
mkdir -p ~/.hermes/skills/linkedin-formatter
cp -r skills/linkedin-formatter/SKILL.md skills/linkedin-formatter/scripts ~/.hermes/skills/linkedin-formatter/
# Claude Code: stessa cosa, ma in ~/.claude/skills/linkedin-formatter/
# opzionale, per i link all'anteprima:
export LINKEDIN_FORMATTER_URL="https://<tuo-ha>/local/li-formatter/"
```

Prova manuale:

```bash
printf '# Titolo\nUna riga con **grassetto** e #hashtag\n' | \
  python3 ~/.hermes/skills/linkedin-formatter/scripts/linkedin_format.py --json
```
