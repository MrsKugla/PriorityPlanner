/* roadmap-viewer — pagina locale, nessuna dipendenza esterna.
 * Dati: data.js (window.ROADMAP_DATA). Schema: ../reference/schema.md della skill.
 * Le modifiche fatte nel browser restano in memoria (più una bozza in localStorage)
 * finché non si preme "Salva": allora vengono scritte in data.js e registrate in changelog.
 */
(function () {
  "use strict";

  const STATI = ["critical", "warning", "waiting", "done", "project", "archived"];
  const COLORI = { critical: "#ef4444", warning: "#f59e0b", waiting: "#3b82f6", done: "#22c55e", project: "#a855f7", archived: "#64748b" };

  const T = {
    it: {
      structure: "🧭 Struttura progetto", map: "🎯 Mappa priorità", kanban: "🗂️ Kanban", assigned: "📋 Compiti assegnati",
      people: "👥 Operatori", decisions: "📜 Registro decisioni",
      edit: "Modifica", save: "💾 Salva", saveDirty: "💾 Salva *", download: "⬇ Scarica copia",
      updated: "aggiornato", sources: "fonti",
      st_critical: "Critico", st_warning: "Attenzione", st_waiting: "In attesa", st_done: "Fatto", st_project: "Progetto", st_archived: "Archiviato",
      structTitle: "Come sono collegati i moduli del progetto", structHintView: "Clic su un modulo collegato a un task per aprirlo nella Mappa priorità.",
      structHintEdit: "Trascina i moduli per spostarli. Clic su un modulo o su un'etichetta di collegamento per modificarli.",
      dashedNote: "Linea tratteggiata = collegamento dismesso.",
      addNode: "+ Modulo", addLink: "+ Collegamento", node: "Modulo", link: "Collegamento",
      mapTitle: "Mappa priorità — clic su un task", mapHint: "Clic su un task: compaiono i suoi passi numerati, spiegati nella tabella sotto. Clic sul centro per richiudere.",
      addTask: "+ Task", editTask: "✎ Modifica task", addStep: "+ Passo", showInKanban: "Visualizza nel kanban", noCards: "Nessuna card collegata nel kanban.",
      step: "#", stepCol: "Passo · cosa fa", statusCol: "Stato", expectedCol: "Risultato atteso", risksCol: "Rischi associati", noteCol: "Nota",
      kanbanTitle: "Kanban", addCard: "+ Card", addColumn: "+ Colonna", filterPeople: "Operatore", all: "tutti", unassigned: "non assegnati",
      dragHint: "Attiva \"Modifica\" per trascinare le card tra le colonne.", unblocks: "sblocca", column: "Colonna",
      assignedTitle: "Chi deve fare cosa (dalle card del kanban non ancora in una colonna finale)", nobody: "Non assegnati", nothing: "Nessun compito aperto.",
      completed: "completati", peopleTitle: "Operatori del progetto", addPerson: "+ Operatore", openTasks: "Compiti aperti",
      decisionsTitle: "Registro decisioni — dal più recente", addDecision: "+ Decisione", lessons: "Lezioni apprese", addLesson: "+ Lezione",
      pending: "Modifiche fatte nel browser da riportare nei documenti", pendingInfo: "Restano segnate finché un agente non le riporta nei documenti Markdown (vedi SKILL.md, \"Sincronizzazione\").",
      f_id: "ID (breve, univoco)", f_title: "Titolo", f_icon: "Icona (emoji)", f_status: "Stato / priorità", f_lines: "Righe di testo (una per riga)",
      f_task: "Task collegato", f_none: "— nessuno —", f_from: "Da", f_to: "A", f_label: "Etichetta", f_dashed: "Tratteggiato (collegamento dismesso)",
      f_curve: "Curvatura (0 = dritto, ±40 = curva)", f_labelPos: "Posizione etichetta (0-1)", f_summary: "Sintesi", f_facts: "Numeri chiave (uno per riga)",
      f_doc: "Documento di riferimento", f_name: "Nome", f_does: "Cosa fa (una frase per riga)", f_expected: "Risultato atteso", f_risks: "Rischi associati",
      f_note: "Nota", f_description: "Descrizione", f_column: "Colonna", f_assignee: "Operatore", f_unblocks: "Sblocca", f_final: "Colonna finale (compiti completati)",
      f_role: "Ruolo", f_datetime: "Data e ora (AAAA-MM-GG HH:MM)", f_text: "Testo", f_author: "Autore", f_color: "Colore (opzionale, es. #3b82f6)",
      f_centerTitle: "Titolo del centro", f_centerSubtitle: "Sottotitolo del centro",
      ok: "Conferma", cancel: "Annulla", del: "Elimina", required: "Campo obbligatorio", dupId: "ID già usato",
      confirmDel: "Eliminare \"{x}\"?", confirmDelCards: "{n} card sono assegnate: resteranno senza operatore. Continuare?",
      confirmColumn: "La colonna contiene {n} card: verranno spostate in \"{x}\". Continuare?", lastColumn: "Serve almeno una colonna.",
      saved: "Salvato in data.js", savedDownload: "Il browser non può scrivere direttamente: scaricato data.js. Sostituisci con questo il file nella cartella della pagina.",
      saveErr: "Salvataggio non riuscito: ", unsaved: "Ci sono modifiche non salvate.",
      draftFound: "Trovata una bozza non salvata del {x}, più recente di data.js.", restore: "Ripristina bozza", discard: "Scarta bozza",
      editMap: "✎ Centro mappa", empty: "Niente da mostrare.", moveUp: "↑", moveDown: "↓", moveLeft: "←", moveRight: "→",
      a_add: "aggiunto", a_edit: "modificato", a_del: "eliminato", a_move: "spostato"
    },
    en: {
      structure: "🧭 Project structure", map: "🎯 Priority map", kanban: "🗂️ Kanban", assigned: "📋 Assigned tasks",
      people: "👥 People", decisions: "📜 Decision log",
      edit: "Edit", save: "💾 Save", saveDirty: "💾 Save *", download: "⬇ Download copy",
      updated: "updated", sources: "sources",
      st_critical: "Critical", st_warning: "Warning", st_waiting: "Waiting", st_done: "Done", st_project: "Project", st_archived: "Archived",
      structTitle: "How the project modules are connected", structHintView: "Click a module linked to a task to open it in the Priority map.",
      structHintEdit: "Drag modules to move them. Click a module or a link label to edit it.",
      dashedNote: "Dashed line = retired connection.",
      addNode: "+ Module", addLink: "+ Link", node: "Module", link: "Link",
      mapTitle: "Priority map — click a task", mapHint: "Click a task to show its numbered steps, explained in the table below. Click the centre to close.",
      addTask: "+ Task", editTask: "✎ Edit task", addStep: "+ Step", showInKanban: "Show in kanban", noCards: "No linked kanban card.",
      step: "#", stepCol: "Step · what it does", statusCol: "Status", expectedCol: "Expected result", risksCol: "Associated risks", noteCol: "Note",
      kanbanTitle: "Kanban", addCard: "+ Card", addColumn: "+ Column", filterPeople: "Person", all: "all", unassigned: "unassigned",
      dragHint: "Turn on \"Edit\" to drag cards between columns.", unblocks: "unblocks", column: "Column",
      assignedTitle: "Who does what (kanban cards not yet in a final column)", nobody: "Unassigned", nothing: "No open tasks.",
      completed: "completed", peopleTitle: "Project people", addPerson: "+ Person", openTasks: "Open tasks",
      decisionsTitle: "Decision log — newest first", addDecision: "+ Decision", lessons: "Lessons learned", addLesson: "+ Lesson",
      pending: "Browser edits still to be copied into the documents", pendingInfo: "They stay flagged until an agent copies them into the Markdown documents (see SKILL.md, \"Synchronisation\").",
      f_id: "ID (short, unique)", f_title: "Title", f_icon: "Icon (emoji)", f_status: "Status / priority", f_lines: "Text lines (one per line)",
      f_task: "Linked task", f_none: "— none —", f_from: "From", f_to: "To", f_label: "Label", f_dashed: "Dashed (retired connection)",
      f_curve: "Curvature (0 = straight, ±40 = curved)", f_labelPos: "Label position (0-1)", f_summary: "Summary", f_facts: "Key figures (one per line)",
      f_doc: "Reference document", f_name: "Name", f_does: "What it does (one sentence per line)", f_expected: "Expected result", f_risks: "Associated risks",
      f_note: "Note", f_description: "Description", f_column: "Column", f_assignee: "Person", f_unblocks: "Unblocks", f_final: "Final column (completed tasks)",
      f_role: "Role", f_datetime: "Date and time (YYYY-MM-DD HH:MM)", f_text: "Text", f_author: "Author", f_color: "Colour (optional, e.g. #3b82f6)",
      f_centerTitle: "Centre title", f_centerSubtitle: "Centre subtitle",
      ok: "Confirm", cancel: "Cancel", del: "Delete", required: "Required field", dupId: "ID already used",
      confirmDel: "Delete \"{x}\"?", confirmDelCards: "{n} cards are assigned: they will become unassigned. Continue?",
      confirmColumn: "The column holds {n} cards: they will move to \"{x}\". Continue?", lastColumn: "At least one column is required.",
      saved: "Saved to data.js", savedDownload: "The browser cannot write directly: data.js was downloaded. Replace the file in the page folder with it.",
      saveErr: "Save failed: ", unsaved: "There are unsaved changes.",
      draftFound: "Found an unsaved draft from {x}, newer than data.js.", restore: "Restore draft", discard: "Discard draft",
      editMap: "✎ Map centre", empty: "Nothing to show.", moveUp: "↑", moveDown: "↓", moveLeft: "←", moveRight: "→",
      a_add: "added", a_edit: "edited", a_del: "deleted", a_move: "moved"
    }
  };

  const VISTE = ["struttura", "mappa", "kanban", "compiti", "operatori", "registro"];
  const NAV = { struttura: "structure", mappa: "map", kanban: "kanban", compiti: "assigned", operatori: "people", registro: "decisions" };
  const CHIAVE_BOZZA = "roadmap-viewer:" + location.pathname;

  let D = normalizza(window.ROADMAP_DATA || {});
  let lingua = D.meta.language === "en" ? "en" : "it";
  let modifica = false, sporco = false, vista = "struttura", taskAperto = null, filtroReg = "all", filtroOp = "all";
  let fileHandle = null;

  /* ---------- utilità ---------- */
  const $ = (s) => document.querySelector(s);
  const t = (k, v) => { let s = (T[lingua] && T[lingua][k]) || T.it[k] || k; if (v) for (const x in v) s = s.split("{" + x + "}").join(v[x]); return s; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const stato = (s) => (STATI.includes(s) ? s : "waiting");
  const colore = (s) => COLORI[stato(s)];
  const pill = (s) => `<span class="pill" style="--c:${colore(s)}">${esc(t("st_" + stato(s)))}</span>`;
  const pad = (n) => String(n).padStart(2, "0");
  const adesso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const trova = (lista, id) => lista.find((x) => x.id === id);
  const righe = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const legenda = (stati) => `<div class="legenda">${stati.map((s) => `<span><i style="--c:${colore(s)}"></i>${esc(t("st_" + s))}</span>`).join("")}</div>`;
  const persona = (id) => trova(D.people, id);
  const nomePersona = (id) => { const p = persona(id); return p ? `${p.icon || "👤"} ${p.name}` : ""; };

  function normalizza(d) {
    d = JSON.parse(JSON.stringify(d));
    d.schemaVersion = d.schemaVersion || 1;
    d.meta = Object.assign({ title: "Roadmap", subtitle: "", language: "it", updated: "", sources: [] }, d.meta || {});
    d.structure = Object.assign({ nodes: [], links: [] }, d.structure || {});
    d.map = Object.assign({ centerTitle: d.meta.title, centerSubtitle: "" }, d.map || {});
    d.tasks = d.tasks || [];
    d.tasks.forEach((x) => { x.steps = x.steps || []; x.facts = x.facts || []; });
    d.kanban = Object.assign({ columns: [], cards: [] }, d.kanban || {});
    if (!d.kanban.columns.length) d.kanban.columns = [{ id: "todo", title: "Da fare" }, { id: "doing", title: "In corso" }, { id: "blocked", title: "Bloccato" }, { id: "done", title: "Fatto", final: true }];
    d.people = d.people || [];
    d.decisions = d.decisions || [];
    d.lessons = d.lessons || [];
    d.changelog = d.changelog || [];
    return d;
  }

  /* ---------- modifiche, bozza, salvataggio ---------- */
  function cambia(azione, entita, id, sintesi) {
    D.changelog.push({ datetime: adesso(), action: azione, entity: entita, id: id, summary: sintesi, synced: false });
    D.meta.updated = adesso();
    sporco = true;
    try { localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ savedAt: adesso(), data: D })); } catch (e) { /* quota piena: la bozza è un aiuto, non un requisito */ }
    ridisegna();
  }

  function serializza() {
    return "// Dati di roadmap-viewer. Modificabile a mano, dalla pagina (Salva) o da un agente.\n" +
      "// Schema: reference/schema.md della skill roadmap-viewer.\n" +
      "window.ROADMAP_DATA = " + JSON.stringify(Object.assign(D, { meta: Object.assign(D.meta, { language: lingua }) }), null, 2) + ";\n";
  }

  function avviso(msg, err) {
    const el = $("#avviso");
    el.textContent = msg; el.className = "avviso" + (err ? " err" : ""); el.hidden = false;
    clearTimeout(avviso.timer); avviso.timer = setTimeout(() => { el.hidden = true; }, err ? 7000 : 4000);
  }

  function idb(op, valore) {
    return new Promise((res) => {
      if (!window.indexedDB) return res(null);
      const r = indexedDB.open("roadmap-viewer", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("handles");
      r.onerror = () => res(null);
      r.onsuccess = () => {
        const tx = r.result.transaction("handles", op === "get" ? "readonly" : "readwrite");
        const st = tx.objectStore("handles");
        const q = op === "get" ? st.get(location.pathname) : st.put(valore, location.pathname);
        q.onsuccess = () => res(op === "get" ? q.result || null : true);
        q.onerror = () => res(null);
      };
    });
  }

  function scarica(testo) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([testo], { type: "text/javascript" }));
    a.download = "data.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function salvato() {
    sporco = false;
    localStorage.removeItem(CHIAVE_BOZZA);
    aggiornaSalva();
  }

  async function salva() {
    const testo = serializza();
    if (!window.showSaveFilePicker) { scarica(testo); salvato(); avviso(t("savedDownload")); return; }
    try {
      if (!fileHandle) fileHandle = await idb("get");
      if (fileHandle && fileHandle.queryPermission && (await fileHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
        if ((await fileHandle.requestPermission({ mode: "readwrite" })) !== "granted") fileHandle = null;
      }
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({ suggestedName: "data.js", types: [{ description: "data.js", accept: { "text/javascript": [".js"] } }] });
        await idb("put", fileHandle);
      }
      const w = await fileHandle.createWritable();
      await w.write(testo); await w.close();
      salvato(); avviso(t("saved") + " (" + fileHandle.name + ")");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      fileHandle = null;
      avviso(t("saveErr") + (e && e.message ? e.message : e), true);
    }
  }

  function aggiornaSalva() {
    const b = $("#salva");
    b.textContent = sporco ? t("saveDirty") : t("save");
    b.classList.toggle("sporco", sporco);
  }

  /* ---------- modale con form ---------- */
  function form(titolo, campi, valori, onOk, onDel) {
    const m = $("#modale");
    const html = campi.map((c) => {
      const v = valori[c.k];
      const idc = "f_" + c.k;
      if (c.type === "checkbox") return `<div class="campo check"><input type="checkbox" id="${idc}" ${v ? "checked" : ""}><label for="${idc}">${esc(c.label)}</label></div>`;
      let input;
      if (c.type === "textarea" || c.type === "lines") input = `<textarea id="${idc}">${esc(c.type === "lines" ? (v || []).join("\n") : v || "")}</textarea>`;
      else if (c.type === "select") input = `<select id="${idc}">${c.options.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(v == null ? "" : v) ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
      else input = `<input id="${idc}" type="${c.type === "number" ? "number" : "text"}" ${c.step ? `step="${c.step}"` : ""} value="${esc(v == null ? "" : v)}" ${c.readonly ? "readonly" : ""}>`;
      return `<div class="campo"><label for="${idc}">${esc(c.label)}${c.required ? " *" : ""}</label>${input}</div>`;
    }).join("");
    m.innerHTML = `<div class="finestra" role="dialog" aria-modal="true"><h3>${esc(titolo)}</h3>${html}<div class="errore" id="f_errore"></div>
      <div class="piede">${onDel ? `<button class="pericolo sx" id="f_del">${esc(t("del"))}</button>` : ""}<button id="f_annulla">${esc(t("cancel"))}</button><button class="primario" id="f_ok">${esc(t("ok"))}</button></div></div>`;
    m.hidden = false;
    const chiudi = () => { m.hidden = true; m.innerHTML = ""; };
    const primo = m.querySelector("input:not([readonly]),textarea,select");
    if (primo) primo.focus();
    $("#f_annulla").onclick = chiudi;
    m.onclick = (e) => { if (e.target === m) chiudi(); };
    if (onDel) $("#f_del").onclick = () => { if (onDel() !== false) chiudi(); };
    $("#f_ok").onclick = () => {
      const out = {};
      for (const c of campi) {
        const el = document.getElementById("f_" + c.k);
        let v = c.type === "checkbox" ? el.checked : el.value;
        if (c.type === "lines") v = righe(v);
        else if (c.type === "number") v = v === "" ? null : Number(v);
        else if (typeof v === "string") v = v.trim();
        if (c.required && (v === "" || v == null || (Array.isArray(v) && !v.length))) { $("#f_errore").textContent = c.label + ": " + t("required"); el.focus(); return; }
        out[c.k] = v;
      }
      const errore = onOk(out);
      if (errore) { $("#f_errore").textContent = errore; return; }
      chiudi();
    };
  }

  const opzStati = () => STATI.map((s) => ({ v: s, l: t("st_" + s) }));
  const opzTask = () => [{ v: "", l: t("f_none") }].concat(D.tasks.map((x) => ({ v: x.id, l: `${x.id} — ${x.title}` })));
  const opzPersone = () => [{ v: "", l: t("f_none") }].concat(D.people.map((p) => ({ v: p.id, l: `${p.icon || "👤"} ${p.name}` })));
  const opzColonne = () => D.kanban.columns.map((c) => ({ v: c.id, l: c.title }));
  const opzNodi = () => D.structure.nodes.map((n) => ({ v: n.id, l: n.title }));

  /* ---------- navigazione ---------- */
  function vai(v, opzioni) {
    vista = VISTE.includes(v) ? v : "struttura";
    if (opzioni && opzioni.task !== undefined) taskAperto = opzioni.task;
    history.replaceState(null, "", "#" + vista);
    ridisegna();
    window.scrollTo(0, 0);
    if (opzioni && opzioni.card) lampeggia(opzioni.card);
  }

  function lampeggia(idCard) {
    filtroOp = "all";
    ridisegna();
    const el = document.querySelector(`[data-card="${CSS.escape(idCard)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    el.classList.remove("lampeggio"); void el.offsetWidth; el.classList.add("lampeggio");
    setTimeout(() => el.classList.remove("lampeggio"), 1500);
  }

  function ridisegna() {
    document.documentElement.lang = lingua;
    document.title = D.meta.title;
    $("#titolo").textContent = D.meta.title;
    $("#agg").textContent = [D.meta.subtitle, D.meta.updated ? `${t("updated")} ${D.meta.updated}` : "", D.meta.sources.length ? `${t("sources")}: ${D.meta.sources.join(", ")}` : ""].filter(Boolean).join(" · ");
    $("#nav").innerHTML = VISTE.map((v) => `<button data-v="${v}" class="${v === vista ? "attivo" : ""}">${esc(t(NAV[v]))}</button>`).join("");
    $("#txt-modifica").textContent = t("edit");
    $("#scarica").textContent = t("download");
    $("#lingua").value = lingua;
    aggiornaSalva();
    document.body.classList.toggle("modifica-on", modifica);
    document.querySelectorAll("#nav button").forEach((b) => (b.onclick = () => vai(b.dataset.v)));
    document.querySelectorAll("main section").forEach((s) => s.classList.toggle("attivo", s.id === vista));
    ({ struttura: vStruttura, mappa: vMappa, kanban: vKanban, compiti: vCompiti, operatori: vOperatori, registro: vRegistro })[vista]();
  }

  /* ---------- 1. Struttura progetto ---------- */
  function altezzaNodo(n) { return Math.max(n.h || 0, 44 + (n.lines || []).length * 17); }

  function formNodo(n) {
    const nuovo = !n;
    n = n || { id: uid("n"), x: 40, y: 40, w: 250, icon: "📦", title: "", lines: [], status: "waiting", task: "" };
    form(t("node"), [
      { k: "title", label: t("f_title"), required: true }, { k: "icon", label: t("f_icon") },
      { k: "lines", label: t("f_lines"), type: "lines" }, { k: "status", label: t("f_status"), type: "select", options: opzStati() },
      { k: "task", label: t("f_task"), type: "select", options: opzTask() }
    ], n, (v) => {
      Object.assign(n, v);
      if (nuovo) { const maxY = D.structure.nodes.reduce((m, x) => Math.max(m, x.y + altezzaNodo(x)), 0); n.y = D.structure.nodes.length ? maxY + 30 : 40; D.structure.nodes.push(n); }
      cambia(nuovo ? "add" : "edit", "structure.node", n.id, n.title);
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: n.title }))) return false;
      D.structure.nodes = D.structure.nodes.filter((x) => x !== n);
      D.structure.links = D.structure.links.filter((l) => l.from !== n.id && l.to !== n.id);
      cambia("delete", "structure.node", n.id, n.title);
    });
  }

  function formLink(l) {
    const nuovo = !l;
    if (D.structure.nodes.length < 2) return;
    l = l || { id: uid("l"), from: D.structure.nodes[0].id, to: D.structure.nodes[1].id, label: "", status: "done", dashed: false, curve: 0, labelPos: 0.5 };
    form(t("link"), [
      { k: "from", label: t("f_from"), type: "select", options: opzNodi() }, { k: "to", label: t("f_to"), type: "select", options: opzNodi() },
      { k: "label", label: t("f_label") }, { k: "status", label: t("f_status"), type: "select", options: opzStati() },
      { k: "dashed", label: t("f_dashed"), type: "checkbox" }, { k: "curve", label: t("f_curve"), type: "number", step: "10" },
      { k: "labelPos", label: t("f_labelPos"), type: "number", step: "0.05" }
    ], l, (v) => {
      if (v.from === v.to) return t("f_from") + " = " + t("f_to");
      Object.assign(l, v, { curve: v.curve || 0, labelPos: v.labelPos == null ? 0.5 : Math.min(1, Math.max(0, v.labelPos)) });
      if (nuovo) D.structure.links.push(l);
      cambia(nuovo ? "add" : "edit", "structure.link", l.id, `${l.from} → ${l.to}`);
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: l.label || l.id }))) return false;
      D.structure.links = D.structure.links.filter((x) => x !== l);
      cambia("delete", "structure.link", l.id, l.label || l.id);
    });
  }

  function vStruttura() {
    const S = D.structure, N = Object.fromEntries(S.nodes.map((n) => [n.id, n]));
    const centro = (n) => [n.x + (n.w || 250) / 2, n.y + altezzaNodo(n) / 2];
    const bordo = (n, verso) => {
      const [cx, cy] = centro(n), dx = verso[0] - cx, dy = verso[1] - cy;
      const s = Math.min(Math.abs(((n.w || 250) / 2) / (dx || 1e-9)), Math.abs((altezzaNodo(n) / 2) / (dy || 1e-9)));
      return [cx + dx * s, cy + dy * s];
    };
    const W = Math.max(1200, ...S.nodes.map((n) => n.x + (n.w || 250) + 40));
    const H = Math.max(600, ...S.nodes.map((n) => n.y + altezzaNodo(n) + 40));
    const frecce = S.links.filter((l) => N[l.from] && N[l.to]).map((l) => {
      const a = N[l.from], b = N[l.to], p1 = bordo(a, centro(b)), p2 = bordo(b, centro(a));
      const curva = l.curve || 0, mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
      const qx = mx - (p2[1] - p1[1]) / len * curva, qy = my + (p2[0] - p1[0]) / len * curva;
      const tp = l.labelPos == null ? 0.5 : l.labelPos, u = 1 - tp;
      const lx = u * u * p1[0] + 2 * u * tp * qx + tp * tp * p2[0], ly = u * u * p1[1] + 2 * u * tp * qy + tp * tp * p2[1];
      const col = colore(l.status);
      return `<path d="M${p1[0]},${p1[1]} Q${qx},${qy} ${p2[0]},${p2[1]}" fill="none" stroke="${col}" stroke-width="${l.status === "critical" ? 3 : 2}" ${l.dashed ? 'stroke-dasharray="6 5"' : ""} marker-end="url(#m-${stato(l.status)})" opacity=".9"/>
        <text class="etichetta-link" data-link="${esc(l.id)}" x="${lx}" y="${ly - 4}" fill="${col}" font-size="11" text-anchor="middle" paint-order="stroke" stroke="#17212c" stroke-width="4">${esc(l.label || (modifica ? "✎" : ""))}</text>`;
    }).join("");
    const nodi = S.nodes.map((n) => {
      const col = colore(n.status), w = n.w || 250, h = altezzaNodo(n);
      const rr = (n.lines || []).map((r, i) => `<text x="${n.x + 14}" y="${n.y + 46 + i * 17}" fill="#c9d6e2" font-size="12">${esc(r)}</text>`).join("");
      return `<g class="nodo nodo-struttura" data-node="${esc(n.id)}">
        <rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="12" fill="#1e2a37" stroke="${col}" stroke-width="2"/>
        <rect x="${n.x}" y="${n.y}" width="6" height="${h}" rx="3" fill="${col}"/>
        <text x="${n.x + 14}" y="${n.y + 24}" fill="#e6edf3" font-size="14" font-weight="600">${esc((n.icon ? n.icon + " " : "") + n.title)}${n.task ? `  ·  ${esc(n.task)}` : ""}</text>${rr}</g>`;
    }).join("");
    const marker = STATI.map((k) => `<marker id="m-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${COLORI[k]}"/></marker>`).join("");
    const usati = STATI.filter((s) => S.nodes.some((n) => stato(n.status) === s) || S.links.some((l) => stato(l.status) === s));
    $("#struttura").innerHTML = `<h2>${esc(t("structTitle"))}</h2>
      <div class="barra-strumenti">${modifica ? `<button id="add-node">${esc(t("addNode"))}</button><button id="add-link" ${S.nodes.length < 2 ? "disabled" : ""}>${esc(t("addLink"))}</button>` : ""}</div>
      ${legenda(usati.length ? usati : STATI)}
      ${S.nodes.length ? `<div class="svgbox"><svg id="svg-struttura" viewBox="0 0 ${W} ${H}" width="100%"><defs>${marker}</defs>${frecce}${nodi}</svg></div>` : `<p class="vuoto">${esc(t("empty"))}</p>`}
      <p class="info">${esc(modifica ? t("structHintEdit") : t("structHintView"))} ${esc(t("dashedNote"))}</p>`;
    if (modifica) { $("#add-node").onclick = () => formNodo(); $("#add-link").onclick = () => formLink(); }
    document.querySelectorAll("#struttura [data-link]").forEach((el) => (el.onclick = () => { if (modifica) formLink(trova(S.links, el.dataset.link)); }));
    const svg = $("#svg-struttura");
    document.querySelectorAll("#struttura [data-node]").forEach((g) => {
      const n = trova(S.nodes, g.dataset.node);
      g.addEventListener("pointerdown", (e) => {
        if (!modifica) return;
        e.preventDefault();
        const inv = svg.getScreenCTM().inverse();
        const pt = (ev) => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(inv); };
        const p0 = pt(e), x0 = n.x, y0 = n.y;
        let mosso = false;
        const muovi = (ev) => {
          const p = pt(ev), dx = p.x - p0.x, dy = p.y - p0.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) mosso = true;
          n.x = Math.max(0, Math.round(x0 + dx)); n.y = Math.max(0, Math.round(y0 + dy));
          g.setAttribute("transform", `translate(${n.x - x0},${n.y - y0})`);
        };
        const fine = () => {
          window.removeEventListener("pointermove", muovi); window.removeEventListener("pointerup", fine);
          if (mosso) cambia("move", "structure.node", n.id, `${n.title} (${n.x}, ${n.y})`); else formNodo(n);
        };
        window.addEventListener("pointermove", muovi); window.addEventListener("pointerup", fine);
      });
      g.addEventListener("click", () => { if (!modifica && n.task && trova(D.tasks, n.task)) vai("mappa", { task: n.task }); });
    });
  }

  /* ---------- 2. Mappa priorità ---------- */
  function formTask(x) {
    const nuovo = !x;
    x = x || { id: "", icon: "📌", title: "", status: "waiting", summary: "", facts: [], doc: "", steps: [] };
    form(t("addTask").replace("+ ", ""), [
      { k: "id", label: t("f_id"), required: true, readonly: !nuovo }, { k: "title", label: t("f_title"), required: true },
      { k: "icon", label: t("f_icon") }, { k: "status", label: t("f_status"), type: "select", options: opzStati() },
      { k: "summary", label: t("f_summary"), type: "textarea" }, { k: "facts", label: t("f_facts"), type: "lines" }, { k: "doc", label: t("f_doc") }
    ], x, (v) => {
      if (nuovo && trova(D.tasks, v.id)) return t("dupId");
      Object.assign(x, v);
      if (nuovo) D.tasks.push(x);
      taskAperto = x.id;
      cambia(nuovo ? "add" : "edit", "task", x.id, x.title);
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: x.id + " — " + x.title }))) return false;
      D.tasks = D.tasks.filter((y) => y !== x);
      D.kanban.cards.forEach((c) => { if (c.task === x.id) c.task = ""; });
      D.structure.nodes.forEach((n) => { if (n.task === x.id) n.task = ""; });
      taskAperto = null;
      cambia("delete", "task", x.id, x.title);
    });
  }

  function formPasso(x, i) {
    const nuovo = i == null;
    const s = nuovo ? { name: "", status: "waiting", does: [], expected: "", risks: "", note: "" } : x.steps[i];
    form(t("addStep").replace("+ ", "") + " · " + x.id, [
      { k: "name", label: t("f_name"), required: true }, { k: "status", label: t("f_status"), type: "select", options: opzStati() },
      { k: "does", label: t("f_does"), type: "lines" }, { k: "expected", label: t("f_expected"), type: "textarea" },
      { k: "risks", label: t("f_risks"), type: "textarea" }, { k: "note", label: t("f_note") }
    ], s, (v) => {
      Object.assign(s, v);
      if (nuovo) x.steps.push(s);
      cambia(nuovo ? "add" : "edit", "task.step", x.id, s.name);
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: s.name }))) return false;
      x.steps.splice(i, 1);
      cambia("delete", "task.step", x.id, s.name);
    });
  }

  function vMappa() {
    const P = D.tasks, W = 1200, H = 820, cx = W / 2, cy = H / 2, R = 200;
    let svg = "";
    const pos = {};
    P.forEach((p, i) => {
      const ang = -Math.PI / 2 + i * 2 * Math.PI / Math.max(1, P.length);
      pos[p.id] = { x: cx + Math.cos(ang) * R * 1.55, y: cy + Math.sin(ang) * R, ang };
      const sel = taskAperto === p.id;
      svg += `<line x1="${cx}" y1="${cy}" x2="${pos[p.id].x}" y2="${pos[p.id].y}" stroke="${colore(p.status)}" stroke-width="${sel ? 4 : 2}" opacity="${taskAperto && !sel ? .25 : .8}"/>`;
      if (sel) p.steps.forEach((s, j) => {
        const a2 = pos[p.id].ang + (j - (p.steps.length - 1) / 2) * 0.32;
        const sx = Math.min(W - 30, Math.max(30, pos[p.id].x + Math.cos(a2) * 130)), sy = Math.min(H - 30, Math.max(30, pos[p.id].y + Math.sin(a2) * 130));
        svg += `<line x1="${pos[p.id].x}" y1="${pos[p.id].y}" x2="${sx}" y2="${sy}" stroke="${colore(s.status)}" stroke-width="1.5"/>
          <g><title>${esc(s.name)}</title><circle cx="${sx}" cy="${sy}" r="14" fill="${colore(s.status)}"/><text x="${sx}" y="${sy + 5}" fill="#0b1117" font-size="13" font-weight="800" text-anchor="middle">${j + 1}</text></g>`;
      });
    });
    svg += `<g id="centro-mappa" class="nodo"><circle cx="${cx}" cy="${cy}" r="66" fill="#1e2a37" stroke="#4b6178" stroke-width="2"/>
      <text x="${cx}" y="${cy - 4}" fill="#e6edf3" font-size="15" font-weight="700" text-anchor="middle">${esc(D.map.centerTitle)}</text>
      <text x="${cx}" y="${cy + 16}" fill="#8fa3b8" font-size="11" text-anchor="middle">${esc(D.map.centerSubtitle)}</text></g>`;
    P.forEach((p) => {
      const sel = taskAperto === p.id, q = pos[p.id];
      svg += `<g class="nodo" data-task="${esc(p.id)}" opacity="${taskAperto && !sel ? .45 : 1}">
        <circle cx="${q.x}" cy="${q.y}" r="${sel ? 46 : 40}" fill="#1e2a37" stroke="${colore(p.status)}" stroke-width="${sel ? 5 : 3}"/>
        <text x="${q.x}" y="${q.y - 2}" font-size="22" text-anchor="middle">${esc(p.icon || "📌")}</text>
        <text x="${q.x}" y="${q.y + 20}" fill="#e6edf3" font-size="12" font-weight="700" text-anchor="middle">${esc(p.id)}</text></g>`;
    });
    const p = trova(P, taskAperto);
    let dettaglio = `<p class="info">${esc(t("mapHint"))}</p>`;
    if (p) {
      const carte = D.kanban.cards.filter((c) => c.task === p.id);
      const kb = carte.length ? carte.map((c) => `<button class="mini" data-vai-card="${esc(c.id)}">🗂️ ${esc(t("showInKanban"))}: ${esc(c.title)}</button>`).join(" ") : `<span class="num">${esc(t("noCards"))}</span>`;
      const righeTab = p.steps.map((s, j) => `<tr><td><span class="pill" style="--c:${colore(s.status)}">${j + 1}</span></td>
        <td style="min-width:240px">${esc(s.name)}${(s.does || []).length ? `<div class="num" style="margin-top:6px;line-height:1.5">${s.does.map(esc).join("<br>")}</div>` : ""}</td>
        <td>${pill(s.status)}</td><td class="num" style="line-height:1.5">${esc(s.expected)}</td><td class="num" style="line-height:1.5">${esc(s.risks)}</td><td class="num">${esc(s.note)}</td>
        ${modifica ? `<td class="azioni-riga"><button class="mini" data-su="${j}" ${j === 0 ? "disabled" : ""}>${t("moveUp")}</button> <button class="mini" data-giu="${j}" ${j === p.steps.length - 1 ? "disabled" : ""}>${t("moveDown")}</button> <button class="mini" data-passo="${j}">✎</button></td>` : ""}</tr>`).join("");
      dettaglio = `<div class="card" style="--c:${colore(p.status)};margin-top:12px">
        <h3><span class="ic">${esc(p.icon || "📌")}</span>${esc(p.id)} — ${esc(p.title)} ${pill(p.status)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="meta">${p.facts.map((f) => `<span>${esc(f)}</span>`).join("")}${p.doc ? `<span>📄 ${esc(p.doc)}</span>` : ""}</div>
        <div class="barra-strumenti" style="margin-top:10px">${kb}${modifica ? ` <button id="edit-task">${esc(t("editTask"))}</button> <button id="add-step">${esc(t("addStep"))}</button>` : ""}</div>
        ${p.steps.length ? `<table><tr><th>${esc(t("step"))}</th><th>${esc(t("stepCol"))}</th><th>${esc(t("statusCol"))}</th><th>${esc(t("expectedCol"))}</th><th>${esc(t("risksCol"))}</th><th>${esc(t("noteCol"))}</th>${modifica ? "<th></th>" : ""}</tr>${righeTab}</table>` : ""}
      </div>`;
    }
    $("#mappa").innerHTML = `<h2>${esc(t("mapTitle"))}</h2>
      <div class="barra-strumenti">${modifica ? `<button id="add-task">${esc(t("addTask"))}</button><button id="edit-centro">${esc(t("editMap"))}</button>` : ""}</div>
      ${legenda(STATI)}<div class="svgbox"><svg id="svg-mappa" viewBox="0 0 ${W} ${H}" width="100%">${svg}</svg></div>${dettaglio}`;
    document.querySelectorAll("#mappa [data-task]").forEach((g) => (g.onclick = () => { taskAperto = taskAperto === g.dataset.task ? null : g.dataset.task; vMappa(); }));
    $("#centro-mappa").onclick = () => { taskAperto = null; vMappa(); };
    document.querySelectorAll("#mappa [data-vai-card]").forEach((b) => (b.onclick = () => vai("kanban", { card: b.dataset.vaiCard })));
    if (modifica) {
      $("#add-task").onclick = () => formTask();
      $("#edit-centro").onclick = () => form(t("editMap"), [{ k: "centerTitle", label: t("f_centerTitle"), required: true }, { k: "centerSubtitle", label: t("f_centerSubtitle") }], D.map, (v) => { Object.assign(D.map, v); cambia("edit", "map", "center", v.centerTitle); });
      if (p) {
        $("#edit-task").onclick = () => formTask(p);
        $("#add-step").onclick = () => formPasso(p);
        document.querySelectorAll("#mappa [data-passo]").forEach((b) => (b.onclick = () => formPasso(p, Number(b.dataset.passo))));
        const sposta = (i, d) => { const s = p.steps.splice(i, 1)[0]; p.steps.splice(i + d, 0, s); cambia("move", "task.step", p.id, s.name); };
        document.querySelectorAll("#mappa [data-su]").forEach((b) => (b.onclick = () => sposta(Number(b.dataset.su), -1)));
        document.querySelectorAll("#mappa [data-giu]").forEach((b) => (b.onclick = () => sposta(Number(b.dataset.giu), 1)));
      }
    }
  }

  /* ---------- 3. Kanban ---------- */
  function formCard(c, colonna) {
    const nuovo = !c;
    c = c || { id: uid("c"), title: "", description: "", column: colonna || D.kanban.columns[0].id, assignee: "", task: "", status: "waiting", unblocks: "" };
    form(nuovo ? t("addCard").replace("+ ", "") : c.title, [
      { k: "title", label: t("f_title"), required: true }, { k: "description", label: t("f_description"), type: "textarea" },
      { k: "column", label: t("f_column"), type: "select", options: opzColonne() }, { k: "assignee", label: t("f_assignee"), type: "select", options: opzPersone() },
      { k: "status", label: t("f_status"), type: "select", options: opzStati() }, { k: "task", label: t("f_task"), type: "select", options: opzTask() },
      { k: "unblocks", label: t("f_unblocks") }
    ], c, (v) => {
      Object.assign(c, v);
      if (nuovo) D.kanban.cards.push(c);
      cambia(nuovo ? "add" : "edit", "kanban.card", c.id, c.title);
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: c.title }))) return false;
      D.kanban.cards = D.kanban.cards.filter((x) => x !== c);
      cambia("delete", "kanban.card", c.id, c.title);
    });
  }

  function formColonna(col) {
    const nuovo = !col;
    col = col || { id: uid("col"), title: "", final: false, color: "" };
    form(t("column"), [{ k: "title", label: t("f_title"), required: true }, { k: "color", label: t("f_color") }, { k: "final", label: t("f_final"), type: "checkbox" }], col, (v) => {
      Object.assign(col, v);
      if (nuovo) D.kanban.columns.push(col);
      cambia(nuovo ? "add" : "edit", "kanban.column", col.id, col.title);
    }, nuovo ? null : () => {
      const altre = D.kanban.columns.filter((x) => x !== col);
      if (!altre.length) { alert(t("lastColumn")); return false; }
      const dentro = D.kanban.cards.filter((c) => c.column === col.id);
      if (dentro.length ? !confirm(t("confirmColumn", { n: dentro.length, x: altre[0].title })) : !confirm(t("confirmDel", { x: col.title }))) return false;
      dentro.forEach((c) => (c.column = altre[0].id));
      D.kanban.columns = altre;
      cambia("delete", "kanban.column", col.id, col.title);
    });
  }

  function htmlCard(c) {
    const task = trova(D.tasks, c.task);
    return `<div class="kcard" data-card="${esc(c.id)}" draggable="${modifica}" style="--c:${colore(c.status)}">
      <div class="t">${esc(c.title)}</div>${c.description ? `<div class="d">${esc(c.description)}</div>` : ""}
      ${c.assignee ? `<span class="chip">${esc(nomePersona(c.assignee))}</span>` : ""}
      ${task ? `<span class="chip link" data-apri-task="${esc(task.id)}">${esc(task.icon || "📌")} ${esc(task.id)}</span>` : ""}
      ${c.unblocks ? `<span class="chip">${esc(t("unblocks"))}: ${esc(c.unblocks)}</span>` : ""}</div>`;
  }

  function vKanban() {
    const K = D.kanban;
    const passa = (c) => filtroOp === "all" || (filtroOp === "" ? !c.assignee : c.assignee === filtroOp);
    const cols = K.columns.map((col, i) => {
      const carte = K.cards.filter((c) => c.column === col.id && passa(c));
      return `<div class="colonna" data-col="${esc(col.id)}" style="${col.color ? `border-top:3px solid ${esc(col.color)}` : ""}">
        <div class="col-testa"><b>${esc(col.title)}${col.final ? " ✓" : ""}</b><span class="conta">${carte.length}</span>
        ${modifica ? `<button class="mini" data-sx="${i}" ${i === 0 ? "disabled" : ""}>${t("moveLeft")}</button><button class="mini" data-dx="${i}" ${i === K.columns.length - 1 ? "disabled" : ""}>${t("moveRight")}</button><button class="mini" data-edit-col="${esc(col.id)}">✎</button>` : ""}</div>
        <div class="col-corpo">${carte.map(htmlCard).join("")}${modifica ? `<button class="mini" data-add-card="${esc(col.id)}">${esc(t("addCard"))}</button>` : ""}</div></div>`;
    }).join("");
    $("#kanban").innerHTML = `<h2>${esc(t("kanbanTitle"))}</h2>
      <div class="barra-strumenti"><label class="num">${esc(t("filterPeople"))}</label>
        <select id="filtro-op"><option value="all">${esc(t("all"))}</option><option value="">${esc(t("unassigned"))}</option>${D.people.map((p) => `<option value="${esc(p.id)}">${esc((p.icon || "👤") + " " + p.name)}</option>`).join("")}</select>
        ${modifica ? `<button id="add-card">${esc(t("addCard"))}</button><button id="add-col">${esc(t("addColumn"))}</button>` : `<span class="num">${esc(t("dragHint"))}</span>`}</div>
      <div class="kanban">${cols}</div>${legenda(STATI)}`;
    $("#filtro-op").value = filtroOp;
    $("#filtro-op").onchange = (e) => { filtroOp = e.target.value; vKanban(); };
    document.querySelectorAll("#kanban [data-apri-task]").forEach((el) => (el.onclick = (e) => { e.stopPropagation(); vai("mappa", { task: el.dataset.apriTask }); }));
    if (!modifica) return;
    $("#add-card").onclick = () => formCard();
    $("#add-col").onclick = () => formColonna();
    document.querySelectorAll("#kanban [data-add-card]").forEach((b) => (b.onclick = () => formCard(null, b.dataset.addCard)));
    document.querySelectorAll("#kanban [data-edit-col]").forEach((b) => (b.onclick = () => formColonna(trova(K.columns, b.dataset.editCol))));
    const spostaCol = (i, d) => { const c = K.columns.splice(i, 1)[0]; K.columns.splice(i + d, 0, c); cambia("move", "kanban.column", c.id, c.title); };
    document.querySelectorAll("#kanban [data-sx]").forEach((b) => (b.onclick = () => spostaCol(Number(b.dataset.sx), -1)));
    document.querySelectorAll("#kanban [data-dx]").forEach((b) => (b.onclick = () => spostaCol(Number(b.dataset.dx), 1)));
    document.querySelectorAll("#kanban .kcard").forEach((el) => {
      el.onclick = () => formCard(trova(K.cards, el.dataset.card));
      el.ondragstart = (e) => { e.dataTransfer.setData("text/plain", el.dataset.card); e.dataTransfer.effectAllowed = "move"; };
    });
    document.querySelectorAll("#kanban .colonna").forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add("sopra"); };
      col.ondragleave = () => col.classList.remove("sopra");
      col.ondrop = (e) => {
        e.preventDefault(); col.classList.remove("sopra");
        const c = trova(K.cards, e.dataTransfer.getData("text/plain"));
        if (!c || c.column === col.dataset.col) return;
        c.column = col.dataset.col;
        cambia("move", "kanban.card", c.id, `${c.title} → ${trova(K.columns, c.column).title}`);
      };
    });
  }

  /* ---------- 4. Compiti assegnati ---------- */
  function vCompiti() {
    const finali = new Set(D.kanban.columns.filter((c) => c.final).map((c) => c.id));
    const aperte = D.kanban.cards.filter((c) => !finali.has(c.column));
    const gruppi = D.people.map((p) => ({ p, carte: aperte.filter((c) => c.assignee === p.id) }));
    const senza = aperte.filter((c) => !persona(c.assignee));
    if (senza.length) gruppi.push({ p: { id: "", name: t("nobody"), icon: "❔" }, carte: senza });
    const fatte = D.kanban.cards.length - aperte.length;
    $("#compiti").innerHTML = `<h2>${esc(t("assignedTitle"))}</h2>
      ${gruppi.some((g) => g.carte.length) ? `<div class="griglia g4">${gruppi.filter((g) => g.carte.length).map((g) => `<div class="card" style="--c:${esc(g.p.color || "var(--waiting)")}">
        <h3><span class="ic">${esc(g.p.icon || "👤")}</span>${esc(g.p.name)}</h3>${g.p.role ? `<div class="num">${esc(g.p.role)}</div>` : ""}
        ${g.carte.map((c) => { const col = trova(D.kanban.columns, c.column); return `<p style="cursor:pointer" data-vai-card="${esc(c.id)}"><span class="pallino" style="--c:${colore(c.status)}"></span>${esc(c.title)}<br>
          <span class="num">${esc(col ? col.title : "")}${c.task ? " · " + esc(c.task) : ""}${c.unblocks ? " · " + esc(t("unblocks")) + ": " + esc(c.unblocks) : ""}</span></p>`; }).join("")}</div>`).join("")}</div>` : `<p class="vuoto">${esc(t("nothing"))}</p>`}
      <p class="info">${fatte} ${esc(t("completed"))}.</p>`;
    document.querySelectorAll("#compiti [data-vai-card]").forEach((el) => (el.onclick = () => vai("kanban", { card: el.dataset.vaiCard })));
  }

  /* ---------- 5. Operatori ---------- */
  function formPersona(p) {
    const nuovo = !p;
    p = p || { id: uid("p"), name: "", role: "", icon: "👤", color: "" };
    form(t("people").replace(/^\S+\s/, ""), [{ k: "name", label: t("f_name"), required: true }, { k: "role", label: t("f_role") }, { k: "icon", label: t("f_icon") }, { k: "color", label: t("f_color") }], p, (v) => {
      Object.assign(p, v);
      if (nuovo) D.people.push(p);
      cambia(nuovo ? "add" : "edit", "person", p.id, p.name);
    }, nuovo ? null : () => {
      const carte = D.kanban.cards.filter((c) => c.assignee === p.id);
      if (carte.length ? !confirm(t("confirmDelCards", { n: carte.length })) : !confirm(t("confirmDel", { x: p.name }))) return false;
      carte.forEach((c) => (c.assignee = ""));
      D.people = D.people.filter((x) => x !== p);
      cambia("delete", "person", p.id, p.name);
    });
  }

  function vOperatori() {
    const finali = new Set(D.kanban.columns.filter((c) => c.final).map((c) => c.id));
    $("#operatori").innerHTML = `<h2>${esc(t("peopleTitle"))}</h2>
      <div class="barra-strumenti">${modifica ? `<button id="add-person">${esc(t("addPerson"))}</button>` : ""}</div>
      ${D.people.length ? `<div class="card"><table><tr><th></th><th>${esc(t("f_name"))}</th><th>${esc(t("f_role"))}</th><th>${esc(t("openTasks"))}</th>${modifica ? "<th></th>" : ""}</tr>
      ${D.people.map((p) => { const n = D.kanban.cards.filter((c) => c.assignee === p.id && !finali.has(c.column)).length; return `<tr><td class="ic">${esc(p.icon || "👤")}</td><td>${esc(p.name)}</td><td class="num">${esc(p.role)}</td>
        <td><a href="#" data-filtra="${esc(p.id)}">${n}</a></td>${modifica ? `<td><button class="mini" data-edit-person="${esc(p.id)}">✎</button></td>` : ""}</tr>`; }).join("")}</table></div>` : `<p class="vuoto">${esc(t("empty"))}</p>`}`;
    document.querySelectorAll("#operatori [data-filtra]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); filtroOp = a.dataset.filtra; vista = "kanban"; history.replaceState(null, "", "#kanban"); ridisegna(); }));
    if (!modifica) return;
    $("#add-person").onclick = () => formPersona();
    document.querySelectorAll("#operatori [data-edit-person]").forEach((b) => (b.onclick = () => formPersona(persona(b.dataset.editPerson))));
  }

  /* ---------- 6. Registro decisioni ---------- */
  function formDecisione(d) {
    const nuovo = !d;
    d = d || { id: uid("d"), datetime: adesso(), task: taskAperto || "", text: "", status: "done", author: "" };
    form(t("addDecision").replace("+ ", ""), [
      { k: "datetime", label: t("f_datetime"), required: true }, { k: "task", label: t("f_task"), type: "select", options: opzTask() },
      { k: "text", label: t("f_text"), type: "textarea", required: true }, { k: "status", label: t("f_status"), type: "select", options: opzStati() },
      { k: "author", label: t("f_author") }
    ], d, (v) => {
      if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(v.datetime)) return t("f_datetime");
      Object.assign(d, v);
      if (nuovo) D.decisions.push(d);
      cambia(nuovo ? "add" : "edit", "decision", d.id, d.text.slice(0, 80));
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: d.text.slice(0, 60) }))) return false;
      D.decisions = D.decisions.filter((x) => x !== d);
      cambia("delete", "decision", d.id, d.text.slice(0, 80));
    });
  }

  function formLezione(l) {
    const nuovo = !l;
    l = l || { id: "", text: "" };
    form(t("lessons"), [{ k: "id", label: t("f_id"), required: true, readonly: !nuovo }, { k: "text", label: t("f_text"), type: "textarea", required: true }], l, (v) => {
      if (nuovo && trova(D.lessons, v.id)) return t("dupId");
      Object.assign(l, v);
      if (nuovo) D.lessons.push(l);
      cambia(nuovo ? "add" : "edit", "lesson", l.id, l.text.slice(0, 80));
    }, nuovo ? null : () => {
      if (!confirm(t("confirmDel", { x: l.id }))) return false;
      D.lessons = D.lessons.filter((x) => x !== l);
      cambia("delete", "lesson", l.id, l.text.slice(0, 80));
    });
  }

  function vRegistro() {
    const ids = ["all", ...new Set(D.decisions.map((d) => d.task).filter(Boolean))];
    if (!ids.includes(filtroReg)) filtroReg = "all";
    const voci = D.decisions.filter((d) => filtroReg === "all" || d.task === filtroReg).slice().sort((a, b) => String(b.datetime).localeCompare(String(a.datetime)));
    const pendenti = D.changelog.filter((c) => !c.synced);
    $("#registro").innerHTML = `
      ${pendenti.length ? `<details class="modifiche"><summary>⚠ ${esc(t("pending"))}: ${pendenti.length}</summary><p class="info">${esc(t("pendingInfo"))}</p>
        <table>${pendenti.slice(-50).reverse().map((c) => `<tr><td class="num">${esc(c.datetime)}</td><td>${esc(t("a_" + c.action) || c.action)}</td><td class="num">${esc(c.entity)}</td><td>${esc(c.summary)}</td></tr>`).join("")}</table></details>` : ""}
      <h2>${esc(t("decisionsTitle"))}</h2>
      <div class="barra-strumenti">${modifica ? `<button id="add-dec">${esc(t("addDecision"))}</button>` : ""}</div>
      <div class="filtri">${ids.map((i) => `<button data-f="${esc(i)}" class="${i === filtroReg ? "attivo" : ""}">${esc(i === "all" ? t("all") : i)}</button>`).join("")}</div>
      ${voci.length ? `<div class="timeline">${voci.map((d) => `<div class="tl" style="--c:${colore(d.status)}" ${modifica ? `data-edit-dec="${esc(d.id)}"` : ""}>
        <div class="d">${esc(d.datetime)}${d.task ? " · " + esc(d.task) : ""}${d.author ? " · " + esc(d.author) : ""}${modifica ? " ✎" : ""}</div>${esc(d.text)}</div>`).join("")}</div>` : `<p class="vuoto">${esc(t("empty"))}</p>`}
      <h2>${esc(t("lessons"))}</h2>
      <div class="barra-strumenti">${modifica ? `<button id="add-lez">${esc(t("addLesson"))}</button>` : ""}</div>
      ${D.lessons.length ? `<div class="lezioni">${D.lessons.map((l) => `<div class="lez" ${modifica ? `data-edit-lez="${esc(l.id)}" style="cursor:pointer"` : ""}><b>${esc(l.id)}</b>${esc(l.text)}</div>`).join("")}</div>` : `<p class="vuoto">${esc(t("empty"))}</p>`}`;
    document.querySelectorAll("#registro [data-f]").forEach((b) => (b.onclick = () => { filtroReg = b.dataset.f; vRegistro(); }));
    if (!modifica) return;
    $("#add-dec").onclick = () => formDecisione();
    $("#add-lez").onclick = () => formLezione();
    document.querySelectorAll("#registro [data-edit-dec]").forEach((el) => { el.style.cursor = "pointer"; el.onclick = () => formDecisione(trova(D.decisions, el.dataset.editDec)); });
    document.querySelectorAll("#registro [data-edit-lez]").forEach((el) => (el.onclick = () => formLezione(trova(D.lessons, el.dataset.editLez))));
  }

  /* ---------- avvio ---------- */
  function controllaBozza() {
    let b = null;
    try { b = JSON.parse(localStorage.getItem(CHIAVE_BOZZA) || "null"); } catch (e) { b = null; }
    if (!b || !b.data || !b.data.meta || String(b.data.meta.updated || "") <= String(D.meta.updated || "")) { if (b) localStorage.removeItem(CHIAVE_BOZZA); return; }
    const m = $("#modale");
    m.innerHTML = `<div class="finestra"><h3>⚠</h3><p>${esc(t("draftFound", { x: b.savedAt }))}</p>
      <div class="piede"><button id="b-scarta" class="pericolo">${esc(t("discard"))}</button><button id="b-ripr" class="primario">${esc(t("restore"))}</button></div></div>`;
    m.hidden = false;
    $("#b-scarta").onclick = () => { localStorage.removeItem(CHIAVE_BOZZA); m.hidden = true; };
    $("#b-ripr").onclick = () => { D = normalizza(b.data); sporco = true; m.hidden = true; ridisegna(); };
  }

  $("#modifica").onchange = (e) => { modifica = e.target.checked; ridisegna(); };
  $("#lingua").onchange = (e) => { lingua = e.target.value; ridisegna(); };
  $("#salva").onclick = salva;
  $("#scarica").onclick = () => scarica(serializza());
  window.addEventListener("beforeunload", (e) => { if (sporco) { e.preventDefault(); e.returnValue = t("unsaved"); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modale").hidden) { $("#modale").hidden = true; $("#modale").innerHTML = ""; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); salva(); }
  });

  vista = VISTE.includes(location.hash.slice(1)) ? location.hash.slice(1) : "struttura";
  ridisegna();
  controllaBozza();
})();
