// Which joiners show up most in the best-4 across every possible lead team?
// Usage: node tools/shortlist.js [minGen] [extra,lead,heroes]
//   minGen limits lead heroes to that generation or newer; extras are added regardless of gen (e.g. Petra).
const C = require('../calc.js'), data = require('../data/heroes.json');
const minGen = Number(process.argv[2] || 1);
const EPIC = ['Chenko', 'Yeonwoo', 'Amane', 'Gordon', 'Howard', 'Quinn', 'Fahd'];
const extra = (process.argv[3] || '').split(',').filter(Boolean);
const by = c => data.leaders.filter(l => l.class === c && (l.gen >= minGen || extra.includes(l.hero))).map(l => l.hero);
function run(label, opts, filter) {
  const d = filter ? { ...data, joiners: data.joiners.filter(filter) } : data;
  const count = {}, sum = {}; let teams = 0;
  for (const i of by('inf')) for (const c of by('cav')) for (const a of by('arc')) {
    teams++;
    const best = C.bestLineups(d, [i, c, a], opts, 4, 1)[0];
    for (const j of new Set(best.team.map(t => t.hero))) count[j] = (count[j] || 0) + 1;
    for (const r of C.singlePicks(d, [i, c, a], opts)) sum[r.joiner.hero] = (sum[r.joiner.hero] || 0) + r.value;
  }
  console.log(`\n== ${label} (${teams} lead teams, lead heroes Gen ${minGen}+${extra.length ? ' plus ' + extra.join(', ') : ''})`);
  Object.keys(sum).sort((x, y) => (count[y] || 0) - (count[x] || 0) || sum[y] - sum[x]).forEach(h =>
    console.log(`  ${h.padEnd(10)} in best 4 for ${String(Math.round(100 * (count[h] || 0) / teams)).padStart(3)}% of teams   avg alone +${((sum[h] / teams - 1) * 100).toFixed(1)}%`));
}
const pvp = { mode: 'pvp', troopTypes: 3 };
run('PvP, all joiners, no Petra', { ...pvp, noPetra: true });
run('PvP, all joiners, Petra allowed', pvp);
run('PvP, epic joiners only', pvp, j => EPIC.includes(j.hero) || j.exclude);
