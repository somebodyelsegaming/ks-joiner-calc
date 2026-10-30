const test = require('node:test');
const assert = require('node:assert');
const C = require('../calc.js');
const data = require('../data/heroes.json');

const pvp3 = { mode: 'pvp', troopTypes: 3 };
const lead = ['Diego', 'Ava', 'Luna'];
const near = (a, b) => Math.abs(a - b) < 0.001;

test('leader groups for Diego/Ava/Luna match the hand-worked case', () => {
  const g = C.leaderGroups(data, lead, pvp3);
  assert.deepStrictEqual(g, { '101': 50, '102': 25, '301': 25, '112': 15, '113': 10 });
});

test('best 4 without Petra and Vivian matches tools/rank_joiners.py (x2.157)', () => {
  const d = { ...data, joiners: data.joiners.filter(j => !['Petra', 'Vivian'].includes(j.hero)) };
  const best = C.bestLineups(d, lead, pvp3, 4, 1)[0];
  assert.ok(near(best.value, 2.157), best.value);
});

test('Chenko is worth x1.167 with this leader (101 already at 50%)', () => {
  const chenko = C.singlePicks(data, lead, pvp3).find(r => r.joiner.hero === 'Chenko');
  assert.ok(near(chenko.value, 1.1667), chenko.value);
});

test('Bear mode gives defense joiners no value', () => {
  const bear = { mode: 'bear', troopTypes: 3 };
  const gordon = C.singlePicks(data, lead, bear).find(r => r.joiner.hero === 'Gordon');
  assert.strictEqual(gordon.value, 1);
  for (const r of C.bestLineups(data, lead, bear, 4, 3)) {
    assert.ok(r.team.every(j => j.effects.some(e => data.groups[e.id].side === 'off')));
  }
});

test('Petra appears at most once, and never when the leader has her', () => {
  for (const r of C.bestLineups(data, lead, pvp3, 4, 20)) {
    assert.ok(r.team.filter(j => j.hero === 'Petra').length <= 1);
  }
  const withPetra = C.bestLineups(data, ['Petra', 'Amadeus', 'Diego'], pvp3, 4, 20);
  assert.ok(withPetra.every(r => r.team.every(j => j.hero !== 'Petra')));
});

test('Petra value by troop types: 3 = 43.75%, 2 = 37.5%', () => {
  assert.strictEqual(C.petraPct(3), 43.75);
  assert.strictEqual(C.petraPct(2), 37.5);
});

test('Thrud, Alcar, Amadeus and Vivian are never ranked as joiners', () => {
  assert.ok(C.pool(data, lead).every(j => !['Thrud', 'Alcar', 'Amadeus', 'Vivian'].includes(j.hero)));
});

test('Amadeus + 4 Chenkos adds +80%, not +100%', () => {
  const rows = C.crowding(25, 25, 4);
  assert.strictEqual(rows.length, 5);
  assert.deepStrictEqual([rows[0].n, rows[0].groupPct, rows[0].multiplier], [0, 25, 1.25]);
  assert.ok(near(rows[1].marginal, 1.2));
  assert.ok(near(rows[4].cumulative, 1.8));
  assert.strictEqual(rows[4].groupPct, 125);
});

test('row 0 for Diego/Ava/Luna lethality group names both leader skills (50%)', () => {
  const c = C.leaderContrib(data, lead, '101', pvp3);
  assert.deepStrictEqual(c.map(x => x.hero + ':' + x.skill), ['Diego:Cold Frost', 'Ava:Light and Cold']);
  assert.strictEqual(c.reduce((a, x) => a + x.pct, 0), 50);
});

test('crowd steps: 2 leader lethality skills are copies 1-2, joiners copies 3-6', () => {
  const steps = C.leaderContrib(data, lead, '101', pvp3).map(f => ({ label: f.hero, pct: f.pct, source: 'leader' }))
    .concat([1, 2, 3, 4].map(n => ({ label: 'Chenko ' + n, pct: 25, source: 'joiner' })));
  const r = C.crowdSteps(steps);
  assert.deepStrictEqual(r.map(x => x.groupPct), [25, 50, 75, 100, 125, 150]);
  assert.deepStrictEqual(r.map(x => Math.round(x.ofCard * 100)), [100, 80, 67, 57, 50, 44]);
  assert.ok(near(r[0].marginal * r[1].marginal, 1.5));       // leader team: x1.25 * x1.20 = +50%, not +45%
  assert.ok(near(r[5].sinceLeader, 2.5 / 1.5));               // 4 joiners on top: +66.7%
  assert.strictEqual(r[1].sinceLeader, null);
});

