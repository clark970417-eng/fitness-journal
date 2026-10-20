const {test}=require('node:test');const assert=require('node:assert/strict');const core=require('./training-core.js');
const ex=(sets)=>({name:'臥推',group:'胸',sets});const set=(weight,done=true)=>({weight,reps:10,done});
test('unfinished attempt retains completed weight, completed increase becomes every next set default',()=>{
let history=[{id:'base',date:'2026-10-09T12:00:00',exercises:[ex([set(35)])]},{id:'attempt',date:'2026-10-10T12:00:00',exercises:[ex([set(42,false)])]}];
assert.deepEqual(core.prescription({name:'臥推'},history).sets.map(s=>s.weight),[35]);history[1].exercises[0].sets=[set(35),set(42)];assert.deepEqual(core.prescription({name:'臥推'},history).sets.map(s=>s.weight),[42]);
});
test('daily completed sums agree across week month year, ignore cached volume and incomplete sets',()=>{
const history=[{id:'1',date:'2026-10-10T12:00:00',volume:9999,exercises:[ex([set(35),set(42,false)])]},{id:'2',date:'2026-10-10T16:00:00',exercises:[ex([set(42)])]}];
for(const period of ['week','month','year']){const stats=core.stats(history,period,new Date(2026,9,10));assert.equal(stats.volume,770);assert.equal(stats.muscles['胸'],2);assert.equal(stats.buckets.reduce((n,b)=>n+b.value,0),770);}
});
test('month and year retain all dates, including leap day and end of year',()=>{
const h=[{id:'leap',date:'2024-02-29T12:00:00',exercises:[ex([set(10)])]},{id:'end',date:'2024-12-31T12:00:00',exercises:[ex([set(20)])]}];assert.equal(core.stats(h,'month',new Date(2024,1,15)).buckets.length,29);assert.equal(core.stats(h,'year',new Date(2024,1,15)).volume,300);
});

test('weight-specific defaults, gains reset on heavier weights and reduced performance carries forward',()=>{
const exercise={name:'臥推',weight:38};
const entry=(weight,count,reps,date='2026-10-10')=>({id:weight+'-'+count+'-'+reps,date,exercises:[ex(Array.from({length:count},()=>({weight,reps,done:true})))]});
assert.deepEqual(core.parametersAtWeight(exercise,[],38),{count:4,reps:8});
let history=[entry(38,5,9)];
assert.deepEqual(core.parametersAtWeight(exercise,history,38),{count:5,reps:9});
assert.deepEqual(core.parametersAtWeight(exercise,history,40),{count:4,reps:8});
history.push(entry(40,3,5));
assert.deepEqual(core.parametersAtWeight(exercise,history,40),{count:3,reps:5});
assert.deepEqual(core.parametersAtWeight(exercise,history,42),{count:3,reps:5});
history.push(entry(38,4,8));assert.deepEqual(core.parametersAtWeight(exercise,history,38),{count:5,reps:9});
assert.ok(core.prescription(exercise,[]).sets.every(s=>s.done&&s.reps===8));assert.equal(core.prescription(exercise,[]).sets.length,4);
});
