// Dati di roadmap-viewer. Schema: reference/schema.md della skill roadmap-viewer.
window.ROADMAP_DATA = {
  "schemaVersion": 1,
  "meta": {
    "title": "Priority Planner",
    "subtitle": "roadmap delle fasi · v0.2.1",
    "language": "it",
    "updated": "2026-11-24 12:00",
    "sources": [
      "docs/piano-priority-planner.md",
      "docs/revisione-piano-priority-planner.html",
      "src/",
      "versioni.txt"
    ]
  },
  "structure": {
    "nodes": [
      {
        "id": "att",
        "x": 30,
        "y": 40,
        "w": 300,
        "icon": "📝",
        "title": "Attività",
        "lines": [
          "area · 5 costi 0–3",
          "durata, scadenza, orario fisso",
          "giorno preferito, modelli salvati"
        ],
        "status": "warning",
        "task": "T2"
      },
      {
        "id": "ritmo",
        "x": 30,
        "y": 230,
        "w": 300,
        "icon": "🖌️",
        "title": "Il mio ritmo",
        "lines": [
          "livello 0–3 per fascia e batteria",
          "totale del giorno = 40%",
          "ritmi salvati con nome"
        ],
        "status": "project",
        "task": "T3"
      },
      {
        "id": "feste",
        "x": 30,
        "y": 420,
        "w": 300,
        "icon": "🎉",
        "title": "Fasce, feste e ferie",
        "lines": [
          "feriale 13 fasce · festivo 9",
          "0–3:30 solo prima di un festivo",
          "elenco date «Feste e ferie»"
        ],
        "status": "project",
        "task": "T3"
      },
      {
        "id": "check",
        "x": 30,
        "y": 640,
        "w": 300,
        "icon": "😣",
        "title": "Check-in e Giorno no",
        "lines": [
          "🙂 nessun cambio · 😐 −1 🧠❤️‍🩹",
          "😣 livelli di oggi −1"
        ],
        "status": "project",
        "task": "T5"
      },
      {
        "id": "dati",
        "x": 470,
        "y": 240,
        "w": 300,
        "icon": "💾",
        "title": "Dati sul dispositivo",
        "lines": [
          "file JSON locale, offline",
          "attività, ritmi, feste, impostazioni"
        ],
        "status": "warning",
        "task": "T2"
      },
      {
        "id": "piano",
        "x": 470,
        "y": 440,
        "w": 320,
        "icon": "⚙️",
        "title": "Pianificatore «Proponi settimana»",
        "lines": [
          "modulo TypeScript con test",
          "orari fissi → scadenza → costo",
          "fasce consecutive, cuscinetto",
          "«Non ci sta» con motivo"
        ],
        "status": "project",
        "task": "T4"
      },
      {
        "id": "io",
        "x": 470,
        "y": 40,
        "w": 300,
        "icon": "🔄",
        "title": "Importa / Esporta",
        "lines": [
          ".json con data e dispositivo",
          "sostituisce tutto, dopo una copia"
        ],
        "status": "project",
        "task": "T6"
      },
      {
        "id": "sett",
        "x": 920,
        "y": 40,
        "w": 300,
        "icon": "🗓️",
        "title": "Settimana",
        "lines": [
          "7 giorni × fasce",
          "carte proposte / bloccate 🔒",
          "«Da pianificare», «Non ci sta»"
        ],
        "status": "project",
        "task": "T4"
      },
      {
        "id": "oggi",
        "x": 920,
        "y": 230,
        "w": 300,
        "icon": "☀️",
        "title": "Oggi",
        "lines": [
          "solo «Adesso» e «Dopo»"
        ],
        "status": "project",
        "task": "T5"
      },
      {
        "id": "tutte",
        "x": 920,
        "y": 380,
        "w": 300,
        "icon": "📋",
        "title": "Tutte le attività",
        "lines": [
          "stato, scadenza, ricerca",
          "filtro Tutte · 💼 · 🏡"
        ],
        "status": "warning",
        "task": "T2"
      },
      {
        "id": "base",
        "x": 920,
        "y": 550,
        "w": 300,
        "icon": "🎨",
        "title": "Base pronta (Fase 0)",
        "lines": [
          "4 stili, chiaro/scuro",
          "APK tablet + installer Windows firmato",
          "aggiornamento automatico da GitHub"
        ],
        "status": "done",
        "task": "T1"
      }
    ],
    "links": [
      {
        "id": "l1",
        "from": "att",
        "to": "dati",
        "label": "salva",
        "status": "warning",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l2",
        "from": "ritmo",
        "to": "dati",
        "label": "salva",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l3",
        "from": "feste",
        "to": "ritmo",
        "label": "quali fasce ogni giorno",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l4",
        "from": "dati",
        "to": "piano",
        "label": "attività + ritmo",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l5",
        "from": "check",
        "to": "piano",
        "label": "ricalcola da oggi",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l6",
        "from": "piano",
        "to": "sett",
        "label": "proposta",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l7",
        "from": "sett",
        "to": "oggi",
        "label": "oggi",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l8",
        "from": "dati",
        "to": "tutte",
        "label": "elenco",
        "status": "warning",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      },
      {
        "id": "l9",
        "from": "dati",
        "to": "io",
        "label": "backup / sync",
        "status": "project",
        "dashed": false,
        "curve": 0,
        "labelPos": 0.5
      }
    ]
  },
  "map": {
    "centerTitle": "Priority Planner",
    "centerSubtitle": "Adesso: Fase 1"
  },
  "tasks": [
    {
      "id": "T1",
      "icon": "🎨",
      "title": "Fase 0 · base, build e stili",
      "status": "done",
      "summary": "Progetto Tauri 2 + Svelte + TypeScript con 4 stili, build per tablet e Windows e aggiornamento automatico.",
      "facts": [
        "v0.2.1",
        "4 stili × chiaro/scuro",
        "~1170 righe in src/"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Progetto e versioni",
          "status": "done",
          "does": [
            "Tauri 2 + Svelte + TS, versioni.txt."
          ],
          "expected": "L'app vuota si avvia.",
          "risks": "",
          "note": ""
        },
        {
          "name": "4 stili + finestra «Stile»",
          "status": "done",
          "does": [
            "Liquid glass, Neumorfismo, Skeuomorfismo, Claymorphism."
          ],
          "expected": "Applica / Annulla cambiano l'aspetto, non i colori delle batterie.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Settimana vuota con le fasce",
          "status": "done",
          "does": [
            "src/lib/fasce.ts con fasce feriali e festive."
          ],
          "expected": "Sabato con 0–3:30, domenica senza.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Build APK e installer firmato",
          "status": "done",
          "does": [
            "build-android-alt.ps1, build-windows.ps1."
          ],
          "expected": "apk/PriorityPlanner_X.Y.Z.apk e installer firmato.",
          "risks": "Installer autofirmato: sui PC nuovi va importato PriorityPlanner-certificato.cer.",
          "note": "APK non ancora provato sul tablet?"
        },
        {
          "name": "Aggiornamento automatico + release",
          "status": "done",
          "does": [
            "All'avvio controlla la release su GitHub; release.ps1 pubblica installer, APK e latest.json."
          ],
          "expected": "Provato da v0.2.0 a v0.2.1 su Windows: compare «Aggiorna a v0.2.1», un clic scarica, installa e riavvia. Android (apre il download dell'APK) non ancora provato.",
          "risks": "La chiave dell'updater sta fuori dalla repo: se si perde, le versioni installate non si aggiornano più.",
          "note": ""
        }
      ]
    },
    {
      "id": "T2",
      "icon": "📝",
      "title": "Fase 1 · attività e filtro",
      "status": "warning",
      "summary": "Modello dati, salvataggio su file, «Nuova attività» e «Tutte le attività» con il filtro.",
      "facts": [
        "~1,5 h",
        "A1 A2 C1 C3"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Modello dati",
          "status": "project",
          "does": [
            "Tipi Attività, Area, Costi, Vincoli."
          ],
          "expected": "Esempio: «Cena con Giulia» = 🧡 Amici, 💬3 🎧2 ❤️‍🩹1, 2 h, gio.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Salvataggio JSON sul dispositivo",
          "status": "project",
          "does": [
            "Leggi/scrivi un file nella cartella dati dell'app."
          ],
          "expected": "Chiudi e riapri l'app: le attività ci sono ancora.",
          "risks": "Permessi del file system su Android.",
          "note": ""
        },
        {
          "name": "«Nuova attività»",
          "status": "project",
          "does": [
            "Titolo, area, durata, 5 cursori con icone, modelli salvati."
          ],
          "expected": "Esempio: modello «Telefonata medico» compila 🩺 Salute, 15 min, ❤️‍🩹1.",
          "risks": "",
          "note": ""
        },
        {
          "name": "«Tutte le attività» + filtro",
          "status": "project",
          "does": [
            "Elenco con stato, scadenza, ricerca; Tutte · 💼 · 🏡 (solo visivo: le nascoste occupano la fascia, segno grigio)."
          ],
          "expected": "Esempio: 🏡 nasconde «Report Q4» e mostra «Spesa grande».",
          "risks": "",
          "note": ""
        },
        {
          "name": "Prova sul tablet",
          "status": "waiting",
          "does": [
            "APK nuovo installato sul tablet."
          ],
          "expected": "Si crea un'attività in ~10 secondi col dito.",
          "risks": "",
          "note": ""
        }
      ]
    },
    {
      "id": "T3",
      "icon": "🖌️",
      "title": "Fase 2 · Il mio ritmo",
      "status": "project",
      "summary": "Griglia da colorare col pennello, feste e ferie, più ritmi salvati.",
      "facts": [
        "~1,5 h",
        "B1 B2 B3 B6"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Griglia ritmo + pennello",
          "status": "project",
          "does": [
            "Scegli una batteria, tocca le caselle per il livello 0–3."
          ],
          "expected": "Esempio: 🧠 alta 9–12 il lunedì, bassa dopo le 18.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Totale del giorno",
          "status": "project",
          "does": [
            "40% della somma delle fasce, modificabile."
          ],
          "expected": "Esempio: 13 fasce a livello 2 → totale 🧠 ≈ 10.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Feste e ferie",
          "status": "project",
          "does": [
            "Elenco di date o intervalli, con nome."
          ],
          "expected": "Esempio: 22–26 dic «Ferie» → fasce festive.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Ritmi salvati",
          "status": "project",
          "does": [
            "«Normale», «Settimana pesante»; uno per settimana; un ritmo nuovo parte da una copia."
          ],
          "expected": "Cambi ritmo e la settimana cambia energia.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Fasce modificabili",
          "status": "project",
          "does": [
            "Impostazioni dei due modelli feriale/festivo."
          ],
          "expected": "Le tue fasce restano le predefinite.",
          "risks": "",
          "note": ""
        }
      ]
    },
    {
      "id": "T4",
      "icon": "⚙️",
      "title": "Fase 3 · Settimana e «Proponi settimana»",
      "status": "project",
      "summary": "Il cuore dell'app: vista Settimana e pianificatore con test.",
      "facts": [
        "~3 h",
        "A3 B4 B7 B8",
        "parte delicata"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Pianificatore con test",
          "status": "project",
          "does": [
            "Orari fissi → scadenza → costo; livello, totale, tempo; max 1 pesante ❤️‍🩹/💬 al giorno (modificabile); tra le fasce valide vince quella con più energia libera, con preferenza al giorno preferito e alternanza delle aree."
          ],
          "expected": "Stessi dati = stessa proposta, provato dai test.",
          "risks": "Regole che si contraddicono: servono casi di test reali.",
          "note": ""
        },
        {
          "name": "Attività lunghe",
          "status": "project",
          "does": [
            "Fasce consecutive, la pausa interrompe; livello sufficiente in ogni fascia; costo contato una volta nel totale; più attività brevi nella stessa fascia."
          ],
          "expected": "Esempio: «Report Q4» 2 h → lun 9–10 + «↳» 10–11.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Cuscinetto",
          "status": "project",
          "does": [
            "15 min liberi dopo un costo 3."
          ],
          "expected": "Esempio: dopo «Medico» (❤️‍🩹3) la fascia dopo parte 15 min più tardi.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Vista Settimana",
          "status": "project",
          "does": [
            "Carte tratteggiate, blocco 🔒, «perché qui», «Non ci sta»."
          ],
          "expected": "Esempio: «Palestra» in «Non ci sta»: «gio–ven: 💪 finita».",
          "risks": "",
          "note": ""
        },
        {
          "name": "Fine settimana",
          "status": "project",
          "does": [
            "Non fatte e «Non ci sta» tornano in «Da pianificare»; l'app non cancella mai niente da sola."
          ],
          "expected": "Contatore neutro, senza rosso.",
          "risks": "",
          "note": ""
        }
      ]
    },
    {
      "id": "T5",
      "icon": "☀️",
      "title": "Fase 4 · Oggi, check-in, Giorno no",
      "status": "project",
      "summary": "La vista del giorno e i modi rapidi per dire come stai.",
      "facts": [
        "~1 h",
        "B5 C1"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Vista Oggi",
          "status": "project",
          "does": [
            "Solo «Adesso» e «Dopo», in grande."
          ],
          "expected": "Esempio: Adesso «Bollette» · Dopo «Chiamare mamma».",
          "risks": "",
          "note": ""
        },
        {
          "name": "Check-in del mattino",
          "status": "project",
          "does": [
            "3 faccine."
          ],
          "expected": "😐 → −1 su 🧠 e ❤️‍🩹 per oggi.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Giorno no",
          "status": "project",
          "does": [
            "Livelli di oggi −1, attività di oggi sbloccate (non quelle a orario fisso), ricalcolo fino a domenica; i giorni passati restano."
          ],
          "expected": "Le attività spostate hanno il bordo giallo; gli orari fissi restano.",
          "risks": "",
          "note": ""
        }
      ]
    },
    {
      "id": "T6",
      "icon": "🔄",
      "title": "Fase 5 · Importa / Esporta",
      "status": "project",
      "summary": "Sincronizzazione manuale tra tablet e telefono.",
      "facts": [
        "~1 h",
        "D4"
      ],
      "doc": "docs/piano-priority-planner.md",
      "steps": [
        {
          "name": "Esporta",
          "status": "project",
          "does": [
            "File .json con dati, data e dispositivo."
          ],
          "expected": "Esempio: priority-planner_2026-11-20_tablet.json.",
          "risks": "",
          "note": ""
        },
        {
          "name": "Importa",
          "status": "project",
          "does": [
            "Mostra le due date, chiede conferma, copia di sicurezza, sostituisce."
          ],
          "expected": "Sul telefono vedi la stessa settimana del tablet.",
          "risks": "Importare un file vecchio sovrascrive dati più nuovi: per questo la conferma con le date.",
          "note": ""
        },
        {
          "name": "Prova tablet ↔ telefono",
          "status": "waiting",
          "does": [
            "Esporta dal tablet, importa sul telefono."
          ],
          "expected": "Stesse attività e stesso ritmo.",
          "risks": "",
          "note": ""
        }
      ]
    }
  ],
  "kanban": {
    "columns": [
      {
        "id": "todo",
        "title": "Da fare"
      },
      {
        "id": "doing",
        "title": "In corso"
      },
      {
        "id": "test",
        "title": "Da provare sul tablet"
      },
      {
        "id": "done",
        "title": "Fatto",
        "final": true
      }
    ],
    "cards": [
      {
        "id": "c1",
        "title": "Base, stili e build",
        "description": "",
        "column": "done",
        "assignee": "agente",
        "task": "T1",
        "status": "done",
        "unblocks": ""
      },
      {
        "id": "c2",
        "title": "Firma dell'installer Windows",
        "description": "",
        "column": "done",
        "assignee": "agente",
        "task": "T1",
        "status": "done",
        "unblocks": ""
      },
      {
        "id": "c3",
        "title": "Installare l'APK 0.2.1 sul tablet",
        "description": "Controllare stili e fasce sullo schermo vero. Dalla 0.2.0 l'app avvisa da sola delle versioni nuove.",
        "column": "test",
        "assignee": "bene",
        "task": "T1",
        "status": "waiting",
        "unblocks": ""
      },
      {
        "id": "c4",
        "title": "Modello dati + salvataggio JSON",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T2",
        "status": "warning",
        "unblocks": "T2, T3, T4"
      },
      {
        "id": "c5",
        "title": "Nuova attività + modelli",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T2",
        "status": "warning",
        "unblocks": ""
      },
      {
        "id": "c6",
        "title": "Tutte le attività + filtro",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T2",
        "status": "warning",
        "unblocks": ""
      },
      {
        "id": "c7",
        "title": "Il mio ritmo: pennello e totale",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T3",
        "status": "project",
        "unblocks": "T4"
      },
      {
        "id": "c8",
        "title": "Feste e ferie + ritmi salvati",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T3",
        "status": "project",
        "unblocks": ""
      },
      {
        "id": "c9",
        "title": "Pianificatore con test",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T4",
        "status": "project",
        "unblocks": "T5"
      },
      {
        "id": "c10",
        "title": "Vista Settimana",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T4",
        "status": "project",
        "unblocks": ""
      },
      {
        "id": "c11",
        "title": "Vista Oggi + check-in + Giorno no",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T5",
        "status": "project",
        "unblocks": ""
      },
      {
        "id": "c12",
        "title": "Importa / Esporta",
        "description": "",
        "column": "todo",
        "assignee": "agente",
        "task": "T6",
        "status": "project",
        "unblocks": ""
      },
      {
        "id": "c13",
        "title": "Prova sync tablet ↔ telefono",
        "description": "",
        "column": "todo",
        "assignee": "bene",
        "task": "T6",
        "status": "project",
        "unblocks": ""
      },
      {
        "id": "c14",
        "title": "Aggiornamento automatico da GitHub",
        "description": "",
        "column": "done",
        "assignee": "agente",
        "task": "T1",
        "status": "done",
        "unblocks": ""
      }
    ]
  },
  "people": [
    {
      "id": "bene",
      "name": "Benedetta",
      "role": "Decide, prova sul tablet",
      "icon": "🙋‍♀️",
      "color": ""
    },
    {
      "id": "agente",
      "name": "Agente",
      "role": "Sviluppo e build",
      "icon": "🤖",
      "color": ""
    }
  ],
  "decisions": [
    {
      "id": "d1",
      "datetime": "2026-11-08",
      "task": "T2",
      "text": "A1 · Tre concetti separati: area, 5 batterie con costo 0–3, vincoli di tempo.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d2",
      "datetime": "2026-11-08",
      "task": "T2",
      "text": "A2 · Batterie 🧠 ❤️‍🩹 💬 🎧 💪, rinominabili.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d3",
      "datetime": "2026-11-08",
      "task": "T4",
      "text": "A3 · Cuscinetto di 15 min dopo un costo 3 (0/15/30).",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d4",
      "datetime": "2026-11-09",
      "task": "T3",
      "text": "B1 · Fasce configurabili: feriale 13, festivo 9; 0–3:30 solo prima di un festivo.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d5",
      "datetime": "2026-11-09",
      "task": "T3",
      "text": "B2 · 7 giorni; feste e ferie segnabili, nessuna precaricata.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d6",
      "datetime": "2026-11-08",
      "task": "T3",
      "text": "B3 · Livello per fascia + totale del giorno al 40%, modificabile.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d7",
      "datetime": "2026-11-08",
      "task": "T4",
      "text": "B4 · Regole del bottone: fissi, scadenza, costo, max 1 pesante ❤️‍🩹/💬, «Non ci sta» con motivo; risultato deterministico.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d8",
      "datetime": "2026-11-08",
      "task": "T5",
      "text": "B5 · Giorno no (−1) e check-in con 3 faccine.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d9",
      "datetime": "2026-11-08",
      "task": "T3",
      "text": "B6 · Più ritmi salvati con nome.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d10",
      "datetime": "2026-11-08",
      "task": "T4",
      "text": "B7 · Attività lunghe su fasce consecutive.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d11",
      "datetime": "2026-11-08",
      "task": "T4",
      "text": "B8 · Le non fatte passano alla settimana dopo.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d12",
      "datetime": "2026-11-08",
      "task": "T2",
      "text": "C1 · 6 schermate, con «Tutte le attività».",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d13",
      "datetime": "2026-11-08",
      "task": "T1",
      "text": "C2 · Solo icone, niente rosso da fallimento.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d14",
      "datetime": "2026-11-08",
      "task": "T2",
      "text": "C3 · Filtro Tutte · 💼 · 🏡, solo visivo.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d15",
      "datetime": "2026-11-08",
      "task": "T1",
      "text": "D1 · Tauri 2 + Svelte + TS, dati JSON locali.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d16",
      "datetime": "2026-11-08",
      "task": "T1",
      "text": "D2 · Obiettivo tablet Android, Windows insieme.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d17",
      "datetime": "2026-11-08",
      "task": "",
      "text": "D3 · Niente calendari esterni per ora.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d18",
      "datetime": "2026-11-08",
      "task": "T6",
      "text": "D4 · Importa / Esporta con sostituzione e copia di sicurezza.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d19",
      "datetime": "2026-11-09",
      "task": "T1",
      "text": "D5 · 4 stili, Liquid glass di partenza.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d20",
      "datetime": "2026-11-08",
      "task": "",
      "text": "E1 · 6 fasi, ognuna finisce con un APK provato.",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d21",
      "datetime": "2026-11-14",
      "task": "T1",
      "text": "Installer Windows firmato con certificato autofirmato (opzione A).",
      "status": "done",
      "author": "Benedetta"
    },
    {
      "id": "d22",
      "datetime": "2026-11-17",
      "task": "T1",
      "text": "Aggiornamenti dalle release della repo pubblica GitHub, senza passare dal percorso locale; chiave dell'updater solo sul PC di build.",
      "status": "done",
      "author": "Benedetta"
    }
  ],
  "lessons": [
    {
      "id": "L1",
      "text": "La «&» di Skills&Plugins rompe i file .cmd: avviare Tauri e Gradle con node/java direttamente."
    },
    {
      "id": "L2",
      "text": "Tauri non trova signtool da solo: passare il percorso completo con signCommand."
    },
    {
      "id": "L3",
      "text": "Il pacchetto debug riscrive l'APK sul posto: cancellarlo prima evita APK gonfiati."
    },
    {
      "id": "L4",
      "text": "latest.json e le note della release vanno scritti in UTF-8 senza BOM: Set-Content -Encoding utf8 di PowerShell 5 aggiunge il BOM."
    }
  ],
  "changelog": []
};
