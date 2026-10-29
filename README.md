<div align="center">

<img src="assets/banner.svg" alt="my-skills: insegna un mestiere nuovo al tuo agente AI" width="100%">

# 🛠️ my-skills

**Skill, prompt e guide pronte all'uso per agenti AI.**
Copia una cartella, e il tuo agente impara un mestiere nuovo.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-D97757?logo=anthropic&logoColor=white)](#claude-code)
[![Hermes Agent](https://img.shields.io/badge/Hermes%20Agent-compatible-6E56CF)](#hermes-agent)
[![Python](https://img.shields.io/badge/Python-stdlib%20only-3776AB?logo=python&logoColor=white)](skills/linkedin-formatter/scripts/linkedin_format.py)

[Catalogo](#-catalogo) · [Installazione](#-installazione) · [Struttura](#-struttura) · [Contribuire](#-contribuire)

</div>

---

## ✨ Perché questo repo

Gli agenti AI (Claude Code, Hermes, Cursor, Copilot, Codex, Gemini CLI…) diventano davvero utili quando sanno **come** fai le cose tu. Questo repository raccoglie istruzioni testate su casi reali, scritte in italiano e pensate per essere riusate:

- 🧩 **Skill**: cartelle con un `SKILL.md` e, se serve, script deterministici che l'agente esegue al posto di "improvvisare".
- 💬 **Prompt**: istruzioni da incollare in chat o da usare come custom agent.
- 📊 **Guide comparative**: pagine HTML per scegliere strumenti e framework.

Niente dipendenze esotiche: dove c'è codice, usa solo la libreria standard.

## 📚 Catalogo

### 🧩 Skill

| Skill | Cosa fa | Agenti |
|---|---|---|
| [**linkedin-formatter**](skills/linkedin-formatter/) | Formatta i post LinkedIn con grassetto, corsivo, sottolineato, barrato ed elenchi tramite caratteri Unicode. Include una CLI Python (solo stdlib). | Hermes, Claude Code |
| [**llm-wiki-ingest**](skills/llm-wiki.md) | Gestisce un Second Brain secondo il pattern LLM-Wiki di Karpathy: ingestione di note e TO-DO, query sulla wiki, archiviazione e rotazione dei log. | Hermes (Telegram) |

### 💬 Prompt

| Prompt | Categoria | Cosa fa |
|---|---|---|
| [AWS Architect](prompts/ai-agent/aws-architect.md) | `ai-agent` | Un Senior AWS Solutions Architect che guida la progettazione di architetture: servizi, pattern, resilienza, sicurezza, costi. |
| [Preparazione 1:1](prompts/personal-productivity/1to1.md) | `personal-productivity` | Trasforma appunti sparsi in un'agenda in 4 fasi per il 1:1 con il tuo manager. |
| [Zero-Trust Security Audit](prompts/security/prompt-zerotrusty-security-github-copilot.md) | `security` | Audit di sicurezza con analisi statica avanzata, pensato per GitHub Copilot. |

### 📊 Guide comparative

| Guida | Contenuto |
|---|---|
| [Quale LLM usare](comparative/quale-llm-usare.html) | Guida completa ai modelli LLM (aprile 2026). |
| [Framework SDD](comparative/sdd-framework.html) | Spec Kit vs Superpowers vs OpenSpec vs B-MAD a confronto. |
| [Framework SDD — slide](comparative/sdd-framework-slide.html) | La stessa analisi in formato presentazione. |

> 💡 Le pagine HTML si aprono direttamente nel browser: scarica il file e fai doppio clic.

## 🚀 Installazione

```bash
git clone https://github.com/savez/my-skills.git
cd my-skills
```

### Claude Code

Le skill personali vivono in `~/.claude/skills/<nome>/SKILL.md`:

```bash
# skill a cartella (con eventuali script)
mkdir -p ~/.claude/skills/linkedin-formatter
cp -r skills/linkedin-formatter/SKILL.md skills/linkedin-formatter/scripts ~/.claude/skills/linkedin-formatter/

# skill a file singolo
mkdir -p ~/.claude/skills/llm-wiki-ingest
cp skills/llm-wiki.md ~/.claude/skills/llm-wiki-ingest/SKILL.md
```

Per usarla in un solo progetto, copia nella cartella `.claude/skills/` del progetto invece che nella home.

### Hermes Agent

```bash
mkdir -p ~/.hermes/skills/linkedin-formatter
cp -r skills/linkedin-formatter/SKILL.md skills/linkedin-formatter/scripts ~/.hermes/skills/linkedin-formatter/
```

### Chat e interfacce web (Claude.ai, ChatGPT, …)

Carica il `SKILL.md` o il file del prompt come **Knowledge File** del progetto, oppure incollalo come istruzione personalizzata.

### Esempio: linkedin-formatter in 10 secondi

```bash
printf '# Novità\nOggi parlo di **Unicode** e *formattazione* #linkedin\n- punto uno\n' \
  | python3 skills/linkedin-formatter/scripts/linkedin_format.py
```

```
𝗡𝗼𝘃𝗶𝘁𝗮̀
Oggi parlo di 𝗨𝗻𝗶𝗰𝗼𝗱𝗲 e 𝘧𝘰𝘳𝘮𝘢𝘵𝘵𝘢𝘻𝘪𝘰𝘯𝘦 #linkedin
• punto uno
```

## 🗂️ Struttura

```
my-skills/
├── skills/                      # skill per agenti
│   ├── linkedin-formatter/      #   SKILL.md + scripts/
│   └── llm-wiki.md              #   skill a file singolo
├── prompts/                     # prompt per categoria
│   ├── ai-agent/
│   ├── personal-productivity/
│   └── security/
├── comparative/                 # guide comparative in HTML
├── .github/                     # CONTRIBUTING, template di issue e PR
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

## 🤝 Contribuire

Nuove skill, prompt migliori, correzioni: tutto è benvenuto.

1. Leggi la [guida per contribuire](.github/CONTRIBUTING.md).
2. Apri una [issue](https://github.com/savez/my-skills/issues/new/choose) per proporre un'idea o segnalare un problema.
3. Manda una Pull Request da un branch `feature/<descrizione-breve>`.

Partecipando accetti il [Codice di condotta](CODE_OF_CONDUCT.md). Per le vulnerabilità vedi [SECURITY.md](SECURITY.md).

## 📄 Licenza

Distribuito con licenza [MIT](LICENSE): usa, modifica e condividi liberamente.

---

<div align="center">

Fatto con ☕ da [@savez](https://github.com/savez) · Se ti è utile, lascia una ⭐

</div>
