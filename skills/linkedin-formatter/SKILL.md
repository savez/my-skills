---
name: linkedin-formatter
description: Formatta testo per post LinkedIn con grassetto, corsivo, sottolineato, barrato ed elenchi usando caratteri Unicode (LinkedIn non supporta il rich text). Usala ogni volta che scrivi, riscrivi o prepari un post o un commento LinkedIn, o quando l'utente chiede di "formattare per LinkedIn".
version: 1.0.0
requires_toolsets: [terminal]
metadata:
  hermes:
    tags: [linkedin, social, writing, formatting]
---

# LinkedIn formatter

LinkedIn accetta solo testo semplice. L'effetto grassetto/corsivo si ottiene
sostituendo le lettere con i caratteri Unicode "Mathematical Alphanumeric
Symbols", e sottolineato/barrato aggiungendo diacritici combinanti. Lo script
`scripts/linkedin_format.py` (solo libreria standard Python) fa la conversione
in modo deterministico, con lo stesso output dell'app di anteprima: non
riscrivere mai i caratteri a mano.

## Procedura

1. Scrivi il post in **markup** (sotto). Usa la formattazione con parsimonia:
   titolo/hook e 2-4 parole chiave, non frasi intere.
2. Converti con lo strumento terminale:
   ```bash
   python3 SKILL_DIR/scripts/linkedin_format.py --json <<'EOF'
   ...markup del post...
   EOF
   ```
   `SKILL_DIR` è la cartella che contiene questo file.
3. Consegna all'utente il campo `text` dentro un blocco di codice, così lo
   copia senza che la chat lo rielabori. Se `count.overLimit` è `true`, accorcia
   il post e riconverti (limite LinkedIn: 3000 caratteri).
4. Se è impostata la variabile `LINKEDIN_FORMATTER_URL`, aggiungi anche il link
   all'app di anteprima: `python3 SKILL_DIR/scripts/linkedin_format.py --link < post.md`.

## Markup

| Scrivi                 | Ottieni                     |
|------------------------|-----------------------------|
| `**testo**`, `__testo__` | grassetto                 |
| `*testo*`, `_testo_`   | corsivo                     |
| `***testo***`          | grassetto corsivo           |
| `++testo++`            | sottolineato                |
| `~~testo~~`            | barrato                     |
| `` `testo` ``          | monospazio                  |
| `# Titolo`             | riga intera in grassetto    |
| `- punto`              | `• punto`                   |
| `- [ ] da fare` / `- [x] fatto` | `⬜` / `✅`        |
| `> citazione`          | `▍` + corsivo               |
| `---`                  | riga divisoria `━━━━━━━━━━` |

Gli stili si possono annidare (`**grassetto con *corsivo***`). Il carattere `_`
dentro le parole (`nome_file`) non diventa corsivo.

## Regole importanti

- URL, `#hashtag` e `@menzioni` restano sempre in testo normale, anche dentro
  `**…**`: in Unicode smetterebbero di funzionare. Non provare a forzarli.
- Le menzioni vere (con notifica) non si creano col testo: vanno aggiunte a mano
  in LinkedIn. Dillo all'utente se il post ne prevede.
- Il testo formattato non è indicizzato dalla ricerca LinkedIn e i lettori di
  schermo lo leggono male: niente paragrafi interi in grassetto.
- Lettere accentate (à, è, é…) funzionano: la lettera viene trasformata e
  l'accento resta come diacritico combinante.
- Famiglia: default `sans` (si integra col font di LinkedIn); `--family serif`
  per grassetto/corsivo con grazie, solo se l'utente lo chiede.

## Altre opzioni

- `--style <id>`: uno stile su tutto il testo (`--list-styles` per l'elenco:
  bold, boldSans, italic, script, doubleStruck, fullwidth, numbered, bullets…).
- `--plain`: riporta un testo già formattato a testo semplice (es. per
  modificare un post vecchio).
