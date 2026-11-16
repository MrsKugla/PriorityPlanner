**Il tuo prossimo passo:** leggi le 4 decisioni in fondo e rispondi «ok default», oppure cambia solo quelle che vuoi. Poi comincio a costruire dalla Fase 1.

## L'idea in una riga

Ogni attività consuma energia da 5 **batterie**. Ogni giorno ha una certa carica per ogni fascia oraria. Il bottone **«Proponi settimana»** mette ogni attività dove le batterie bastano.

## Cosa cambia rispetto alla tua descrizione

La tua lista mette insieme tre cose diverse. Se le separo, il collegamento tra i parametri diventa preciso:

| Concetto | Esempi | Come si usa |
|---|---|---|
| **Area di vita** (1 per attività, con colore e icona) | Lavoro, Famiglia, Amici, Salute, Casa, Me stessa | Colore delle carte; distribuisce le aree nella settimana |
| **Batterie** (costo da 0 a 3 per ciascuna) | Mentale, Emotiva, Sociale, Sensoriale, Fisica | Decidono **dove** entra un'attività |
| **Vincoli di tempo** | Durata, scadenza, orario fisso, giorno preferito, ricorrenza | Decidono **quando** può entrare |

Perché separarle: «Amici» è un'area, ma una cena con un'amica consuma batteria sociale, sensoriale ed emotiva. «Chiamare mamma» appartiene all'area Famiglia, ma consuma soprattutto batteria emotiva.

Ho aggiunto tre cose:
- **Batteria sensoriale**: rumore, luoghi affollati, luci. Con l'autismo conta molto.
- **Cuscinetto di transizione**: 15 minuti liberi dopo un'attività pesante, regolabili.
- **Pulsante «giorno no»**: abbassa l'energia di oggi e ridistribuisce il resto della settimana.

## Come si collegano i parametri

1. **Il mio ritmo** (il tuo template): per ogni giorno ci sono 4 fasce (mattina, pomeriggio, tardo pomeriggio, sera). In ogni fascia ogni batteria ha un livello da 0 a 3. A questo si aggiunge un totale giornaliero per batteria.
2. **Regola di inserimento**: un'attività entra in una fascia solo se, per ogni batteria, il suo costo non supera il livello della fascia e il totale del giorno resta sotto il limite.
3. **Come si configura il ritmo**: scegli una batteria e colori la griglia con un pennello, come in un'app di disegno. Il comando «copia lunedì su mar–ven» ti risparmia di ricolorare i giorni simili.

## Il bottone «Proponi settimana»

1. Mette prima gli impegni a orario fisso.
2. Ordina gli altri: prima quelli con la scadenza più vicina, poi quelli più costosi, così le attività più pesanti trovano posto per prime.
3. Mette ognuno nella fascia dove restano più batterie libere, rispettando i giorni preferiti e i cuscinetti.
4. Distribuisce il carico: al massimo 1 attività emotiva o sociale pesante al giorno (il numero si può cambiare) e aree di vita alternate.
5. Le attività che non trovano posto vanno nella lista **«Non ci sta»** con il motivo, per esempio «gio–ven: batteria fisica finita».

La proposta compare come carte tratteggiate. Puoi accettarle tutte, accettarne una alla volta o spostarle trascinandole. Un lucchetto blocca una carta, così resta dov'è quando chiedi una nuova proposta. Ogni carta mostra «perché qui» in una riga. A parità di dati, la proposta è sempre la stessa: niente sorprese.

