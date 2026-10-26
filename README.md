# Kingshot Rally Joiner Calculator

Pick the lead heroes for a rally or garrison. The page shows which four
joiners add the most, and why.

Same lead heroes, same best joiners. Your own stats cancel out, because a
joiner's value is a ratio: the skill total after it joins, divided by the
total before.

## Running it

Live at **https://somebodyelsegaming.github.io/ks-joiner-calc/**

No build step, no backend. It is plain HTML and JavaScript plus two JSON
files; the only outside link is a Google Fonts stylesheet. Serve the folder
from any static host. Opening `index.html` straight from disk does not work,
because browsers block a local page from reading the data files.

```
python3 -m http.server      # then open http://localhost:8000/
```

## Layout

```
index.html              the page
calc.js                 the joiner math (pure functions, no DOM)
data/heroes.json        heroes, skills, skill groups, widgets
data/likely.json        precomputed "Likely wanted" lookup
tools/build_likely.js   rebuilds data/likely.json after heroes.json changes
tools/*.py              battle sims used to check the model
tests/calc.test.js      node --test tests/
ISA.md                  why it's built this way: decisions, assumptions, open work
```

## The model

```
Rally power = Stats × Buffs × Skills
```

- **Stats:** the lead's Attack, Lethality, Defense and Health %, plus the lead
  hero's own base stats.
- **Buffs:** pets, castle appointments, city buffs, widgets.
- **Skills:** the lead team's skills plus the first skill of each of the
  first four joiners. Same skill group adds; different groups multiply.

Joiner skills are assumed to be level 5.

## Sources

Formula and skill groups come from Frakinator (Theory-crafting tab),
KingshotOptimizer.com, kingshotguides.com, kingshotjoinercalculator.netlify.app,
kingshotcalculator.com and kingshotdata.com. `ISA.md` lists how much weight
each one gets.

Not affiliated with Kingshot or Century Games.
