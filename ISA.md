---
project: ks-joiner-calc
phase: climbing
substance: moderate
---

# ISA — Kingshot joiner calculator

SE = somebodyelsegaming, the maintainer.

## Problem

Picking rally joiners in Kingshot is guesswork for most players. Tier lists rank heroes in a vacuum, but a joiner's real value depends on which skill groups the rally leader's heroes already fill. Players also believe things the math does not support, such as "a weaker player should debuff the stronger one" or "a 25% skill always beats a 20% one." Existing tools stop at Gen 5 to 7.

## Vision

A player enters their rally leader's three heroes, ticks PvP or Bear, and sees the best four joiners with a plain reason for each ("fills an empty group"). A short explainer shows the three layers, so they also know what to work on in their own stats.

## Out of Scope (v1)

- Full battle simulation (Frakinator does this)
- Accounts, saving, sharing links
- Hero skills other than the joiner's first expedition skill, and the leader's three expedition skills
- Troop tiers and base troop stats

## Principles

- **Data, not code.** Every hero skill is one record in `data/heroes.json`, with its source and a confidence level. New generations are data edits.
- **Show the confidence.** Any result that leans on a low-confidence skill id is marked in the output.
- **Plain HTML/CSS/JS, no build step**, same as duc-like. Logic in plain functions, tested with `node --test`.
- **Done means tested and reported.** Every claim closes on evidence.

## The model (three layers)

```
Final power = Layer 1 (stats) × Layer 2 (specials) × Layer 3 (skills)
```

1. **Stats** (gear, research, charms, hero stats): points add into one %. Factor = (1+Atk%)(1+Leth%), and (1+Def%)(1+HP%). Advice: raise the smaller of each pair.
2. **Specials** (widgets, pets, city buffs, appointments): same stat adds, then multiplies layer 1. Enemy-down specials divide the opponent's stat.
3. **Skills** (leader + 4 joiners): same skill id adds, different ids multiply. SkillMod = (DamageUp × OppDefenseDown) / (OppDamageDown × DefenseUp).

Key results: the gap between your stats and the enemy's never changes joiner choice (everything is a ratio). A skill's value = (group total after) ÷ (group total before). In PvP, offense and defense count about equally. In Bear, only the offense side counts.

## Sources and weight

| Weight | Source | Why |
|---|---|---|
| 1 (highest) | Frakinator (frakinator.streamlit.app, Theory-crafting tab) | Sims checked against battle reports |
| 1 | Sloth (KingshotOptimizer.com and its YouTube tier-list videos) | SE trusts it; tested with Frak |
| 1 | Daryl (kingshotguides.com writer) | SE trusts it; formula and skill ids |
| 2 | kingshotjoinercalculator.netlify.app, kingshotcalculator.com | Formula agrees with tier 1; Gen 6-7 ids |
| 2 | kingshotdata.com | Skill wording for Gen 7-8, no ids |
| 3 | kingshothandbook.com | Formula right, explanations often wrong |

## Features

- [ ] ISC-1: Leader picker: choose 3 heroes; their skills fill the groups. Anti: a leader skill silently ignored.
- [x] ISC-2: PvP / Bear toggle. Bear drops every defense-side effect. Anti: a defense joiner recommended for Bear.
- [ ] ISC-3: Troop-type-dependent joiners (Petra, Thrud, Alcar) are marked "situational" with a one-line note, not given a formation input. Petra's value assumes all 3 troop types are sent. Anti: Thrud or Petra shown as a plain top pick with no note.
- [x] ISC-4: Best-4 search over the joiner pool, with Petra limited to one and removed if the leader has her. Output matches `tools/rank_joiners.py` on the Diego/Ava/Luna case. (Closed 2026-10-25: `node --test tests/` 9/9 pass, incl. x2.157 match, Petra once, Bear drops defense.)
- [ ] ISC-5: Each recommended joiner shows its after ÷ before value and the group it lands in.
- [ ] ISC-6: Results that depend on a low-confidence id are flagged.
- [ ] ISC-7: Three-layer explainer as static text, including "raise your smaller stat with gear and research; joiners can't fix it." No radio buttons in v1.
- [ ] ISC-8: A worked example: 1,500% vs 4,000%, showing ×1.25 on you equals ÷1.25 on them.

