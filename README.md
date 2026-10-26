🛠️ My Skills & AI Agent Workflows

Benvenuto nel mio repository di Skill & Prompt personalizzati! Questa raccolta contiene la mia personal knowledge base, workflow e configurazioni riutilizzabili per agenti AI (Cursor, Claude Code, GitHub Copilot, Codex, ecc.).

📌 Cos'è questo repository?

Questo repository serve a:

Centralizzare i miei workflow: Una collezione di regole, custom instructions e file SKILL.md personalizzati per ottimizzare la collaborazione con agenti coding e assistenti AI.

Showcase e riuso delle competenze: Una mappa aggiornata e un catalogo di istruzioni riutilizzabili per automatizzare task ricorrenti nel processo di sviluppo.

⚙️ Come utilizzare queste Skill

🤖 Per Agentic AI (Claude Code, Cursor, Codex, Gemini CLI)

Puoi installare o collegare direttamente le skill usando la CLI di riferimento o tramite symlink:

# Esempio di clonazione e setup locale
git clone https://github.com/savez/my-skills.git
cd my-skills
./scripts/link-skills.sh # (oppure usa la CLI del tuo agente, es. gh skill / npx skills)


💬 Per Chat & Web Interfaces (ChatGPT, Claude.ai)

Puoi importare i file contenuti nella cartella skills/ direttamente come contesto o Knowledge Files all'interno dei tuoi progetti o workspace.

📂 Struttura del Repository

my-skills/
├── skills/               # Cartella contenente le singole definizioni delle skill (.md)
│   ├── refactoring/
│   └── code-review/
├── .cursor/              # Regole e prompt specifici per Cursor (opzionale)
├── scripts/              # Script utili di automazione o symlink
└── README.md             # Questo file


🤝 Contatti & Link

GitHub: @savez