test('group summary: lethality has 2 leader copies, next Chenko is copy 3 at 67% of card', () => {
  const next = { '101': 25, '102': 25, '301': 25, '111': 20, '112': 25, '113': 25, '201': 20, '202': 20 };
  const s = C.groupSummary(data, lead, pvp3, next);
  const leth = s.find(r => r.id === '101'), fahd = s.find(r => r.id === '201');
  assert.deepStrictEqual([leth.from.length, leth.nextCopy, Math.round(leth.nextOfCard * 100)], [2, 3, 67]);
  assert.deepStrictEqual([fahd.from.length, fahd.nextCopy, Math.round(fahd.nextOfCard * 100)], [0, 1, 100]);
});

test('breakdown numbers each joiner as the right copy in its group', () => {
  const t = ['Chenko', 'Chenko'].map(h => data.joiners.find(j => j.hero === h));
  const rows = C.breakdown(data, lead, t, pvp3);
  assert.deepStrictEqual(rows.map(r => r.ids[0].copy), [3, 4]);
  assert.deepStrictEqual(rows.map(r => Math.round(r.ids[0].ofCard * 100)), [67, 57]);
});

test('a 3-copy leader team (Amadeus/Jabel/Saul) makes the next Chenko copy 4', () => {
  const n = C.leaderCounts(data, ['Amadeus', 'Jabel', 'Saul'], pvp3);
  assert.strictEqual(n['101'], 3);
});

test('team groups: lead team plus 2 Chenkos puts lethality at 100% (x2.00)', () => {
  const t = ['Chenko', 'Chenko'].map(h => data.joiners.find(j => j.hero === h));
  const g = C.teamGroups(data, lead, t, pvp3);
  assert.strictEqual(g['101'], 100);
  assert.ok(near(C.product(g) / C.product(C.leaderGroups(data, lead, pvp3)), C.teamValue(data, C.leaderGroups(data, lead, pvp3), t, pvp3)));
});

test('Leave out Petra removes her from best lineups and single picks', () => {
  const o = { ...pvp3, noPetra: true };
  assert.ok(C.bestLineups(data, lead, o, 4, 20).every(r => r.team.every(j => j.hero !== 'Petra')));
  assert.ok(C.singlePicks(data, lead, o).every(r => r.joiner.hero !== 'Petra'));
  assert.ok(C.singlePicks(data, lead, pvp3).some(r => r.joiner.hero === 'Petra'));
});

test('leader dropdowns split 9 infantry, 8 cavalry, 8 archer', () => {
  const n = c => data.leaders.filter(l => l.class === c).length;
  assert.deepStrictEqual([n('inf'), n('cav'), n('arc')], [9, 8, 8]);
  assert.deepStrictEqual(lead.map(h => data.leaders.find(l => l.hero === h).class), ['inf', 'cav', 'arc']);
});

test('every leader and joiner skill id is a known group or "other"', () => {
  const ok = id => id === 'other' || data.groups[id];
  for (const l of data.leaders) for (const s of l.skills) {
    for (const e of (s.effects || [{ id: s.id }])) assert.ok(ok(e.id), l.hero + ' ' + s.name);
  }
  for (const j of data.joiners) for (const e of (j.effects || [])) assert.ok(ok(e.id), j.hero);
});

test('breakdown names what each joiner overlaps (second Saul overlaps Diego and the first Saul)', () => {
  const o = { ...pvp3, noPetra: true };
  const team = ['Saul', 'Saul', 'Hilde', 'Howard'].map(h => data.joiners.find(j => j.hero === h));
  const rows = C.breakdown(data, lead, team, o);
  const sauls = rows.filter(r => r.joiner.hero === 'Saul');
  assert.deepStrictEqual(sauls[0].ids.find(e => e.id === '113').overlaps, ['Diego']);
  assert.deepStrictEqual(sauls[1].ids.find(e => e.id === '113').overlaps, ['Diego', 'Saul']);
});

