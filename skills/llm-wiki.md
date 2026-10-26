---
name: llm-wiki-ingest
description: Gestisce la Wiki / Second Brain dell'utente (Pattern LLM-Wiki). Elabora messaggi per aggiornare note e TO-DO (Ingestion), risponde a domande (Query) e mantiene il sistema scalabile con archiviazione e rotazione dei log.
version: 2.1.0
metadata:
  hermes:
    tags: [productivity, pkm, second-brain, telegram, wiki]
    config:
      - key: wiki.vault_path
        description: "Percorso assoluto della cartella Vault/Wiki locale (es. ~/second-brain)"
        default: "~/second-brain"
        prompt: "Inserisci il percorso assoluto della tua cartella Wiki locale"
---

# LLM Wiki Ingest & Query (Hermes Agent - Telegram Edition)

Questa skill trasforma Hermes Agent nel gestore bidirezionale del tuo Second Brain, applicando fedelmente il pattern "LLM-Wiki" di Andrej Karpathy. 

**Filosofia (Stream vs State):**
- **Lo Stream (RAW):** Un log cronologico. Ogni singolo messaggio viene salvato qui. È un archivio freddo (Cold Storage), in sola scrittura per l'agente.
- **Lo State (La Wiki):** Pagine Markdown interconnesse. Questa è la conoscenza strutturata su cui l'agente esegue le query.

## Quando Usare
- **(Ingestion):** L'utente invia su Telegram messaggi grezzi, idee o link ad articoli.
- **(Query):** L'utente fa una domanda sul contenuto della sua Wiki (es. "Riassumi le note su X").

## Architettura del Second Brain
Organizza le informazioni attraverso 4 pilastri:
1. **`[[Progetto - X]]` (Specifiche & Architettura):** Requisiti tecnici e TO-DO di progetto.
2. **`[[Software & Tools]]` (Software & Librerie):** Nome tool, stack e note.
3. **`[[Risorse e Concetti]]` (Articoli & Snippet):** Sintesi di articoli e pattern.
4. **`[[TO-DO Globali]]` (Azioni & Task):** Elenco centralizzato delle azioni.

---

## 🟢 Fase 1: Ingestion (Scrittura & Manutenzione)

Quando l'utente invia un messaggio o chiede di registrare qualcosa:

1. **Salvataggio nello Stream (Rotazione Mensile):**
   - Appendi sempre l'input originale, non filtrato, al file `[[Stream RAW - YYYY-MM.md]]` (es. `Stream RAW - 2026-10.md`), inserendo un timestamp. Questo file è "write-only". Usa file mensili per evitare che il file diventi ingestibile.
2. **Analisi e Parsing per lo State:**
   - Estrai Task, Nuovi Software, Specifiche, Risorse.
3. **Gestione Aggiornamenti:**
   - Se la pagina esiste: Aggiungi i nuovi dati (es. `### Aggiornamento [Data]`).
   - Se NON esiste: Crea la nuova pagina partendo dai template.
4. **Indici e Riferimenti Incrociati:**
   - Aggiorna `[[Index.md]]` inserendo i nuovi riferimenti semantici.

---

## 🔵 Fase 2: Query (Lettura ed Estrazione)

1. **Orientamento Iniziale:** 
   - Usa `read_file` per leggere **solo** `[[Index.md]]`. Questo fornisce la mappa della conoscenza.
2. **Ricerca Approfondita (Grep):**
   - Usa `search_files` o `grep` per trovare le parole chiave nei file markdown.
   - 🚨 **REGOLA CRITICA:** **ESCLUDI SEMPRE** i file `Stream RAW*` e la cartella `_archive/` dai risultati di ricerca.
3. **Lettura e Sintesi:**
   - Apri solo i 2-3 file specifici trovati, formula la sintesi e cita la fonte.
4. **Compound Knowledge (Archiviazione Query):**
   - Se la risposta richiede un confronto o una sintesi complessa, salvala come nuova pagina Wiki (es. `[[Confronto - A vs B.md]]`) e aggiorna l'Index.

---

## 🟠 Fase 3: Regole di Scalabilità (Auto-Manutenzione)

Per evitare che la Wiki diventi lenta o saturi il contesto dell'LLM:

1. **Paginazione dell'Indice:** Se `[[Index.md]]` supera le 150-200 righe, dividilo creando sottomappe (es. `[[Index - Progetti.md]]`, `[[Index - Software.md]]`) e lascia nel main file solo i link alle sottomappe.
2. **Archiviazione Attiva:** Quando un progetto viene contrassegnato come "Completato" o un software come "Deprecato", l'agente deve spostare fisicamente il file nella cartella `_archive/` e rimuoverlo dall'`Index.md` principale.

---

## Template Markdown per i File della Wiki

### Template: `[[Stream RAW - YYYY-MM]]`
```markdown
# 🌊 Stream RAW (Archivio Grezzo - {Mese Anno})

## 🕒 {Data e Ora}
{Testo originale o trascrizione vocale inviata dall'utente}
```

### Template: `[[Software - {NomeTool}]]`
```markdown
# 🛠️ Software: {NomeTool}

- **Categoria:** {Framework / Tool}
- **Ultimo aggiornamento:** {Data}

## 📌 Casi d'uso e Note
- {Descrizione}

## 🔗 Collegamenti
- [[Index]]
```

### Template: `[[Progetto - {NomeProgetto}]]`
```markdown
# 📐 Progetto: {NomeProgetto}

- **Stato:** {In Corso / Completato}
- **Ultimo aggiornamento:** {Data}

## 🏗️ Architettura & Specifiche
- {Specifiche}

## 🔗 Collegamenti
- [[Index]]
```

### Template: `[[Risorsa - {Titolo}]]`
```markdown
# 📚 Risorsa: {Titolo}

- **Data registrazione:** {Data}

## 💡 Concetti Chiave & Sintesi
- {Punti salienti distillati}

## 🔗 Collegamenti
- [[Index]]
```

### Template: `[[Index]]`
```markdown
# 🗂️ Indice Generale Wiki

## 📐 Progetti
*(Elenco link)*

## 🛠️ Software & Tools
*(Elenco link)*

## 📚 Risorse & Patterns
*(Elenco link)*
```