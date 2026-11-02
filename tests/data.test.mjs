import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GROUPS,SERIES,PROFILE} from '../site/assets/data.js';
import {classify,snapshot,distribution,fmt,trend,csv} from '../site/assets/model.js';

test('All 45 observations retain the periods and ratings in the supplied report',()=>{
  const expected={
    yield:['unsatisfactory','unsatisfactory','unsatisfactory','satisfactory','unsatisfactory'],
    'life-female':Array(5).fill('optimal'),'life-male':Array(5).fill('unsatisfactory'),
    'infant-female':['dangerous','dangerous','dangerous','critical','dangerous'],
    'infant-male':['critical','critical','critical','critical','dangerous'],
    trade:['optimal','dangerous','dangerous','optimal','satisfactory'],
    research:Array(5).fill('dangerous'),inequality:Array(5).fill('absolute'),
    debt:['dangerous','dangerous','unsatisfactory','unsatisfactory','satisfactory']
  };
  assert.equal(GROUPS.length,7);assert.equal(SERIES.length,9);
  assert.equal(SERIES.flatMap(s=>s.data).length,45);
  for(const series of SERIES){
    assert.equal(series.data.length,5);
    assert.deepEqual(series.data.map(row=>classify(series.group,row.value)?.key),expected[series.id]);
    assert.equal(series.data.at(-1).year-series.data[0].year,4);
    assert.ok(series.data.every(row=>Number.isFinite(row.value)));
  }
  assert.deepEqual(SERIES.filter(s=>s.data.at(-1).year===2023).map(s=>s.id),['research','inequality']);
  assert.equal(SERIES.find(s=>s.id==='trade').data.at(-1).year,2025);
});

test('Displayed final observations reproduce table 15',()=>{
  const expected=['34,29','80,34','74,62','7,4','8,7','0,9906','1,4222','16,38','25,51'];
  assert.deepEqual(snapshot().map(({series,row})=>fmt(row.value,series.digits)),expected);
  const result=distribution(snapshot());
  assert.equal(result.available,9);assert.equal(result.attention,6);assert.equal(result.favorable,3);
  assert.deepEqual(result.counts.map(x=>x.count),[1,2,2,3,0,1]);
});

test('Derived figures use original source values before any rounding',()=>{
  const trade=SERIES.find(s=>s.id==='trade').data.find(row=>row.year===2023);
  assert.ok(Math.abs(trade.value-31.9136/33.7696)<1e-12);
  assert.equal(fmt(trade.value,2),'0,95');
  assert.equal(classify('trade',trade.value).key,'dangerous');
  assert.equal(classify('trade',Number(fmt(trade.value,2).replace(',','.'))).key,'unsatisfactory');
  assert.equal(SERIES[0].data[0].value,33.415);
  assert.equal(fmt(SERIES[0].data[0].value),'33,42');
  assert.ok(Math.abs(SERIES.find(s=>s.id==='inequality').data.at(-1).value-34.4/2.1)<1e-12);
});

