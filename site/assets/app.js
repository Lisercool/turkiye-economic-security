import {SERIES,PROFILE} from './data.js';
import {snapshot,distribution,summaryRows} from './model.js';
// No analytics, cookies, browser storage, forms, or remote data requests.
const year=document.querySelector('#snapshot-year');
const levelFilter=document.querySelector('#snapshot-filter');
let activeFilter='all';
const plural=(n,one,few,many)=>n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many;
function updateSnapshot(){
  if(!year)return;
  document.querySelector('#snapshot-rows').innerHTML=summaryRows(year.value,activeFilter);
  const state=distribution(snapshot(year.value));
  document.querySelector('#available-count').textContent=state.available;
  document.querySelector('#attention-count').textContent=state.attention;
  document.querySelector('#favorable-count').textContent=state.favorable;
  document.querySelector('#attention-unit').textContent=plural(state.attention,'оцінка','оцінки','оцінок');
  document.querySelector('#favorable-unit').textContent=plural(state.favorable,'оцінка','оцінки','оцінок');
  document.querySelector('#snapshot-caption').textContent=year.value==='latest'?'Останні спостереження з дослідження. Роки різняться між показниками.':`Дані за ${year.value} рік. Пропуски не заповнюються.`;
  document.querySelector('#snapshot-announcement').textContent=`${year.value==='latest'?'Останні спостереження':year.value+' рік'}: доступно ${state.available} з ${SERIES.length} показників; потребують уваги ${state.attention}.`;
  document.querySelector('#unavailable-note').hidden=state.available===SERIES.length;
  document.querySelector('#unavailable-note').textContent=`За цей рік немає ${SERIES.length-state.available} із ${SERIES.length} показників. Відсутні дані не замінюються нулями.`;
}
year?.addEventListener('change',updateSnapshot);
levelFilter?.addEventListener('change',()=>{activeFilter=levelFilter.value;updateSnapshot();});
const selector=document.querySelector('#indicator-select');
function selectGroup(id,scroll=false){
  if(!selector||![...selector.options].some(option=>option.value===id))return;
  selector.value=id;
  document.querySelectorAll('[data-group-panel]').forEach(panel=>panel.hidden=panel.dataset.groupPanel!==id);
  if(scroll)document.querySelector(`#detail-${id}`).scrollIntoView({block:'start',behavior:'instant'});
}
selector?.addEventListener('change',()=>selectGroup(selector.value));
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-explore]');
  if(!link)return;
  selectGroup(link.dataset.explore);
});
function readHash(){
  if(location.hash.startsWith('#detail-'))selectGroup(location.hash.slice(8),true);
  if(location.hash.startsWith('#method-')){
    const details=document.getElementById(location.hash.slice(1));
    if(details?.tagName==='DETAILS')details.open=true;
  }
}
window.addEventListener('hashchange',readHash);
if(selector)selectGroup(selector.value);
readHash();
document.querySelector('#show-thresholds')?.addEventListener('change',event=>{
  document.querySelectorAll('.chart').forEach(chart=>chart.classList.toggle('without-thresholds',!event.target.checked));
  document.querySelectorAll('.band-explanation').forEach(note=>note.hidden=!event.target.checked);
});
document.querySelectorAll('[data-point]').forEach(point=>{
  const show=()=>point.closest('.plot-block').querySelector('.chart-readout').textContent=point.dataset.point;
  point.addEventListener('pointerenter',show);point.addEventListener('focus',show);point.addEventListener('click',show);
});
document.querySelector('#print-report')?.addEventListener('click',()=>window.print());
// Print a complete report, including all seven groups, rather than only the selected chart.
let closedBeforePrint=[];
window.addEventListener('beforeprint',()=>{
  closedBeforePrint=[...document.querySelectorAll('details:not([open])')];
  closedBeforePrint.forEach(details=>details.open=true);
});
window.addEventListener('afterprint',()=>{
  closedBeforePrint.forEach(details=>details.open=false);
  closedBeforePrint=[];
});
updateSnapshot();
document.querySelectorAll('[data-profile-name]').forEach(el=>el.textContent=PROFILE.name);
