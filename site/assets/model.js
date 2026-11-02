import {SERIES,GROUPS,LEVELS} from './data.js';
export const fmt=(value,digits=2)=>new Intl.NumberFormat('uk-UA',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Each tuple is [lower, upper, includeLower, includeUpper]. Classification precedes display rounding.
const r=(lo,hi,lc=true,uc=true)=>[lo,hi,lc,uc];
const RULES={
  yield:[[r(45,55)],[r(35,45,true,false),r(55,75,false,true)],[r(25,35,true,false),r(75,95,false,true)],[r(20,25,true,false),r(95,100,false,true)],[r(15,20,true,false),r(100,150,false,true)],[r(0,15,false,false),r(150,Infinity,false,false)]],
  trade:[[r(1,1.2)],[r(.975,1,true,false),r(1.2,1.25,false,true)],[r(.95,.975,true,false),r(1.25,1.3,false,true)],[r(.9,.95,true,false),r(1.3,1.5,false,true)],[r(.85,.9,true,false),r(1.5,1.7,false,true)],[r(0,.85,false,false),r(1.7,Infinity,false,false)]],
  life:[[r(78,Infinity)],[r(75,78,true,false)],[r(70,75,true,false)],[r(68,70,true,false)],[r(66,68,true,false)],[r(0,66,false,false)]],
  infant:[[r(0,4)],[r(4,5,false,true)],[r(5,7,false,true)],[r(7,9,false,true)],[r(9,11,false,true)],[r(11,1000,false,true)]],
  research:[[r(3,Infinity)],[r(2,3,true,false)],[r(1.5,2,true,false)],[r(1,1.5,true,false)],[r(.5,1,true,false)],[r(0,.5,false,false)]],
  inequality:[[r(1,4.5)],[r(4.5,5,false,true)],[r(5,5.5,false,true)],[r(5.5,6,false,true)],[r(6,7,false,true)],[r(7,Infinity,false,false)]],
  debt:[[r(0,20)],[r(20,30,false,true)],[r(30,40,false,true)],[r(40,50,false,true)],[r(50,60,false,true)],[r(60,Infinity,false,false)]]
};
export function classify(group,value){
  if(!Number.isFinite(value)||!RULES[group])return null;
  const index=RULES[group].findIndex(ranges=>ranges.some(([lo,hi,lc,uc])=>(lc?value>=lo:value>lo)&&(uc?value<=hi:value<hi)));
  return index<0?null:LEVELS[index];
}
export function snapshot(year='latest'){
  return SERIES.map(series=>{
    const row=year==='latest'?series.data.at(-1):series.data.find(row=>row.year===Number(year));
    return {series,row:row||null,level:row?classify(series.group,row.value):null};
  });
}
export function distribution(entries){
  const available=entries.filter(entry=>entry.row&&entry.level);
  return {available:available.length,attention:available.filter(e=>LEVELS.indexOf(e.level)>=2).length,
    favorable:available.filter(e=>LEVELS.indexOf(e.level)<=1).length,
    counts:LEVELS.map(level=>({level,count:available.filter(e=>e.level===level).length}))};
}
export function trend(series,row=series.data.at(-1)){
  const first=series.data[0];
  if(!row||row.year===first.year)return null;
  const group=GROUPS.find(group=>group.id===series.group);
  const distance=v=>Math.max(group.optimalRange[0]-v,0,group.optimalRange[1]===null?0:v-group.optimalRange[1]);
  return {change:row.value-first.value,firstYear:first.year,lastYear:row.year,improved:distance(row.value)<distance(first.value),unchanged:distance(row.value)===distance(first.value)};
}
export function pill(level){return level?`<span class="status ${level.key}"><span aria-hidden="true"></span>${level.label}</span>`:'<span class="missing">Немає даних</span>';}
export function summaryRows(year='latest',filter='all'){
  const entries=snapshot(year).filter(({level})=>filter==='all'||(level&&(filter==='attention'?LEVELS.indexOf(level)>=2:LEVELS.indexOf(level)<=1)));
  if(!entries.length)return '<tr><td colspan="5" class="empty-state">Для цього року та фільтра даних немає.</td></tr>';
  return entries.map(({series,row,level})=>{
    const group=GROUPS.find(g=>g.id===series.group);
    return `<tr><th scope="row"><a href="#detail-${group.id}" data-explore="${group.id}">${escapeHTML(series.title)}</a><small class="mobile-year">${row?.year??'—'}</small></th><td>${row?.year??'—'}</td><td class="number">${row?fmt(row.value,series.digits):'—'}<small>${series.unit}</small></td><td>${pill(level)}<small class="mobile-optimal">Оптимум: ${group.optimal}</small></td><td><span class="optimal-target">${group.optimal}</span></td></tr>`;
  }).join('');
}
export function detailTable(group){
  const tracks=SERIES.filter(s=>s.group===group.id),first=tracks[0];
  const extra=group.id==='yield'?[['kg','Урожайність, кг/га',1]]:group.id==='trade'?[['exports','Експорт, % ВВП',4],['imports','Імпорт, % ВВП',4]]:group.id==='inequality'?[['upper10','Доходи верхніх 10%, %',1],['lower10','Доходи нижніх 10%, %',1]]:[];
  return `<div class="table-wrap" tabindex="0" aria-label="Прокручувана таблиця: ${escapeHTML(group.title)}"><table class="data-table"><caption>${group.title} · ${first.data[0].year}–${first.data.at(-1).year} · ${first.unit}</caption><thead><tr><th scope="col">Рік</th>${extra.map(([,label])=>`<th scope="col">${label}</th>`).join('')}${tracks.map(track=>`<th scope="col">${tracks.length>1?track.short:'Значення'}, ${track.unit}</th><th scope="col">Рівень безпеки</th>`).join('')}</tr></thead><tbody>${first.data.map((row,index)=>`<tr><th scope="row">${row.year}</th>${extra.map(([key,,digits])=>`<td class="number">${fmt(row.inputs[key],digits)}</td>`).join('')}${tracks.map(track=>`<td class="number">${fmt(track.data[index].value,track.digits)}</td><td>${pill(classify(group.id,track.data[index].value))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function csv(){
  const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
  const lines=[['Країна','Група показників','Показник','Рік','Значення до округлення','Одиниця','Рівень','Початкові величини','Таблиці теоретичної частини']];
  for(const series of SERIES){const group=GROUPS.find(g=>g.id===series.group);for(const row of series.data)lines.push(['Туреччина',group.title,series.title,row.year,row.value,series.unit,classify(group.id,row.value).label,row.inputs?Object.entries(row.inputs).map(([key,value])=>key+'='+value).join(' | '):'',group.tables]);}
  return '\ufeff'+lines.map(row=>row.map(quote).join(';')).join('\r\n')+'\r\n';
}
