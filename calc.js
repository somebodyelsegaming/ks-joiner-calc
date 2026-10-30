// Joiner math. Pure functions, no DOM. Used by index.html and tests/calc.test.js.
// Model: same skill id adds, different ids multiply. Value of a joiner =
// product of (1 + group%) after adding it, divided by the product before.
(function (root) {
  'use strict';

  function petraPct(troopTypes) {
    return 50 * (1 - Math.pow(0.5, troopTypes));
  }

  var BEAR_ROUNDS = 10;

  // A group marked inactiveFirstTurn (damage taken up) does nothing on turn 1, so in Bear it works 9 rounds of 10.
  function effectsOf(item, opts, data) {
    var list = item.effects || (item.id && item.id !== 'other' ? [{ id: item.id, pct: item.pct }] : []);
    return list.map(function (e) {
      var pct = item.petra ? petraPct(opts.troopTypes) : e.pct;
      if (data && data.groups[e.id] && data.groups[e.id].inactiveFirstTurn && opts.mode === 'bear') pct *= (BEAR_ROUNDS - 1) / BEAR_ROUNDS;
      return { id: e.id, pct: pct };
    });
  }

  function keep(data, id, opts) {
    if (!data.groups[id]) return false;
    return opts.mode !== 'bear' || data.groups[id].side === 'off';
  }

  // Groups the leader's three heroes already fill.
  function leaderGroups(data, names, opts) {
    var g = {};
    names.forEach(function (name) {
      var leader = data.leaders.find(function (l) { return l.hero === name; });
      if (!leader) return;
      leader.skills.forEach(function (s) {
        effectsOf(s, opts, data).forEach(function (e) {
          if (keep(data, e.id, opts)) g[e.id] = (g[e.id] || 0) + e.pct;
        });
      });
    });
    return g;
  }

  function addJoiner(data, g, joiner, opts) {
    var out = Object.assign({}, g);
    effectsOf(joiner, opts, data).forEach(function (e) {
      if (keep(data, e.id, opts)) out[e.id] = (out[e.id] || 0) + e.pct;
    });
    return out;
  }

  function product(g) {
    var p = 1;
    Object.keys(g).forEach(function (k) { p *= 1 + g[k] / 100; });
    return p;
  }

  // Joiners we rank: not excluded, not marked "can't get", and no Petra if the leader team has her.
  function pool(data, leaderNames, opts) {
    return data.joiners.filter(function (j) {
      if (j.exclude) return false;
      if (j.petra && opts && opts.noPetra) return false;
      if (opts && opts.without && opts.without.indexOf(j.hero) !== -1) return false;
      if (opts && opts.maxGen && j.gen > opts.maxGen) return false;
      if (j.unique && leaderNames.indexOf(j.hero) !== -1) return false;
      return true;
    });
  }

  function teamValue(data, base, team, opts) {
    var g = base;
    team.forEach(function (j) { g = addJoiner(data, g, j, opts); });
    return product(g) / product(base);
  }

  // Best lineups of `size` joiners. Repeats allowed, except unique heroes (Petra).
  function bestLineups(data, leaderNames, opts, size, top) {
    size = size || 4; top = top || 5;
    var base = leaderGroups(data, leaderNames, opts);
    var p = pool(data, leaderNames, opts);
    var results = [];
    function walk(start, team) {
      if (team.length === size) {
        results.push({ team: team.slice(), value: teamValue(data, base, team, opts) });
        return;
      }
      for (var i = start; i < p.length; i++) {
        if (p[i].unique && team.indexOf(p[i]) !== -1) continue;
        team.push(p[i]); walk(i, team); team.pop();
      }
    }
    walk(0, []);
    // Good enough beats perfect: among lineups within 0.5% of the highest, show the easiest
    // for most alliances to fill first: fewest heroes from the two newest generations (fewer
    // players have leveled them; staples such as Ava and Hero Roulette heroes don't count), then fewer different heroes (fewer formations to save).
    // Exact ties then go to older heroes. The rest follow by value.
    // "Newest" is the server's newest generation (opts.maxGen), not the newest in the data file.
    var newest = Math.min(opts.maxGen || Infinity, Math.max.apply(null, data.joiners.map(function (j) { return j.gen || 0; })));
    var gens = function (t) { return t.reduce(function (n, j) { return n + (j.gen || 0); }, 0); };
    var fresh = function (t) { return t.filter(function (j) { return j.gen >= newest - 1 && !j.staple && !j.wheel; }).length; };
    var kinds = function (t) { return t.filter(function (j, i) { return t.indexOf(j) === i; }).length; };
    // opts.liked = { hero: Likely wanted score }: on an exact tie, prefer heroes more alliances already field.
    var liked = function (t) { return opts.liked ? t.reduce(function (n, j) { return n + (opts.liked[j.hero] || 0); }, 0) : 0; };
    var ease = function (a, b) { return fresh(a.team) - fresh(b.team) || kinds(a.team) - kinds(b.team); };
    var tieBreak = function (a, b) { return liked(b.team) - liked(a.team) || gens(a.team) - gens(b.team); };
    results.sort(function (a, b) { return Math.abs(b.value - a.value) > 1e-9 ? b.value - a.value : ease(a, b) || tieBreak(a, b); });
    if (results.length) {
      var maxV = results[0].value, window = opts.window === undefined ? 0.005 : opts.window;
      var near = results.filter(function (r) { return r.value >= maxV * (1 - window) - 1e-12; });
      var pick = near.slice().sort(function (a, b) { return ease(a, b) || (Math.abs(b.value - a.value) > 1e-9 ? b.value - a.value : tieBreak(a, b)); })[0];
      results.splice(results.indexOf(pick), 1);
      results.unshift(pick);
      results.forEach(function (r) { r.max = maxV; });
    }
    return results.slice(0, top);
  }

  // Each joiner's value if it were the only one added.
  function singlePicks(data, leaderNames, opts) {
    var base = leaderGroups(data, leaderNames, opts);
    return pool(data, leaderNames, opts).map(function (j) {
      return { joiner: j, value: teamValue(data, base, [j], opts) };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  // How many separate skills (copies) the leader team has in each group.
  function leaderCounts(data, names, opts) {
    var n = {};
    Object.keys(data.groups).forEach(function (id) { n[id] = leaderContrib(data, names, id, opts).length; });
    return n;
  }

  function ofCard(before, pct) {
    return (((1 + (before + pct) / 100) / (1 + before / 100)) - 1) * 100 / pct;
  }

  // One row per group: who on the leader team fills it, and what the next copy would add.
  function groupSummary(data, names, opts, nextPct) {
    var g = leaderGroups(data, names, opts);
    return Object.keys(data.groups).filter(function (id) { return keep(data, id, opts); }).map(function (id) {
      var have = g[id] || 0, pct = nextPct[id];
      return { id: id, from: leaderContrib(data, names, id, opts), have: have, nextCopy: leaderContrib(data, names, id, opts).length + 1,
        nextPct: pct, nextAdds: (1 + (have + pct) / 100) / (1 + have / 100), nextOfCard: ofCard(have, pct) };
    });
  }

  // Order a lineup so each pick shows what it added on top of the ones before it.
  function breakdown(data, leaderNames, team, opts) {
    var g = leaderGroups(data, leaderNames, opts);
    var count = leaderCounts(data, leaderNames, opts), holders = {};
    Object.keys(data.groups).forEach(function (id) {
      holders[id] = leaderContrib(data, leaderNames, id, opts).map(function (f) { return f.hero; });
    });
    var left = team.slice(), rows = [];
    while (left.length) {
      var best = -1, bestV = 0;
      left.forEach(function (j, i) {
        var v = product(addJoiner(data, g, j, opts)) / product(g);
        if (v > bestV) { bestV = v; best = i; }
      });
      var j = left.splice(best, 1)[0];
      var ids = effectsOf(j, opts, data).filter(function (e) { return keep(data, e.id, opts); }).map(function (e) {
        count[e.id] = (count[e.id] || 0) + 1;
        var w = holders[e.id].slice(); holders[e.id].push(j.hero);
        return { id: e.id, pct: e.pct, before: g[e.id] || 0, copy: count[e.id], overlaps: w, ofCard: ofCard(g[e.id] || 0, e.pct) };
      });
      g = addJoiner(data, g, j, opts);
      rows.push({ joiner: j, value: bestV, ids: ids });
    }
    return rows;
  }

  // Which leader skills put something into group `id`.
  function leaderContrib(data, names, id, opts) {
    var out = [];
    names.forEach(function (name) {
      var leader = data.leaders.find(function (l) { return l.hero === name; });
      if (!leader) return;
      leader.skills.forEach(function (s) {
        effectsOf(s, opts, data).forEach(function (e) {
          if (e.id === id && keep(data, id, opts)) out.push({ hero: name, skill: s.name, pct: e.pct, conf: s.conf });
        });
      });
    });
    return out;
  }

  // Row 0 = what the leader team already has in the group; rows 1..copies = each
  // added joiner copy and what it really adds on top of the total before it.
  function crowding(already, pct, copies) {
    var start = 1 + already / 100, total = start;
    var rows = [{ n: 0, groupPct: already, multiplier: start }];
    for (var n = 1; n <= (copies || 4); n++) {
      var next = total + pct / 100;
      rows.push({ n: n, groupPct: already + n * pct, multiplier: next, marginal: next / total, cumulative: next / start });
      total = next;
    }
    return rows;
  }

  // Every same-id skill as its own step, leader skills first, then joiners.
  // Each step: what the group total becomes, what this copy really adds, and
  // what share of its printed % that is. `sinceLeader` = joiners' combined gain.
  function crowdSteps(steps) {
    var total = 1, leaderEnd = 1, rows = [];
    steps.forEach(function (s, i) {
      var next = total + s.pct / 100;
      if (s.source === 'leader') leaderEnd = next;
      rows.push({ n: i + 1, label: s.label, source: s.source, pct: s.pct, groupPct: Math.round((next - 1) * 10000) / 100,
        multiplier: next, marginal: next / total, ofCard: (next / total - 1) * 100 / s.pct,
        sinceLeader: s.source === 'joiner' ? next / leaderEnd : null });
      total = next;
    });
    return rows;
  }

  // Every joiner ranked as the next pick, on top of the lead team plus `team`.
  function rankNext(data, names, team, opts) {
    var before = product(teamGroups(data, names, team, opts));
    return pool(data, names, opts).filter(function (j) { return !(j.unique && team.indexOf(j) !== -1); })
      .map(function (j) { return { joiner: j, value: product(teamGroups(data, names, team.concat([j]), opts)) / before }; })
      .sort(function (a, b) { return Math.abs(b.value - a.value) > 1e-9 ? b.value - a.value : (a.joiner.gen || 0) - (b.joiner.gen || 0); });
  }

  // Same groups at the same % = the same ability (Chenko and Yeonwoo, for example).
  function abilityKey(j) {
    return (j.effects || []).map(function (e) { return e.id + ':' + e.pct; }).join('|') + (j.petra ? '|petra' : '');
  }

  // How often each ability is actually chosen: the share of PvP lead teams whose shown best
  // four (with every tie-breaker) includes it. Lead teams come from the three newest
  // generations up to maxGen, plus heroes marked alwaysLead (Amadeus, Petra, Ava).
  // Heroes turned off in the joiner pool (`without`) are left out. Two passes: the first scores without the Likely wanted tie-break, the second
  // re-picks with those scores so exact ties resolve the same way the page does.
  function likelyWanted(data, maxGen, without) {
    var opts = { mode: 'pvp', troopTypes: 3, without: without || [] };
    var d = Object.assign({}, data, { joiners: data.joiners.filter(function (j) { return j.gen <= maxGen; }) });
    var by = function (c) {
      var list = data.leaders.filter(function (l) { return l.class === c && l.gen <= maxGen; });
      var top = Math.max.apply(null, list.map(function (l) { return l.gen; }));
      return list.filter(function (l) { return l.gen >= top - 2 || l.alwaysLead; }).map(function (l) { return l.hero; });
    };
    var teams = [];
    by('inf').forEach(function (i) { by('cav').forEach(function (c) { by('arc').forEach(function (a) { teams.push([i, c, a]); }); }); });
    var score = function (liked) {
      var hits = {};
      teams.forEach(function (t) {
        var best = bestLineups(d, t, Object.assign({ liked: liked }, opts), 4, 1)[0], seen = {};
        best.team.forEach(function (j) { seen[abilityKey(j)] = true; });
        Object.keys(seen).forEach(function (k) { hits[k] = (hits[k] || 0) + 1; });
      });
      var rows = {}, byHero = {};
      pool(d, [], opts).forEach(function (j) {
        var k = abilityKey(j);
        if (!rows[k]) rows[k] = { key: k, joiner: j, heroes: [], score: (hits[k] || 0) / teams.length };
        rows[k].heroes.push(j.hero);
        byHero[j.hero] = rows[k].score;
      });
      return { rows: rows, byHero: byHero };
    };
    var res = score(score(null).byHero);
    return likelyRows(data, maxGen, without, teams, res.byHero);
  }

  // Rebuild the Likely wanted table from saved per-hero scores (data/likely.json).
  function likelyRows(data, maxGen, without, teams, byHero) {
    var d = Object.assign({}, data, { joiners: data.joiners.filter(function (j) { return j.gen <= maxGen; }) });
    var rows = {};
    pool(d, [], { without: without || [] }).forEach(function (j) {
      var k = abilityKey(j);
      if (!rows[k]) rows[k] = { key: k, joiner: j, heroes: [], score: byHero[j.hero] || 0 };
      rows[k].heroes.push(j.hero);
    });
    return { teams: teams, byHero: byHero, rows: Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return b.score - a.score; }) };
  }

  // Group totals for lead team plus a joiner lineup.
  function teamGroups(data, names, team, opts) {
    var g = leaderGroups(data, names, opts);
    team.forEach(function (j) { g = addJoiner(data, g, j, opts); });
    return g;
  }

  // An empty compare slot: no skill, so it adds nothing.
  var NO_JOINER = { hero: 'No joiner', effects: [] };

  // Every hero a compare team can pick: the joiner pool chips don't apply, the generation picker does.
  function compareHeroes(data, opts) {
    return data.joiners.filter(function (j) { return !j.exclude && !(opts.maxGen && j.gen > opts.maxGen); });
  }

  // Names to joiners for a compare team. A name that can't be used here (too new, not a joiner)
  // takes the default team's hero for that slot.
  function compareTeam(data, names, fallback, opts) {
    var allowed = compareHeroes(data, opts);
    var find = function (n) { return n === NO_JOINER.hero ? NO_JOINER : allowed.find(function (j) { return j.hero === n; }); };
    return fallback.map(function (f, i) { return find((names || fallback)[i]) || find(f) || allowed[0]; });
  }

  // Group totals where each Petra after the first only adds more 50% checks (3 types: 87.5% to 98.4%),
  // so her average goes 43.75% to 49.2%. A Petra on the lead team counts as the first one.
  function compareGroups(data, names, team, opts) {
    var n = names.filter(function (name) {
      var l = data.leaders.find(function (h) { return h.hero === name; });
      return l && l.skills.some(function (sk) { return sk.petra; });
    }).length;
    return team.reduce(function (g, j) {
      if (!j.petra) return addJoiner(data, g, j, opts);
      n++;
      var pct = petraPct(opts.troopTypes * n) - petraPct(opts.troopTypes * (n - 1));
      return addJoiner(data, g, { effects: [{ id: j.effects[0].id, pct: pct }] }, opts);
    }, leaderGroups(data, names, opts));
  }

  // Totals for one compare team. `value` is the whole boost; `dealt` and `taken` split it by side.
  // `rows` keeps the team's slot order: each joiner counted on top of the slots above it.
  function compareTotals(data, leaderNames, team, opts) {
    var before = leaderGroups(data, leaderNames, opts), after = compareGroups(data, leaderNames, team, opts);
    var bySide = function (s) {
      return Object.keys(after).filter(function (id) { return data.groups[id].side === s; }).reduce(function (p, id) {
        return p * (1 + after[id] / 100) / (1 + (before[id] || 0) / 100);
      }, 1);
    };
    var rows = team.map(function (j, i) {
      return { joiner: j, value: product(compareGroups(data, leaderNames, team.slice(0, i + 1), opts)) / product(compareGroups(data, leaderNames, team.slice(0, i), opts)) };
    });
    return { value: product(after) / product(before), dealt: bySide('off'), taken: bySide('def'), rows: rows };
  }

  var api = { NO_JOINER: NO_JOINER, compareHeroes: compareHeroes, compareTeam: compareTeam, compareTotals: compareTotals, effectsOf: effectsOf, likelyRows: likelyRows, likelyWanted: likelyWanted, abilityKey: abilityKey, rankNext: rankNext, crowdSteps: crowdSteps, teamGroups: teamGroups, leaderCounts: leaderCounts, groupSummary: groupSummary, ofCard: ofCard, petraPct: petraPct, leaderGroups: leaderGroups, product: product, pool: pool,
    teamValue: teamValue, bestLineups: bestLineups, singlePicks: singlePicks,
    breakdown: breakdown, crowding: crowding, leaderContrib: leaderContrib };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JoinerCalc = api;
})(this);
