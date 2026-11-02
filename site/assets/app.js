import {SERIES,PROFILE} from './data.js';
import {snapshot,distribution,summaryRows} from './model.js';
// No analytics, cookies, browser storage, forms, or remote data requests.
const year=document.querySelector('#snapshot-year');
const filterButtons=[...document.querySelectorAll('[data-filter]')];
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
  document.querySelector('#snapshot-caption').textContent=year.value==='latest'?'Останні спостереження з наданого дослідження. Роки різняться між показниками.':`Дані за ${year.value} рік. Відсутні спостереження не замінюються даними інших років.`;
  document.querySelector('#snapshot-announcement').textContent=`${year.value==='latest'?'Останні спостереження':year.value+' рік'}: доступно ${state.available} з ${SERIES.length} показників; потребують уваги ${state.attention}.`;
  document.querySelector('#unavailable-note').hidden=state.available===SERIES.length;
  document.querySelector('#unavailable-note').textContent=`За обраний рік немає ${SERIES.length-state.available} із ${SERIES.length} показників. Це прогалини в наданому наборі, а не нульові значення.`;
  filterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===activeFilter)));
}
year?.addEventListener('change',updateSnapshot);
filterButtons.forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;updateSnapshot();}));
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
function readHash(){const id=location.hash.replace('#detail-','');if(location.hash.startsWith('#detail-'))selectGroup(id,true);}
window.addEventListener('hashchange',readHash);
if(selector){selectGroup(selector.value);readHash();}
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
window.addEventListener('beforeprint',()=>document.body.classList.add('printing'));
window.addEventListener('afterprint',()=>document.body.classList.remove('printing'));
updateSnapshot();
document.querySelectorAll('[data-profile-name]').forEach(el=>el.textContent=PROFILE.name);