```svg
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="13">
  <text x="20" y="32" font-size="17" font-weight="bold" fill="var(--fg)">Settimana 9–13 nov</text>
  <rect x="690" y="10" width="194" height="34" rx="17" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <text x="787" y="32" text-anchor="middle" fill="var(--accent)" font-weight="bold">Proponi settimana</text>

  <rect x="20" y="55" width="145" height="325" rx="10" fill="none" stroke="var(--border)"/>
  <text x="32" y="78" font-weight="bold" fill="var(--fg)">Da pianificare</text>
  <rect x="30" y="90" width="125" height="38" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <rect x="30" y="90" width="5" height="38" fill="var(--c4)"/>
  <text x="42" y="114" fill="var(--fg)">Spesa grande</text>
  <rect x="30" y="136" width="125" height="38" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <rect x="30" y="136" width="5" height="38" fill="var(--c4)"/>
  <text x="42" y="160" fill="var(--fg)">Sistemare armadio</text>
  <text x="32" y="215" font-weight="bold" fill="var(--fg)">Non ci sta</text>
  <rect x="30" y="226" width="125" height="52" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <rect x="30" y="226" width="5" height="52" fill="var(--c3)"/>
  <text x="42" y="248" fill="var(--fg)">Palestra</text>
  <text x="42" y="266" font-size="11" fill="var(--muted)">fisica finita gio–ven</text>

  <g font-size="11" fill="var(--muted)">
    <text x="175" y="130">Mattina</text>
    <text x="175" y="200">Pomeriggio</text>
    <text x="175" y="270">Tardo pom.</text>
    <text x="175" y="340">Sera</text>
  </g>

  <g font-weight="bold" fill="var(--fg)">
    <text x="244" y="68">Lun 9</text><text x="374" y="68">Mar 10</text><text x="504" y="68">Mer 11</text><text x="634" y="68">Gio 12</text><text x="764" y="68">Ven 13</text>
  </g>

  <g>
    <rect x="240" y="76" width="22" height="6" fill="var(--border)"/><rect x="240" y="76" width="8" height="6" fill="var(--c1)"/>
    <rect x="265" y="76" width="22" height="6" fill="var(--border)"/><rect x="265" y="76" width="14" height="6" fill="var(--c2)"/>
    <rect x="290" y="76" width="22" height="6" fill="var(--border)"/><rect x="290" y="76" width="18" height="6" fill="var(--c3)"/>
    <rect x="315" y="76" width="22" height="6" fill="var(--border)"/><rect x="315" y="76" width="20" height="6" fill="var(--c4)"/>
    <rect x="340" y="76" width="22" height="6" fill="var(--border)"/><rect x="340" y="76" width="16" height="6" fill="var(--c5)"/>

    <rect x="370" y="76" width="22" height="6" fill="var(--border)"/><rect x="370" y="76" width="18" height="6" fill="var(--c1)"/>
    <rect x="395" y="76" width="22" height="6" fill="var(--border)"/><rect x="395" y="76" width="10" height="6" fill="var(--c2)"/>
    <rect x="420" y="76" width="22" height="6" fill="var(--border)"/><rect x="420" y="76" width="6" height="6" fill="var(--c3)"/>
    <rect x="445" y="76" width="22" height="6" fill="var(--border)"/><rect x="445" y="76" width="12" height="6" fill="var(--c4)"/>
    <rect x="470" y="76" width="22" height="6" fill="var(--border)"/><rect x="470" y="76" width="20" height="6" fill="var(--c5)"/>

    <rect x="500" y="76" width="22" height="6" fill="var(--border)"/><rect x="500" y="76" width="12" height="6" fill="var(--c1)"/>
    <rect x="525" y="76" width="22" height="6" fill="var(--border)"/><rect x="525" y="76" width="20" height="6" fill="var(--c2)"/>
    <rect x="550" y="76" width="22" height="6" fill="var(--border)"/><rect x="550" y="76" width="14" height="6" fill="var(--c3)"/>
    <rect x="575" y="76" width="22" height="6" fill="var(--border)"/><rect x="575" y="76" width="18" height="6" fill="var(--c4)"/>
    <rect x="600" y="76" width="22" height="6" fill="var(--border)"/><rect x="600" y="76" width="4" height="6" fill="var(--c5)"/>

    <rect x="630" y="76" width="22" height="6" fill="var(--border)"/><rect x="630" y="76" width="20" height="6" fill="var(--c1)"/>
    <rect x="655" y="76" width="22" height="6" fill="var(--border)"/><rect x="655" y="76" width="6" height="6" fill="var(--c2)"/>
    <rect x="680" y="76" width="22" height="6" fill="var(--border)"/><rect x="680" y="76" width="8" height="6" fill="var(--c3)"/>
    <rect x="705" y="76" width="22" height="6" fill="var(--border)"/><rect x="705" y="76" width="10" height="6" fill="var(--c4)"/>
    <rect x="730" y="76" width="22" height="6" fill="var(--border)"/><rect x="730" y="76" width="6" height="6" fill="var(--c5)"/>

    <rect x="760" y="76" width="22" height="6" fill="var(--border)"/><rect x="760" y="76" width="4" height="6" fill="var(--c1)"/>
    <rect x="785" y="76" width="22" height="6" fill="var(--border)"/><rect x="785" y="76" width="4" height="6" fill="var(--c2)"/>
    <rect x="810" y="76" width="22" height="6" fill="var(--border)"/><rect x="810" y="76" width="10" height="6" fill="var(--c3)"/>
    <rect x="835" y="76" width="22" height="6" fill="var(--border)"/><rect x="835" y="76" width="6" height="6" fill="var(--c4)"/>
    <rect x="860" y="76" width="22" height="6" fill="var(--border)"/><rect x="860" y="76" width="12" height="6" fill="var(--c5)"/>
  </g>

  <g fill="none" stroke="var(--border)">
    <rect x="240" y="95" width="124" height="62" rx="8"/><rect x="370" y="95" width="124" height="62" rx="8"/><rect x="500" y="95" width="124" height="62" rx="8"/><rect x="630" y="95" width="124" height="62" rx="8"/>
    <rect x="240" y="165" width="124" height="62" rx="8"/><rect x="370" y="165" width="124" height="62" rx="8"/><rect x="500" y="165" width="124" height="62" rx="8"/><rect x="630" y="165" width="124" height="62" rx="8"/><rect x="760" y="165" width="124" height="62" rx="8"/>
    <rect x="240" y="235" width="124" height="62" rx="8"/><rect x="370" y="235" width="124" height="62" rx="8"/><rect x="500" y="235" width="124" height="62" rx="8"/><rect x="630" y="235" width="124" height="62" rx="8"/><rect x="760" y="235" width="124" height="62" rx="8"/>
    <rect x="240" y="305" width="124" height="62" rx="8"/><rect x="370" y="305" width="124" height="62" rx="8"/><rect x="500" y="305" width="124" height="62" rx="8"/><rect x="630" y="305" width="124" height="62" rx="8"/><rect x="760" y="305" width="124" height="62" rx="8"/>
  </g>
  <rect x="760" y="95" width="124" height="62" rx="8" fill="var(--muted)" fill-opacity="0.12" stroke="var(--border)"/>
  <text x="822" y="131" text-anchor="middle" font-size="11" fill="var(--muted)">energia bassa</text>

  <rect x="246" y="103" width="112" height="46" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <rect x="246" y="103" width="5" height="46" fill="var(--c1)"/>
  <text x="258" y="122" fill="var(--fg)">Report Q4</text>
  <text x="258" y="140" font-size="11" fill="var(--muted)">mentale ●●●</text>

  <rect x="376" y="173" width="112" height="46" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <rect x="376" y="173" width="5" height="46" fill="var(--c3)"/>
  <text x="388" y="192" fill="var(--fg)">Medico</text>
  <text x="388" y="210" font-size="11" fill="var(--muted)">orario fisso 15:00</text>

  <rect x="246" y="313" width="112" height="46" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-dasharray="5 4"/>
  <rect x="246" y="313" width="5" height="46" fill="var(--c2)"/>
  <text x="258" y="332" fill="var(--fg)">Chiamare mamma</text>
  <text x="258" y="350" font-size="11" fill="var(--muted)">emotiva libera</text>

  <rect x="506" y="103" width="112" height="46" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-dasharray="5 4"/>
  <rect x="506" y="103" width="5" height="46" fill="var(--c4)"/>
  <text x="518" y="122" fill="var(--fg)">Bollette</text>
  <text x="518" y="140" font-size="11" fill="var(--muted)">scade mer</text>

  <rect x="636" y="313" width="112" height="46" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-dasharray="5 4"/>
  <rect x="636" y="313" width="5" height="46" fill="var(--c5)"/>
  <text x="648" y="332" fill="var(--fg)">Cena con Giulia</text>
  <text x="648" y="350" font-size="11" fill="var(--muted)">sociale piena gio</text>

  <text x="20" y="405" font-size="12" fill="var(--muted)">Bordo tratteggiato = proposta · bordo pieno = confermato · barrette sotto i giorni = batterie rimaste (mentale, emotiva, sociale, sensoriale, fisica)</text>
</svg>
```

