---
target: stile Tern
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Benedetta Scattolin\\Documents\\_MyStuff\\PROGETTI\\Skills&Plugins\\Tools\\priority-planner\\src\\styles\\tern.css"
target_fingerprint: "sha256:74b3a57f4a84a27e8e4596d87507e8845935aaf485e1f5901af343628a7dd6ce"
target_path: "C:\\Users\\Benedetta Scattolin\\Documents\\_MyStuff\\PROGETTI\\Skills&Plugins\\Tools\\priority-planner\\src\\styles\\tern.css"
timestamp: 2026-11-28T01-39-06Z
slug: src-styles-tern-css
---
# Critique: Tern style (src/styles/tern.css), before fixes of 0.9.2

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Today chip and ring present; past-day dimming weakens already faint slots |
| 2 | Match System / Real World | 3 | Italian domain verbs; "Si ripetono", "Ritmo" slightly jargon |
| 3 | User Control and Freedom | 3 | Esc closes dialogs; no undo |
| 4 | Consistency and Standards | 2 | Left/right size mismatch; native controls beside Tern controls |
| 5 | Error Prevention | 3 | Planner rules guard overload |
| 6 | Recognition vs Recall | 2 | Icon-only area filter; cost dots without key in list |
| 7 | Flexibility and Efficiency | 3 | Series, models, copy day; no shortcuts |
| 8 | Aesthetic and Minimalist Design | 2 | Invisible chrome plus 40 px controls |
| 9 | Error Recovery | 3 | Not stress-tested |
| 10 | Help and Documentation | 2 | Help only in Ritmo footer |
| Total | | 26/40 | Acceptable |

## Priority issues
- [P1] Borders and fills 1.05–1.35:1 in both themes (slots, cards, control rings). Fix: raise --tn-l1..l4 and --tn-lane for tablet use.
- [P1] Controls 40 px / 13.5 px vs Tern 28–32 px / 12.5 px. Fix: 32 px visible, 44 px invisible touch area on coarse pointers.
- [P1] Weekend lanes differ in fill and header height; tray and list paddings misaligned. Fix: same lane fill, fixed day-head height, serie rows indented by checkbox width.
- [P2] Ritmo level fill too saturated; labels low contrast on level 3.
- [P2] Nuova dialog too long (about 40 controls); Today card lacks Tern card structure.

## Minor
- Phone: list costs overlap due date. Version mono in bar is noise. Oggi empty state has no next step.
