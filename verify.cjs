const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const context = vm.createContext({});
vm.runInContext(script.slice(0, script.indexOf('function createControls')) + '\nthis.model = {presets, calculate, profit, scenarios, specs};', context);
const {presets, calculate, profit, scenarios, specs} = context.model;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
close(calculate(presets.baseline).root, .1875);
close(calculate(presets.baseline).intercept, 90000);
close(calculate(presets.baseline).slope, -480000);
close(profit(presets.baseline, .1), 42000);
close(calculate(presets.defensive).root, -.28125);
assert.equal(calculate(presets.defensive).region, 'all');
close(calculate(presets.defensive).intercept, 90000);
close(calculate(presets.defensive).slope, 320000);
close(profit(presets.defensive, 1), 410000);
for (const key of Object.keys(presets.baseline).filter(key => key !== 'delta')) {
  assert.equal(presets.defensive[key], presets.baseline[key]);
}
close(calculate(presets.defensive).cutoff, .44);
assert.equal(calculate(presets.none).region, 'none');
assert.equal(calculate({...presets.baseline, a:0}).region, 'none');
assert.equal(calculate({...presets.baseline, a:0, F:0}).region, 'indifferent');
assert.equal(calculate({...presets.defensive, delta:.44}).flat, true);
close(profit({...presets.defensive, delta:.44}, .8), 90000);
for (const m of [1, 7.5, 10, 29.5]) {
  const p = {...presets.defensive, m, c:m/3};
  const cutoff = calculate(p).cutoff;
  assert.equal(calculate({...p, delta:cutoff}).flat, true);
  assert.ok(scenarios(p,'delta').some(row => calculate(row.p).flat));
}
for (const [id,,,,,value,scale] of specs) close(value/scale, presets.baseline[id]);
// Check both feasible endpoint indifference cases.
assert.equal(calculate({...presets.baseline, F:280000}).region, 'below');
close(calculate({...presets.baseline, F:280000}).root, 0);
assert.equal(calculate({...presets.defensive, F:600000}).region, 'above');
close(calculate({...presets.defensive, F:600000}).root, 1);
console.log('PASS: baseline, Case 2, all participation regimes, cutoff, zero adoption, input scaling, and endpoint equality.');