## Le 5 schermate

1. **Settimana**: la vista principale, quella del disegno qui sopra.
2. **Oggi**: mostra solo «Adesso» e «Dopo», in grande, senza altro intorno.
3. **Nuova attività**: si crea in circa 10 secondi. Inserisci titolo, area, durata e 5 cursori con le icone delle batterie. I modelli salvati (per esempio «Telefonata medico») compilano i campi al posto tuo.
4. **Il mio ritmo**: la griglia da colorare con il pennello.
5. **Check-in del mattino**: scegli tra 3 faccine per dire come stai. L'energia di oggi si adatta e la proposta si ricalcola.

Scelte visive:
- Colore e icona sempre insieme, mai solo il colore.
- Poco testo.
- Niente rosso da «fallimento»: «Non ci sta» usa toni neutri.
- Nessuna animazione brusca e nessuna notifica insistente.

## Tecnica

- **Desktop**: Tauri 2 + Svelte + TypeScript. È la struttura che l'`AGENTS.md` della cartella dà per scontata, con versioni e `versioni.txt`.
- **Dati**: file JSON in locale. Funziona offline, senza account. Esportazione per il backup.
- **Pianificatore**: un modulo TypeScript separato, con test. È la parte delicata.

## Le fasi

| Fase | Cosa vedi funzionare alla fine | Tempo indicativo del mio lavoro |
|---|---|---|
| 1 | Crei attività ed etichetti aree, batterie e vincoli | ~1 h |
| 2 | «Il mio ritmo»: colori il template della settimana | ~1 h |
| 3 | Vista Settimana + «Proponi settimana» funzionante | ~2–3 h |
| 4 | Vista Oggi + check-in + «giorno no» | ~1 h |
| 5 | Versione Android (facoltativa) | da valutare |

## 4 decisioni (il default è tra parentesi)

1. **Piattaforma**: prima il PC Windows, Android dopo? (sì)
2. **Precisione**: 4 fasce al giorno o slot da 30 minuti? (4 fasce; orario preciso solo per gli impegni fissi)
3. **Batterie**: vanno bene le 5 proposte? (sì, e si possono rinominare)
4. **Google Calendar**: importare gli impegni da lì? (no, per ora)

Se preferisci decidere punto per punto con delle note, posso trasformare questo piano in una pagina HTML di revisione.

**Prossimo passo:** rispondi «ok default» oppure scrivi, per esempio, «2: slot da 30 minuti». Poi parto con la Fase 1.