test('rankNext: after Saul, Saul, Hilde the 4th slot is a tie at x1.20 (Howard, Quinn, Fahd, Eric...)', () => {
  const o = { ...pvp3, noPetra: true };
  const t = ['Saul', 'Saul', 'Hilde'].map(h => data.joiners.find(j => j.hero === h));
  const r = C.rankNext(data, lead, t, o);
  const ties = r.filter(x => near(x.value, 1.2)).map(x => x.joiner.hero);
  for (const h of ['Howard', 'Quinn', 'Fahd', 'Eric']) assert.ok(ties.includes(h), h);
  assert.ok(near(r[0].value, 1.2));
});

test("can't-get list: Bear Amadeus/Ava/Luna without Ava drops Ava and stays within 0.5% of x1.778", () => {
  const bear = { mode: 'bear', troopTypes: 3, noPetra: true };
  const L = ['Amadeus', 'Ava', 'Luna'];
  assert.ok(near(C.bestLineups(data, L, bear, 4, 1)[0].max, 1.906));
  const r = C.bestLineups(data, L, { ...bear, without: ['Ava'] }, 4, 1)[0];
  assert.ok(r.team.every(j => j.hero !== 'Ava'));
  assert.ok(near(r.max, 1.778) && r.value >= r.max * 0.995, r.value);
});

test('every lead hero has a widget marked rally or defend', () => {
  for (const l of data.leaders) {
    assert.ok(l.widget && ['rally', 'defend'].includes(l.widget.when) && l.widget.pct > 0, l.hero);
  }
  assert.strictEqual(data.leaders.find(l => l.hero === 'Wee & Woo').widget.when, 'defend');
  assert.strictEqual(data.leaders.find(l => l.hero === 'Luna').widget.when, 'rally');
});

test('Diego and Luna are in the joiner pool (Gen 8, matched by wording)', () => {
  const p = C.pool(data, lead, pvp3).map(j => j.hero);
  assert.ok(p.includes('Diego') && p.includes('Luna'));
});

test('likely wanted (PvP, up to Gen 7) counts the best four actually shown for 48 lead teams', () => {
  const r = C.likelyWanted(data, 7);
  assert.strictEqual(r.teams.length, 4 * 4 * 3);
  assert.ok(r.teams.some(t => t[1] === 'Petra'));
  assert.ok(r.rows.every(x => x.heroes.every(h => data.joiners.find(j => j.hero === h).gen <= 7)));
  const shown = r.teams.filter(t => C.bestLineups(data, t, { ...pvp3, liked: r.byHero }, 4, 1)[0].team.some(j => j.hero === 'Petra')).length;
  assert.strictEqual(r.byHero.Petra, shown / r.teams.length);
});

test('ties go to older heroes: Diego/Ava/Luna best four stays Saul, Saul, Hilde, Petra after Gen 8 joiners were added', () => {
  const best = C.bestLineups(data, lead, pvp3, 4, 1)[0];
  assert.deepStrictEqual(best.team.map(j => j.hero).sort(), ['Hilde', 'Petra', 'Saul', 'Saul']);
});

test('exact ties prefer fewer different heroes (Saul twice over Gordon + Diego)', () => {
  const r = C.bestLineups(data, lead, { ...pvp3, without: ['Petra'] }, 4, 2);
  assert.ok(near(r[0].value, r[1].value));
  assert.strictEqual(r[0].team.filter(j => j.hero === 'Saul').length, 2);
});

test('older heroes win exact ties: Amane over Luna for attack', () => {
  for (const L of [['Charles', 'Ava', 'Wee & Woo'], ['Triton', 'Sophia', 'Yang'], ['Diego', 'Liz', 'Yang']]) {
    const best = C.bestLineups(data, L, pvp3, 4, 1)[0].team.map(j => j.hero);
    assert.ok(!best.includes('Luna'), L.join('/') + ': ' + best);
    const next = C.rankNext(data, L, [], pvp3).map(r => r.joiner.hero);
    assert.ok(next.indexOf('Amane') < next.indexOf('Luna'), L.join('/'));
  }
});