test('Threshold endpoints preserve every open and closed boundary in the report',()=>{
  const cases={
    yield:[[0,null],[14.99,'absolute'],[15,'critical'],[20,'dangerous'],[25,'unsatisfactory'],[35,'satisfactory'],[45,'optimal'],[55,'optimal'],[55.001,'satisfactory'],[75,'satisfactory'],[75.001,'unsatisfactory'],[95,'unsatisfactory'],[100,'dangerous'],[150,'critical'],[150.001,'absolute']],
    trade:[[0,null],[.84999,'absolute'],[.85,'critical'],[.9,'dangerous'],[.95,'unsatisfactory'],[.975,'satisfactory'],[1,'optimal'],[1.2,'optimal'],[1.20001,'satisfactory'],[1.25,'satisfactory'],[1.25001,'unsatisfactory'],[1.3,'unsatisfactory'],[1.5,'dangerous'],[1.7,'critical'],[1.70001,'absolute']],
    life:[[0,null],[65.9,'absolute'],[66,'critical'],[68,'dangerous'],[70,'unsatisfactory'],[75,'satisfactory'],[78,'optimal']],
    infant:[[-1,null],[0,'optimal'],[4,'optimal'],[4.01,'satisfactory'],[5,'satisfactory'],[5.01,'unsatisfactory'],[7,'unsatisfactory'],[7.01,'dangerous'],[9,'dangerous'],[9.01,'critical'],[11,'critical'],[11.01,'absolute'],[1000,'absolute'],[1001,null]],
    research:[[0,null],[.49,'absolute'],[.5,'critical'],[1,'dangerous'],[1.5,'unsatisfactory'],[2,'satisfactory'],[3,'optimal']],
    inequality:[[.9,null],[1,'optimal'],[4.5,'optimal'],[4.51,'satisfactory'],[5,'satisfactory'],[5.01,'unsatisfactory'],[5.5,'unsatisfactory'],[5.51,'dangerous'],[6,'dangerous'],[6.01,'critical'],[7,'critical'],[7.01,'absolute']],
    debt:[[-1,null],[0,'optimal'],[20,'optimal'],[20.01,'satisfactory'],[30,'satisfactory'],[30.01,'unsatisfactory'],[40,'unsatisfactory'],[40.01,'dangerous'],[50,'dangerous'],[50.01,'critical'],[60,'critical'],[60.01,'absolute']]
  };
  for(const [group,pairs] of Object.entries(cases))for(const [value,level] of pairs)assert.equal(classify(group,value)?.key??null,level,`${group}: ${value}`);
  for(const value of [NaN,Infinity,-Infinity,'75',null])assert.equal(classify('life',value),null);
});

test('Choosing a common year never carries forward or imputes missing data',()=>{
  const year2025=snapshot('2025');
  assert.equal(year2025.filter(e=>e.row).length,1);
  assert.equal(year2025.find(e=>e.row).series.id,'trade');
  assert.equal(year2025.filter(e=>!e.row).length,8);
  assert.equal(distribution(year2025).favorable,1);
  assert.equal(snapshot('2023').filter(e=>e.row).length,9);
  assert.equal(snapshot('2019').filter(e=>e.row).length,2);
});

test('Trends respect direction and retain original periods',()=>{
  const debt=trend(SERIES.find(s=>s.id==='debt'));
  assert.equal(fmt(debt.change),'-15,53');assert.equal(debt.improved,true);
  const inequality=trend(SERIES.find(s=>s.id==='inequality'));
  assert.equal(fmt(inequality.change),'-1,46');assert.equal(inequality.improved,true);
  const trade=trend(SERIES.find(s=>s.id==='trade'));
  assert.equal(trade.improved,false);assert.equal(trade.unchanged,false);
  assert.equal(trade.firstYear,2021);assert.equal(trade.lastYear,2025);
  assert.equal(trend(SERIES[0],SERIES[0].data[0]),null);
});

test('Export has 45 complete observations, a BOM, source fields and classification',async()=>{
  const result=csv();
  assert.ok(result.startsWith('\ufeff'));
  assert.equal(result.trim().split('\r\n').length,46);
  assert.match(result,/kg=3341.5/);assert.match(result,/exports=31.9136/);
  assert.match(result,/"2025";"0\.9906/);
  assert.equal(await readFile(new URL('../site/assets/turkiye-data.csv',import.meta.url),'utf8'),result);
});

test('Generated pages expose static data, have relative links and no publication workflow',async()=>{
  for(const page of ['index.html','analytics.html','methodology.html']){
    const html=await readFile(new URL('../site/'+page,import.meta.url),'utf8');
    assert.match(html,/<html lang="uk">/);assert.match(html,/© 2026/);assert.ok(html.includes(PROFILE.name));
    assert.match(html,/href="\.\/index.html"/);assert.match(html,/href="\.\/analytics.html"/);assert.match(html,/href="\.\/methodology.html"/);
    assert.doesNotMatch(html,/<(?:iframe|form)\b|style=|on(?:click|load|error)=/i);
  }
  const html=await readFile(new URL('../site/analytics.html',import.meta.url),'utf8');
  assert.equal((html.match(/data-group-panel=/g)||[]).length,7);
  assert.equal((html.match(/class="chart"/g)||[]).length,7);
  assert.equal((html.match(/class="data-point /g)||[]).length,45);
  const source=await readFile(new URL('../site/assets/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\b/);
});