## Decisions

- 2026-10-25: Folder `~/code/gaming/ks-joiner-calc`, local git, no remote yet.
- 2026-10-25: Frakinator, Sloth (KingshotOptimizer) and Daryl (kingshotguides) outrank the other sources when they conflict.
- 2026-10-25: The rally caller's Atk vs Leth (or Def vs HP) gap does not change joiner picks. Joiner skills multiply after stats are set (Sloth video: 125×200 = 100×250). So no stat inputs. Kept simple: inputs are the 3 leader heroes and PvP/Bear only. Formation only touches Petra, Thrud and Alcar, so they get a situational note instead of a formation input. (Proposed by the AI assistant after SE asked to keep it simple; confirm.)

- 2026-10-25 (SE, v1 review): leader dropdowns are one per troop class (infantry, cavalry, archer). The crowding table starts at row 0 = what the rally or garrison leader team already brings in the chosen group, then rows 1-4 = each added joiner (max 4). Shipped in v2.

- 2026-10-25: Eric is Gen 3 Legendary (= mythic) per kingshotdata.com/heroes/eric; the Handbook's "Gen 2 epic" was wrong. Epic joiners: Chenko, Yeonwoo, Amane, Gordon, Howard, Quinn, Fahd.

- 2026-10-25 (SE): enemy attack down (Eric, 202) and enemy lethality down (Charles) are separate groups unless a source says they share an id. Only the tier-2 joiner calculator says 202 for Charles; Sloth treats it as its own skill. Charles now uses placeholder id "203?".

- 2026-10-25 (SE): Amadeus removed from the joiner pool; Chenko and Yeonwoo cover the same group. Still available as a lead hero.

- 2026-10-25 (SE): "every joiner" table groups joiners by what they bring (same groups and %), e.g. Chenko and Yeonwoo on one row. Vivian removed from the joiner pool (about 20% where 25% options exist).

- 2026-10-25 (SE: "has Howard listed but no Howard is on the team"): lead-team table shows only the lead heroes' skills and group totals; the example-joiner columns were removed (that info lives in the joiner ability table).

- 2026-10-25 (SE): lead-team section gets a collapsible "All nine lead team skills" table: every expedition skill, what it does, and its group or "not shared with any joiner".

- 2026-10-25 (SE): lead-team section renamed "Where your lead team is crowded", with a Crowded / Open summary line above the table.