test('good enough: Hero Roulette heroes count as owned, so Eric/Jabel/Luna can use Diego twice (fewer formations)', () => {
  const r = C.bestLineups(data, ['Eric', 'Jabel', 'Luna'], pvp3, 4, 1)[0];
  assert.strictEqual(r.team.filter(j => j.hero === 'Diego').length, 2);
  assert.ok(r.value >= r.max * 0.995);
});

test('Likely wanted breaks exact ties: the higher-scored hero wins', () => {
  const t = ['Saul', 'Saul', 'Hilde'].map(h => data.joiners.find(j => j.hero === h));
  const liked = { Fahd: 0.5, Howard: 0.1 };
  const r = C.bestLineups(data, lead, { ...pvp3, without: ['Petra'], liked }, 4, 1)[0];
  assert.ok(r.team.some(j => j.hero === 'Fahd') && !r.team.some(j => j.hero === 'Howard'), r.team.map(j => j.hero).join(','));
  const r2 = C.bestLineups(data, lead, { ...pvp3, without: ['Petra'], liked: { Fahd: 0.1, Howard: 0.5 } }, 4, 1)[0];
  assert.ok(r2.team.some(j => j.hero === 'Howard'));
});

test('Likely wanted follows the joiner pool: Petra off means no Petra row and 20% skills get picked', () => {
  const r = C.likelyWanted(data, 8, ['Petra']);
  assert.ok(!r.rows.some(x => x.heroes.includes('Petra')));
  assert.ok(r.rows.some(x => x.joiner.effects[0].pct === 20 && x.score > 0));
});

test('data/likely.json matches a fresh computation (rerun tools/build_likely.js after data changes)', () => {
  const saved = require('../data/likely.json');
  const live = C.likelyWanted(data, 8, ['Petra']);
  assert.deepStrictEqual(saved.gens[8].noPetra.byHero, live.byHero);
});

test('newest generation follows the gen picker: Gen 7 server treats Triton (Gen 6) as new, so Hilde fills the slot', () => {
  const o = { ...pvp3, maxGen: 7 };
  const page = C.bestLineups(data, ['Amadeus', 'Jabel', 'Jaeger'], o, 4, 1)[0].team.map(j => j.hero);
  assert.ok(page.includes('Hilde') && !page.includes('Triton'), page.join(','));
  // Every Gen 7 lead team: the page (full data + maxGen) must match the data filtered to Gen 7 (what tools/build_likely.js uses).
  const d7 = { ...data, joiners: data.joiners.filter(j => j.gen <= 7) };
  const by = c => data.leaders.filter(l => l.class === c && l.gen <= 7).map(l => l.hero);
  const names = r => r.team.map(j => j.hero).join(',');
  for (const i of by('inf')) for (const c of by('cav')) for (const a of by('arc')) {
    assert.strictEqual(names(C.bestLineups(data, [i, c, a], o, 4, 1)[0]), names(C.bestLineups(d7, [i, c, a], pvp3, 4, 1)[0]), [i, c, a].join('/'));
  }
});

test('Petra is her own group (Sloth + Frakinator): she never crowds lethality, and Bear counts 9 rounds of 10', () => {
  const t = ['Petra', 'Chenko'].map(h => data.joiners.find(j => j.hero === h));
  const rows = C.breakdown(data, lead, t, pvp3);
  assert.ok(near(rows.find(r => r.joiner.hero === 'Petra').value, 1.4375));   // open group, full 43.75%
  assert.ok(near(rows.find(r => r.joiner.hero === 'Chenko').value, 1.1667));  // same as alone: 101 still at 50%
  assert.deepStrictEqual(C.effectsOf(t[0], { mode: 'bear', troopTypes: 3 }, data), [{ id: '104', pct: 39.375 }]);
  assert.deepStrictEqual(C.effectsOf(t[0], pvp3, data), [{ id: '104', pct: 43.75 }]);
});

test("Rosa's Chaos Gambit counts as 20% lethality when she leads (tested stacking lethality code)", () => {
  assert.strictEqual(C.leaderGroups(data, ['Amadeus', 'Petra', 'Rosa'], pvp3)['101'], 45);
});

test('page stays single column (SE, 2026-10-25)', () => {
  const html = require('fs').readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
  assert.ok(!/class="layout"|class="col"/.test(html));
  assert.ok(!/\.wrap[^}]*grid-template-columns/.test(html));
});
