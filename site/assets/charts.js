import {SERIES} from './data.js';
import {fmt,escapeHTML as esc,classify} from './model.js';
export function chart(group){
  const tracks=SERIES.filter(s=>s.group===group.id),years=tracks[0].data.map(row=>row.year);
  const w=900,h=310,left=58,right=32,top=30,bottom=46;
  const x=i=>left+i*(w-left-right)/(years.length-1);
  const y=value=>top+(group.yDomain[1]-value)*(h-top-bottom)/(group.yDomain[1]-group.yDomain[0]);
  const [low,high]=group.optimalRange,visibleHigh=high??group.yDomain[1];
  const paths=tracks.map((track,ti)=>{
    const path=track.data.map((row,i)=>`${i?'L':'M'}${x(i)},${y(row.value)}`).join(' ');
    return `<path d="${path}" class="data-line line-${ti}"/>${track.data.map((row,i)=>{
      const label=`${row.year} · ${track.title}: ${fmt(row.value,track.digits)} ${track.unit} · ${classify(group.id,row.value).label}`;
      return `<circle cx="${x(i)}" cy="${y(row.value)}" r="5" class="data-point point-${ti}" tabindex="0" role="img" aria-label="${esc(label)}" data-point="${esc(label)}"><title>${esc(label)}</title></circle><text x="${x(i)+(i===0?9:i===years.length-1?-9:0)}" y="${y(row.value)-13}" text-anchor="${i===0?'start':i===years.length-1?'end':'middle'}" class="point-label label-${ti}">${fmt(row.value,group.id==='trade'?4:tracks[0].digits)}</text>`;
    }).join('')}`;
  }).join('');
  return `<div class="chart-legend">${tracks.map((track,i)=>`<span><i class="legend-line line-${i}"></i>${tracks.length===1?track.short:track.short}</span>`).join('')}<span class="band-explanation"><i class="legend-band"></i>Оптимальний інтервал</span></div><div class="chart-scroll" tabindex="0" role="region" aria-label="Графік: ${esc(group.title)}. На вузькому екрані доступне горизонтальне прокручування."><svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="chart-${group.id}-title chart-${group.id}-desc"><title id="chart-${group.id}-title">${esc(group.title)}: ${years[0]}–${years.at(-1)}</title><desc id="chart-${group.id}-desc">Одиниця: ${tracks[0].unit}. Зелена смуга позначає оптимальний інтервал ${group.optimal}. Пунктирна лінія: ${group.guideLabel}. Усі значення та рівні наведено також у таблиці.</desc><rect x="${left}" y="${y(visibleHigh)}" width="${w-left-right}" height="${y(low)-y(visibleHigh)}" class="optimal-band threshold-mark"/>${group.ticks.map(v=>`<line x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="${left-13}" y="${y(v)+4}" text-anchor="end" class="axis-label">${fmt(v,group.id==='trade'?2:Number.isInteger(v)?0:1)}</text>`).join('')}<line x1="${left}" x2="${w-right}" y1="${y(group.guide)}" y2="${y(group.guide)}" class="guide-line threshold-mark"/>${years.map((year,i)=>`<text x="${x(i)}" y="${h-15}" text-anchor="middle" class="axis-label">${year}</text>`).join('')}${paths}</svg></div><p class="chart-scroll-hint">Прокручуйте графік горизонтально, щоб переглянути всі роки.</p><div class="chart-readout" aria-live="polite">Наведіть на точку або перейдіть до неї клавішею Tab, щоб побачити оцінку.</div><p class="chart-note band-explanation">Пунктир: ${esc(group.guideLabel)}. Оптимум: ${esc(group.optimal)}. Повна шкала — у методиці.</p>`;
}