- 2026-10-25 (SE): crowded list is bulleted (group, count, %, which heroes); the group totals table is folded into a collapsible section.
- 2026-10-25 (SE: "Hilde's a second copy, but there's no other Hilde"): "copy" wording replaced by "overlaps <heroes>" / "open group". Best four rows are numbered picks, each with "Same value instead" and "Next best" ranked on top of the picks above it. The one-at-a-time table is renamed "First pick only" and says its numbers change after each pick. Finding: for Diego/Ava/Luna without Petra, slot 4 is a tie at +20% (Howard, Quinn, Fahd, Eric, Ava, Charles).
- 2026-10-25 (SE: "what if I can't get any extra Avas?"): "Next best" lists removed. Added "If you can't get one of these" (best lineup with each top-four hero removed) and "Joiners you can't get" tap-to-remove chips that recount the whole page. Bear Amadeus/Ava/Luna without Ava: Chenko, Chenko, Amane, Amane x1.778 (vs x1.906). 20/20 tests pass.
- 2026-10-25 (SE: "isn't that a direct overlap with close alternatives?"): "If you can't get one of these" table removed. Close alternatives plus the can't-get chips cover it.
- 2026-10-25 (SE): "Leave out Petra" checkbox removed; Petra is now one of the can't-get chips. "Joiners you can't get" is its own section below the controls, in a 4-column grid (16 chips, 4 rows). An old saved Petra setting carries over as Petra tapped off.
- 2026-10-25 (SE): "Joiners you can't get" renamed "Your joiner pool" (chips on = allowed, tap to turn off). "Where your lead team is crowded" is a collapsible section (collapsed by default, per SE) placed above the pool. Bear wording: "Bear is one-sided, so damage output is what matters."
- 2026-10-25 (SE): pool heading is "Shape your joiner pool". Vikings preview (not on the page yet): damage only, 1 troop type, all three lead heroes' skills counted. Top tie at x5.36: Amadeus or Helga / Ava / Saul, Luna or Wee & Woo, joiners Amane, Ava, Ava + Chenko or Amane. Open: do a hero's skills count when its troop type isn't sent?
- 2026-10-25 Vikings preview v2 (SE: all three heroes' skills apply; no Petra): widget Expedition skills from kingshotdata.com. Defender damage widgets: Atk +15% Zoe, Long Fei, Saul, Wee & Woo; Leth +15% Jabel, Margot, Sophia, Liz. Rally-only (no effect defending): Amadeus, Helga, Ava, Luna, Marlin, Rosa, Yang, Thrud. Result: Amadeus or Helga / Ava / Wee & Woo x5.81; Jabel or Margot in place of Ava x5.76 (tie); Zoe x5.66; Amadeus/Ava/Luna x5.36. Assumed: widget % is its own multiplier; archer hero ATK added to a 1,500% base.
- 2026-10-25 (SE: "so we don't have to pull it again"): every lead hero in heroes.json has a `widget` (expedition skill name, when = rally or defend, stat, 15% max; weapon name where known). Page shows a widget row per hero in "All lead team skills and widgets". Widgets are not in the joiner math yet.
- 2026-10-25 (SE: "why is Luna not listed? Diego?"): Diego (Def 15 + HP 10) and Luna (Atk 25) added as joiners, conf low (Gen 8 ids unpublished, matched by wording). Joiner pool chips grouped into Raise your damage / Lower damage you take / Weaken the enemy, each chip showing what it brings (e.g. "Atk 25"). Diego/Ava/Luna best four unchanged at x2.322 (ties now include Gordon + Diego).
- 2026-10-25 (SE): pool chips have no ? marks; grouped Hybrids / Straight 25% / 20% skills / Chance, damage-side first in each; Petra chip "Leth, chance *" with a one-copy footnote. New collapsible "Likely wanted in PvP" with a "Consider heroes up to Gen N" picker (default newest minus one = Gen 7). Method: lead teams from the two newest gens per class up to N (8 teams), joiners up to Gen N, ability counted when in any lineup within 1% of best, averaged over an all-heroes and an epic-only player (`epic: true` in heroes.json). High >= 67%, Medium >= 40%.
- 2026-10-25 (SE: "last 2-3 gens plus oddities like Petra and Ava"): Likely wanted now uses the three newest gens up to the picked one, plus heroes marked `alwaysLead` (Petra, Ava). Picker is "Newest generation on your server", default = newest in data (Gen 8). Gen 8: 36 teams; Attack 25% High 100%, Fahd High 85%, Gordon High 71%.
- 2026-10-25 (SE: "why has my best list changed?"): adding Diego as a joiner created an exact tie (Gordon + Diego = Saul + Saul) and the tie broke by list order. Ties now go to the lineup with older heroes (lower total gen), so Diego/Ava/Luna shows Saul, Saul, Hilde, Petra again (x2.322; no Petra: Howard, Saul, Saul, Hilde x2.157).
- 2026-10-25 (SE): Amadeus is also `alwaysLead`. Gen 8 window is now 48 teams: Fahd 85%, Attack 25% 83%, Gordon 78%, Howard/Quinn 68%. Not modeled: Amadeus's base stats fall behind newer heroes each gen (the math counts skills only).
- 2026-10-25 (SE): exact ties go to the lineup with fewer different heroes (fewer formations to save), then older heroes. Close alternatives mark "exact tie".
- 2026-10-25 (SE: "Amane should always win over Luna as a joiner for attack"): on an exact tie the older hero is listed first everywhere (best four, Same value instead), since more players have leveled them. A strictly higher value still wins.
- 2026-10-25 (SE: "don't let perfection get in the way of good enough... easily fulfilled by the masses"): the best four is the easiest lineup within 0.5% of the highest: fewest joiners from the two newest gens, then fewest different heroes, then value. The higher lineup shows in Close alternatives as "x% higher, harder to fill". Changes 323 of 576 teams by at most 0.5%. Diego/Ava/Luna unchanged.
- 2026-10-25 (SE: "most have been told to prioritize her"): Ava is a `staple` joiner and never counts as a newest-gen hero in the good-enough rule.
- 2026-10-25 (SE: "most are told to obtain any hero from the wheel"): Hero Roulette heroes marked `wheel` (Saul, Zoe, Petra, Rosa, Long Fei, Sophia, Wee & Woo, Diego; kingshotmastery.com Gen 8 guide, Gen 1-4 inferred from list order) and never count as newest-gen heroes in the good-enough rule.
- 2026-10-25 (SE: "shouldn't the most likely wanted be weighted more than others in its category?"): Likely wanted scores now order the pool chips inside each group and break exact ties in the best four (they never trade away value). Diego/Ava/Luna without Petra shows Fahd instead of Howard (exact tie, Fahd 85% vs Howard 61%).
- 2026-10-25 (SE: "likely wanted doesn't reflect what is actually chosen"): Likely wanted is now the share of the 48 lead teams whose shown best four (all tie-breakers) includes the ability. Epic-only averaging dropped. Two passes so the Likely wanted tie-break matches. Tiers: High >= 50%, Medium >= 20%, Low > 0, Rarely = 0. Gen 8: Ava 79%, Petra 75%, Hilde 54%, Saul 46%, Diego 23%, Amane 17%; about 1.1 s to compute (cached per gen).
- 2026-10-25 (SE: "just use the joiner pool enabling and disabling"): Likely wanted respects the joiner pool; turned-off heroes are left out (cached per gen + pool).
- 2026-10-25 (SE: "only needs to be generated once, then a static lookup?"): `tools/build_likely.js` writes `data/likely.json` (every gen: full pool, Petra off, Ava off, both off). The page reads it instantly; any other pool mix is computed live only when Likely wanted is open. Exact-tie scores fall back to the saved full-pool ones. Rerun the tool after any heroes.json change.
- 2026-10-25 (SE: "why are the hero cards changing positions?"): pool chip order now uses the saved full-pool scores, so chips stay put when heroes are toggled.
- 2026-10-25 (SE): joiner pool is a collapsible section (starts collapsed); its title shows which heroes are off, e.g. "(1 off: Petra)".
- 2026-10-25 (SE): First pick only is a collapsible section (starts collapsed).

- 2026-10-25 (SE): Likely wanted moved below Best four joiners. In "Why crowding a group costs you", the copies 1-7 table comes first ("not every copy counts the same"), then the per-group table for your lead team.

- 2026-10-25 (SE): group totals table hides groups that stay empty, renamed "How full each group gets", with a plain purpose line. Weaker-player section ends with "always pick the joiner with the largest relative increase". Copies table: "Real gain" column, intro explains nominal (on paper) vs relative.

- 2026-10-25 (SE): all "?" marks removed from the page; the joiner pool's best-guess note covers unconfirmed skill groups.

- 2026-10-25 (independent Opus + Sonnet review, SE's answers): fixed chip tap bug (sub-label); Petra explained as one 50% check per troop type (87.5% / 75%), second Petra = 98.4% for ~+5 points; chance skills other than Petra not wanted as joiners, lead chance skills "group unknown, not counted"; Charles assumed separate; best-guess note reworded; live crowding example replaces the fixed Gordon line; rule text says "two newest generations" and drops the 1% line; group ids hidden; bucket wording (same stat adds in a bucket, buckets multiply); debuff 80%/83% example; troop types hint; Likely wanted tiers, PvP/3 types, gen picker scope; exact-tie scores always from the saved lookup; formula box in three layers; assumed level 5 joiner skills.

- 2026-10-25 (SE): intro states "all things being equal, in PvP the same three lead heroes want the same four joiners, whatever their stats"; PvE (Bear) differs because only damage dealt counts.

- 2026-10-25 (v52 reviews + SE): generation picker moved to the top controls and now filters the joiner pool everywhere (joiners newer than it are left out), so tie-breaks and picks agree. Triton's lead skills reordered so Command of Power (Defense +25%, what the game shows as his joiner skill) is first. Lead chance skills other than Petra's not counted (wording). Bear hides joiners that add nothing in First pick. Uncounted lead skills labeled by reason (not a battle skill / chance or turn-based / some troop types only / group unknown). Pick explanation moved under the best four rows. Close alternatives collapse same-ability swaps (e.g. Amane/Margot/Luna). "Never" tier; +5.5 points; pool-reset message; dead code removed.

- 2026-10-25 (SE): formula box adds the PvP damage-dealt and damage-taken lines.

- 2026-10-25 (SE): intro cut to two short lines ("Same lead heroes, same best joiners"). "The three layers" renamed "The 3 components of rally power" and moved to the top, before the hero pickers.

- 2026-10-25 (SE): 3 components text simplified; stays collapsed.

- 2026-10-25 (SE): formula box in plain words; stats shown as pairs (Attack × Lethality), (Defense × Health), "raise the lower stat of each pair first". Layout widened to 1240px with two columns at 1000px+ (left: controls, crowded, pool; right: best four, Likely wanted, First pick); one column on phones in the same order.

- 2026-10-25 (SE: "I completely and totally hate the two column layout"): two-column layout removed; page is one column again (still up to 1240px wide). "Specials" renamed "Buffs (other multipliers)". Layout to be revisited.

- 2026-10-25 (SE: "I want a single column layout and keep it that way"): the page is single column, permanently. Two-column wrappers removed; a test guards it.

- 2026-10-26 (stat-gap sim, `tools/troop_sim.py`, estimate, not checked against battle reports): vs a 2.0M defense with 1,000-1,200 points more on every stat, total power needed to tie is about x4.7-9.4 at equal troops, x5.6-11.0 at 1.8M, x7.3-14.4 at 1.5M (lower end at 2,000% own stats, upper at 1,500%). Far beyond a best four (about x2.3). SE declined adding a "how big is the hill" section.

- 2026-10-26 (SE's summary, confirmed): power = lead's stats x buffs x rally skills (lead team's skills + first 4 joiners' first skills), times troop count. Hero base stats sit in stats; widgets sit in buffs. SE confirmed (keeping it simple): pets, castle appointments, purchased city buffs and widgets all go in the multiplicative buffs. Garrisons use the first 4 listed reinforcements as the 4 joiners; a few caveats exist, but it works about the same as a rally.

- 2026-10-26 (SE): published publicly at https://github.com/somebodyelsegaming/ks-joiner-calc, live on GitHub Pages at https://somebodyelsegaming.github.io/ks-joiner-calc/ (checked: page loads, data loads, best four renders). Layout matches pet-material-planner: page at the repo root, README, MIT LICENSE. Public `main` starts from one clean commit; the earlier history stays in the local-only branch `local-history`, which must never be pushed. Google Fonts kept, as in the pet planner.

- 2026-10-26 (SE): text wraps at the full page width (62ch/90ch caps removed). Troop types hint moved from the controls into the Petra note. The 0.5% window is relative to the best four's total multiplier: a lineup counts as "good enough" when its total is at least 99.5% of the highest (e.g. x2.110 best, so x2.0995 or more).

- 2026-10-26 (SE): generation picker moved above the lead dropdowns, and it now limits them too: lead heroes newer than the picked generation are hidden. A picked lead that becomes too new swaps to the newest allowed hero of that troop type. Raising the generation again keeps the current leads.

- 2026-10-26 (SE): compared against kingshotjoinercalculator.netlify.app (now "Kingshot Portal", calculator tab public; read from the rendered page only). Formula and 16 joiner values match. Every difference is already a decision here: Charles 202 vs our 203?, Vivian 25% vs 20% and left out, Petra counted at full 50% vs our expected value, Thrud and Alcar counted vs left out. Their Eric G2 and Margot G3 are wrong; SE confirmed Eric Gen 3, Margot Gen 4, as our data has. They stop at Gen 7 (no Diego or Luna). No data changes.

- 2026-10-27 (SE): page wording pass (commits 752391f, d0c2c94, both live). Vivian left out because how her skill works and its group are unclear (the "near 20%" line dropped). Thrud and Alcar left out because joiners are picked to work with any formation. Petra: her +50% is on or off, so a second Petra only adds chances (3 types 87.5% to 98.4%; 2 types 75% to 93.75%) and a regular joiner is usually the better slot. Chance skills: left out for steady results; Petra's 87.5% is close to always on. "3 components" box: stats set aside first, joiner worth worded as relative with the 3rd-lethality example (1.75 ÷ 1.50 = +16.7%), and a small stats example (Attack 5 × Lethality 3: +1 Attack 18, +1 Lethality 20). Not yet checked in a browser or on a phone.

- 2026-10-30 (review pass, SE's answers): every checkable claim matched a tier-1 source. Daryl (kingshotguides): same effect_op adds, different multiply (4 Amane = 2.0; 2 Amane + 2 Chenko = 2.25); debuffs divide (one Fahd = 1/1.2); only the first four joiners with a level-5 first skill count, a lower-level one gives up its slot to the next level-5 joiner. Sloth (kingshotoptimizer): Petra rolls per attack, ~87.5% per turn, no stacking (our 43.75% model stands; at 25% she would leave every best four). Fixed: `bestLineups` took "newest generation" from the data file, not the gen picker, so on a Gen 7 server 26 of 392 teams showed Triton as easy to fill (e.g. Amadeus/Jabel/Jaeger: now Saul, Hilde, Petra, Ava, matching likely.json); test added. Vivian stays out, but for the real reason: her card is a flat passive 25% (kingshotdata and Sloth's page; the old "needs a trigger, ~20%" line had no source and is gone), her group is disputed (Daryl 101, Sloth "its own code"), and SE saw mixed Bear results. Her lead skill now counts 25%, which moved Likely wanted on Gen 5-7 teams she leads. Sensitivity (48 Gen 8 teams): Vivian in 101 changes 0 picks; Vivian in her own group puts her in 48/48; Charles in 202 changes 0; turn-based lead skills at average value change 0; debuffs as ×(1−x) instead of ÷(1+x) change 48/48.

- 2026-10-30 (SE: Sloth and Frakinator's tested work outranks Daryl's lump): new group 104 "Enemy damage taken up" (offense side). Petra's Evil Eye and Vivian's Crouching Tiger move there from 101, so Petra no longer crowds lethality. Source: Sloth's video 9v_8VI9S6HM with Frak's engineered no-RNG battles: Petra 87.5% per turn, no stacking, "damage taken up skill code ... like Alcar or Vivian", inactive on turn 1; Rosa's Chaos Gambit coded as lethality and stacks. Modeled: group 104 is `inactiveFirstTurn`, so Bear (10 rounds) counts it at 9/10 (Petra 39.4%); PvP round count unknown, counted in full. Rosa's Chaos Gambit now counts 20% in 101 when she leads. Vivian stays out of the pool (stacking with Petra or a second Vivian untested; her Focus Fire overwrites Crouching Tiger on its trigger turn when she leads, not modeled). Effect: Diego/Ava/Luna keeps Saul, Saul, Hilde, Petra, x2.322 -> x2.584; 23/48 Gen 8 PvP lineups and 44/48 Bear lineups change in the non-Petra slots. 34/34 tests; headless render checked.
- 2026-10-30 (SE): page wording. One name for a joiner's gain: "Real gain" replaces "Really adds" and "Effect" ("Effective" avoided: Sloth uses it for a chance skill's average). Footnote trimmed: Charles paragraph, Vivian's test recipe and Petra's repeats cut. Kept at SE's request: joiners are picked for consistent, repeatable results, and the first four level-5 joiners count. Corrected: the page no longer says a lower-level joiner is never counted at a lower %. Sloth + Frak's Petra test used level-1 joiners and their skill counts rose, so a lower-level skill appears to work when no level-5 joiner takes the slot (inferred, not stated in the video).
- 2026-10-30 (SE): page bottom shows both dates. "Hero data updated" is the hand-set `updated` in heroes.json; "Page updated" is `document.lastModified`, which on GitHub Pages follows each deploy (checked: header 21:32:22 UTC, about a minute after the 15:31 MDT commit), so it needs no upkeep. It changes on every deploy, wording-only ones included.

## Assumptions

- Gen 8 skill ids are unpublished. Diego and Ava's lethality skills are assumed 101, Luna's attack skill 102, and Diego's Def/HP skill 112/113. Matched by wording.
- Every joiner's first skill is level 5 (hero 4-star or better) (SE, 2026-10-25).
- Chance and turn skills count at expected value (e.g. 50% chance of +50% = 25%).
- Offense and defense are worth the same in PvP (video says "roughly"). No round cap is modeled; none is known.
- Each hero generation has about 20% higher base stats than the one before (SE, 2026-10-25). Checked against kingshotdata.com 31-star Expedition ATK: 200, 240, 290, 370, 444, 540, 650, 780% for Gens 1-8, a step of 1.20 to 1.28 each gen. A hero's base stats boost only its own troop type, and a joiner's stats don't count at all, so this changes lead-team picks (e.g. Vikings, Amadeus aging out), not joiner picks.
- Base stats vs skills (estimate, 2026-10-25): a hero's stat % adds to that troop type's other bonuses (layer 1). With 1,500% other bonuses, a 1-gen gap is about x1.06 on that troop's attack and again on its defense; 4 gens x1.21; 7 gens (Amadeus vs Diego) x1.32. One extra open 25% skill is x1.25 on the whole army. Amadeus/Ava/Luna and Diego/Ava/Luna skills tie (x6.87 vs x6.88 with best 4), so Diego's stats decide it. Chance skills are left out of that comparison.
- Widgets never apply to solo marches (SE, 2026-10-25). Rally widgets need this hero leading a rally; defender widgets need defending or garrisoning.
- Troop count (the AI assistant sim, 2026-10-25, tools/kill_sim.py formula: kills = k·√(own)·√(smaller side)·Atk/Def, equal stats): the smaller side's damage scales about linearly, not by √. 1.8M vs 2.0M: offense wiped, defense keeps 28%; to tie it needs x1.08 on offense and defense (x1.17 total). 1.5M vs 2.0M: defense keeps 50%; tie needs x1.24 each (x1.54 total). Corrects the AI assistant's earlier "√ halves the gap" answer.
- "Enemy damage taken up" (Petra's Evil Eye, Vivian's Crouching Tiger) is its own group (104), separate from lethality, per Sloth and Frakinator's tests (2026-10-30). Daryl's page and the joiner calculator lump it into 101; they are outranked. Untested: whether Vivian adds on top of a Petra in the same rally, and whether two Vivians add. Vivian is kept out of the pool until that test (no Petra: 3 Chenko + Vivian vs 4 Chenko in Bear).
- Group 104 does nothing on turn 1 (Sloth). Bear is exactly 10 rounds, so it counts at 9/10 there. PvP battles have no known fixed length, so it counts in full; if PvP fights are short, Petra is worth less in PvP than shown.
- Debuffs divide by (1 + x): a −25% card leaves the enemy at 80%, the same as +25% for you. Daryl's formula (one Fahd = 1/1.2 = 0.833). If the game instead multiplied by (1 − x), a −25% card would be worth ×1.333 and every best four would change (48/48 Gen 8 teams).

## Remaining Work

- [x] REVIEW (SE): trusted creator is Sloth, who runs KingshotOptimizer and makes the videos (confirmed 2026-10-25).
- [ ] REVIEW (SE): confirm the keep-it-simple decision (no stat or formation inputs; situational notes instead).
- [ ] Test (highest value): does Vivian add to Petra, and does Vivian stack with herself? Bear, same lead and troops, no Petra: 4 Chenko vs 3 Chenko + Vivian (expect more damage: own group confirmed), then 2 Chenko + 2 Vivian, then 3 Chenko + Vivian with a Petra lead. Passing all three puts her in the pool.
- [ ] Test: does Charles's enemy lethality down share id 202 with Eric (joiner calculator says yes)? Eric + Charles in, then Charles swapped out. (Changes no best four either way; low priority.)
- [ ] Test: does Luna's enemy-attack-down share id 202 with Eric? A battle report with Eric in, then out.
- [x] Petra's trigger rate: one 50% check per troop type, 87.5% with 3 types (SE, 2026-10-25).
- [x] With archers only in Vikings, all three lead heroes' skills still apply (SE, 2026-10-25).
- [ ] Optional: final Opus + Sonnet review of the latest version.
- [ ] Find Gen 8 and 9 joiner ids (Liz and others).
- [x] Build v1 page: `index.html` + `calc.js` (moved from `app/` to the repo root on 2026-10-26), published privately at https://claude.ai/artifact/8YbDGKTNbp6cNCx164Ymdk (2026-10-25).
- [x] Fix from SE's v1 review: class-split dropdowns + row-0 crowding table (v2 published 2026-10-25; `node --test tests/` 11/11 pass).
- [x] Crowding table gains "Of its card" column (all groups) and "Enemy X left" column (debuff groups 201/202/301), per SE 2026-10-25 (v3).
- [x] Crowding table lists each leader skill as its own copy (1, 2, ...) with a leader-team subtotal, then joiner copies; per SE 2026-10-25 (v4, test 'crowd steps' passes).
- [x] v5 per SE ("site doesn't reflect this clearly"): leader section is a table of copies per group with next-copy number and % of card; best-4 and single-pick rows show copy # and % of card; crowding table's last column is Team total; utf-8 meta fixes garbled arrows. Rendered text checked in the test browser; 15/15 tests pass.
- [x] v6 per SE: crowding row 0 = the whole lead team (rally or garrison) with its copies listed; rows 1-4 = joiners with their copy number. Page wording says "lead team (rally or garrison)" throughout. Rendered table read back in the test browser; 15/15 tests pass.
- [x] v7 per SE: dropped every "% of card" column; crowding table shows Effect per row, row 0 = lead team's combined effect (+50% for two 25% copies, not 45%).
- [x] v8: row 0 lists each lead-team copy with its own effect (copy 1 +25%, copy 2 +20%, copy 3 +16.7%).
- [x] v9 per SE ("where is the effective total?"): lead-team table gains per-group effective totals (lead team alone, with best 4) and an "all groups combined" row (x2.96 -> x6.88 for Diego/Ava/Luna). 16/16 tests pass; read back from the rendered page.
- [x] v10 per SE: "Leave out Petra" checkbox removes her from the joiner pool (best 4 and single-pick table). Clicked in the test browser: x2.322 with Petra -> x2.157 without; 17/17 tests pass.
- [x] v11 per SE: "crowded group or a fresh one?" rule table plus the 100-damage example added to the crowding section.
- [x] v12 per SE: rule table replaced by copies 0-7 table for 25% and 20% skills (numbers recomputed).
- [x] Shortlist tool: `node tools/shortlist.js [minGen]` counts how often each joiner lands in the best 4 across every lead team (576 teams Gen 1+, 27 teams Gen 6+). Purpose: a short general PvP preset list, since players only have a few saved formations (SE 2026-10-25).
- [x] (Done 2026-10-25 as the Likely wanted section) Open question (SE): weight joiners by how common they are. The AI assistant proposal: an "Epic joiners only" toggle (Chenko, Yeonwoo, Amane, Gordon, Howard, Quinn, Fahd, Eric) instead of weighting the math.
- [ ] Wording pass on the live page (SE expects more wording to clarify and refine).
- [ ] Decide: knock turn 1 off Petra in PvP too (x0.9, as in Bear), or leave her at full. Unanswered 2026-10-30; she is at full in PvP now.
- [ ] Gen 9 data (about 6 weeks out, SE 2026-10-30): add leads and joiners to heroes.json, set its `updated` date by hand (it sat at 10-25 through the 10-30 data change), rerun `node tools/build_likely.js`, `node --test tests/`. Next session starts here or at the Vivian test.
- [ ] The private claude.ai artifact (v60) is stale since the 2026-10-26 public release; the GitHub page is the one to share.
- [ ] REVIEW (SE): look over the live page (https://somebodyelsegaming.github.io/ks-joiner-calc/) on the iPad; ISC-1, 3, 5, 6, 7, 8 stay open until then.
- [ ] Leader data for Gen 1-8 came from kingshotdata.com wording; chance and turn-based leader skills are left out of the groups (id 'other') until someone publishes their ids.
