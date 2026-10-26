// Precompute Likely wanted for every generation: full pool, Petra off, Ava off, both off.
// Usage: node tools/build_likely.js   (rerun after any heroes.json change; writes data/likely.json)
const fs = require('fs'), path = require('path');
const C = require('../calc.js'), data = require('../data/heroes.json');
const maxGen = Math.max(...data.leaders.map(l => l.gen));
const out = { built: new Date().toISOString().slice(0, 10), gens: {} };
for (let g = 1; g <= maxGen; g++) {
  out.gens[g] = {};
  for (const [name, without] of [['all', []], ['noPetra', ['Petra']], ['noAva', ['Ava']], ['noAvaPetra', ['Ava', 'Petra']]]) {
    const r = C.likelyWanted(data, g, without);
    out.gens[g][name] = { teams: r.teams, byHero: r.byHero };
  }
}
fs.writeFileSync(path.join(__dirname, '../data/likely.json'), JSON.stringify(out) + '\n');
console.log('wrote data/likely.json for Gens 1-' + maxGen);
