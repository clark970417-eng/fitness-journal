(()=>{'use strict';
const host=document.getElementById('fitness-dashboard'),core=window.FitnessCore;
let period='day',anchor=new Date(),selectedExercise='';
const key=core.dateKey,fmt=n=>Number(n||0).toLocaleString('zh-TW',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function range(){if(period!=='day')return core.bounds(period,anchor);const start=new Date(anchor);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);return{start,end};}
function completed(ex){return(ex.sets||[]).filter(s=>s.done!==false&&core.validSet(s));}
function render(){
const state=window.FitnessV4?.snapshot();if(!state)return;
const history=state.history.filter(e=>!String(e.id).startsWith('sample-')), {start,end}=range();
const entries=history.filter(e=>new Date(e.date)>=start&&new Date(e.date)<end),volume=entries.reduce((n,e)=>n+core.historyVolume(e),0);
const muscles={};entries.forEach(e=>e.exercises?.forEach(ex=>{if(completed(ex).every(s=>s.durationMin))return;muscles[ex.group||'其他']=(muscles[ex.group||'其他']||0)+completed(ex).length;}));
const timedMinutes=entries.reduce((sum,e)=>sum+(e.exercises||[]).reduce((n,ex)=>n+completed(ex).reduce((v,s)=>v+(s.durationMin||0),0),0),0);
const dateLabel=period==='year'?`${start.getFullYear()} 年`:period==='month'?`${start.getFullYear()} 年 ${start.getMonth()+1} 月`:period==='day'?start.toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'}):`${start.getMonth()+1}/${start.getDate()} — ${new Date(end-86400000).getMonth()+1}/${new Date(end-86400000).getDate()}`;
let buckets=period==='day'?Object.entries(muscles).map(([label,value])=>({label,value})):core.stats(history,period,anchor).buckets;
if(period==='month') {
 const daily=buckets;buckets=Array.from({length:4},(_,i)=>({label:`第${i+1}週`,value:0}));
 daily.forEach((b,i)=>{buckets[Math.min(3,Math.floor(i/7))].value+=b.value;});
}
const max=Math.max(1,...buckets.map(b=>b.value));
const names=[...new Set(history.flatMap(e=>(e.exercises||[]).filter(ex=>completed(ex).some(s=>!s.durationMin)).map(ex=>ex.name)))];
if(!names.includes(selectedExercise))selectedExercise=names[0]||'';
const weights=buckets.map(()=>null);
entries.forEach(entry=>entry.exercises?.filter(ex=>ex.name===selectedExercise).forEach(ex=>{
 const d=new Date(entry.date);const index=period==='day'?buckets.findIndex(b=>b.label===(ex.group||'其他')):period==='year'?d.getMonth():period==='month'?Math.min(3,Math.floor((d.getDate()-1)/7)):(d.getDay()+6)%7;
 const sets=completed(ex);if(index>=0&&sets.length)weights[index]=Math.max(weights[index]||0,...sets.map(set=>Number(set.weight)));
}));
const maxWeight=Math.max(1,...weights.filter(n=>n!==null));
const xy=(v,i)=>`${(i+.5)/Math.max(1,buckets.length)*100},${100-v/maxWeight*88}`;
const line=weights.map((v,i)=>v===null?'':`${i?'L':'M'} ${xy(v,i)}`).filter(Boolean).join(' ').replace(/^L/,'M');
const overlay=`<svg class="fitness-weight-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${line}"/>${weights.map((v,i)=>v===null?'':`<circle cx="${(i+.5)/buckets.length*100}" cy="${100-v/maxWeight*88}" r="1"><title>${fmt(v)} kg</title></circle>`).join('')}</svg>`;
const controlsMarkup=`${['day','week','month','year'].map((p,i)=>`<button type="button" data-period="${p}" aria-pressed="${p===period}">${['日','週','月','年'][i]}</button>`).join('')}`;
host.innerHTML=`<section class="fitness-chart-card" tabindex="0" aria-label="訓練圖表，左右滑動切換期間"><div class="fitness-chart-heading"><div class="fitness-date-nav"><button type="button" data-shift="-1" aria-label="上一期間">‹</button><strong>${dateLabel}</strong><button type="button" data-shift="1" aria-label="下一期間">›</button></div><div class="fitness-periods" id="fitness-chart-periods" role="group" aria-label="訓練量期間">${controlsMarkup}</div></div><div class="fitness-volume"><span>${period==='day'?'當天完成量':'期間總量'}</span><strong>${fmt(volume)} <small>kg</small></strong></div>
${timedMinutes?`<p class="chart-caption">有氧／伸展完成 ${fmt(timedMinutes)} 分鐘</p>`:''}${names.length?`<div class="fitness-inline-legend"><span>● ${period==='day'?'部位組數':'完成容量'}</span><label>折線重量 <select aria-label="查看動作進步" id="fitness-progress-exercise">${names.map(n=>`<option ${n===selectedExercise?'selected':''}>${esc(n)}</option>`).join('')}</select></label><small>最高 ${fmt(maxWeight)} kg</small></div>`:''}<div class="fitness-integrated-plot">${overlay}<div class="fitness-bars " aria-label="${period==='day'?'部位完成組數':'完成容量，點選查看細節'}">${buckets.map((b,i)=>`<button type="button" data-bucket="${i}" aria-label="${esc(b.label)}：${fmt(b.value)} ${period==='day'?'組':'kg'}${weights[i]!==null?`，完成重量 ${fmt(weights[i])} kg`:''}"><span class="bar-track"><i style="height:${b.value?Math.max(3,b.value/max*100):0}%"></i></span><small>${esc(b.label)}</small></button>`).join('')}</div></div>${period==='day'?`<div class="fitness-muscles">${Object.entries(muscles).map(([g,n])=>`<span>${esc(g)} <b>${n} 組</b></span>`).join('')||(timedMinutes ? '<span>當天尚無重量訓練紀錄</span>' : '<span>當天尚無完成紀錄</span>')}</div>`:`<p class="chart-caption">${period==='year'?'點月份查看四週完成量':period==='month'?'1–7／8–14／15–21／22–月底，含月底所有紀錄':'點日期查看當天部位與動作'} · kg = 重量 × 完成次數</p>`}</section>
`;
const select=host.querySelector('select');if(select)select.onchange=()=>{selectedExercise=select.value;render();};
host.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;render();});
host.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{const d=Number(b.dataset.shift);if(period==='day')anchor.setDate(anchor.getDate()+d);else anchor=core.shift(period,anchor,d);render();});
host.querySelectorAll('[data-bucket]').forEach(b=>b.onclick=()=>{if(period==='day')return;anchor=new Date(start);const i=Number(b.dataset.bucket);if(period==='year'){anchor.setMonth(i);period='month';}else if(period==='month'){anchor.setDate(1+i*7);period='week';}else{anchor.setDate(anchor.getDate()+i);period='day';}render();});
host.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{anchor=new Date(b.dataset.day+'T12:00:00');period='day';render();});
}
const periods=['day','week','month','year'];let gesture=null,suppressClickUntil=0;
function switchPeriod(dx){const index=periods.indexOf(period);const next=Math.max(0,Math.min(3,index+(dx<0?1:-1)));if(next!==index){period=periods[next];render();suppressClickUntil=Date.now()+350;}}
host.addEventListener('pointerdown',e=>{if(e.target.closest('select,input,button[data-shift]')||e.button!==0)return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId};});
window.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.7)switchPeriod(dx);});
host.addEventListener('pointercancel',()=>{gesture=null;});
host.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
host.addEventListener('keydown',e=>{if(e.target.closest('select,input'))return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();switchPeriod(e.key==='ArrowRight'?-60:60);}});
window.renderFitnessDashboard=render;render();window.addEventListener('pocket-fitness-updated',render);
})();
