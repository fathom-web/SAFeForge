'use strict';
/* Ceremonie Planner guidance: ART/team context, checks, cadence, Excel export. */
function ceEnsure(){
 if(!state.context||typeof state.context!=='object')state.context={art:'',team:''};
 if(!state.ceremonyChecks||typeof state.ceremonyChecks!=='object')state.ceremonyChecks={};
 if(!state.ceremonyNotes||typeof state.ceremonyNotes!=='object')state.ceremonyNotes={};
}
function ceContextValues(){
 ceEnsure();
 const art=document.getElementById('ceremonyArt'),team=document.getElementById('ceremonyTeam');
 if(art)art.value=state.context.art||'';
 if(team)team.value=state.context.team||'';
 ceFillSuggestions();
}
function ceEventSnapshot(){try{const x=JSON.parse(localStorage.getItem('safe-agile-forge-pi-event-v1'));return x&&Array.isArray(x.arts)?x:null}catch{return null}}
function ceFillSuggestions(){
 const ev=ceEventSnapshot(),arts=ev?.arts||[];
 const datalist=document.getElementById('ceremonyArts');
 const teamslist=document.getElementById('ceremonyTeams');
 if(datalist)datalist.innerHTML=arts.map(a=>'<option value="'+esc(a.name)+'"></option>').join('');
 const match=arts.find(a=>a.name===state.context.art);
 const teams=(match?match.teams:arts.flatMap(a=>a.teams)).slice(0,160);
 if(teamslist)teamslist.innerHTML=teams.map(t=>'<option value="'+esc(t.name)+'"></option>').join('');
}
function ceImportEvent(){
 const ev=ceEventSnapshot();if(!ev){toast('Geen opgeslagen PI Event Planner gevonden in deze browser.');return}
 if(ev.arts.length===0){toast('De PI Event Planner bevat nog geen ART.');return}
 state.context.art=ev.arts[0].name;
 state.context.team='';
 if(ev.piName){state.piName=ev.piName;document.getElementById('piName').value=ev.piName}
 if(ev.days?.[0]&&!state.currentPiPlanning){state.currentPiPlanning=ev.days[0];document.getElementById('currentPiPlanning').value=ev.days[0]}
 saveState();ceContextValues();ceRenderCadence();toast('PI-gegevens overgenomen. Selecteer indien nodig een andere ART en team.');
}
function ceCadenceWarnings(){
 const warnings=[],its=state.iterations.filter(i=>i.start&&i.end&&i.type==='development').sort((a,b)=>a.start.localeCompare(b.start));
 for(let j=0;j<its.length;j++){
  const current=its[j],days=calendarDays(current.start,current.end);
  if(days!==14)warnings.push(current.name+' duurt '+days+' kalenderdagen (standaardvoorstel: 14). Controleer de ART-cadans.');
  if(j>0&&its[j-1].end&&addDays(its[j-1].end,1)!==current.start)warnings.push('Tussen '+its[j-1].name+' en '+current.name+' zit een planningonderbreking of verschuiving. Stem dit met andere ARTs af.');
 }
 const first=its[0];if(first&&state.currentPiPlanning&&state.currentPiPlanning>=first.start)
  warnings.push('De huidige PI Planning begint op of na de start van iteratie 1. Controleer of dit bewust is.');
 return warnings;
}
function ceRenderCadence(){
 const place=document.getElementById('ceremonyCadenceNote');if(!place)return;
 ceEnsure();
 const c=state.context,warning=ceCadenceWarnings();
 place.innerHTML='<strong>ART: '+esc(c.art||'Nog niet gekozen')+'</strong> · Team: '+esc(c.team||'Nog niet gekozen')+
 (warning.length?'<div style="margin-top:7px;color:#946327"><strong>Cadans aandacht:</strong> '+warning.map(esc).join(' · ')+'</div>':'<div style="margin-top:6px">PI-cadans: geen bijzondere afwijkingen vastgesteld.</div>');
}
function ceMyRole(c){
 const list=[];
 if(c.planner===state.role)list.push('organiseren');
 if(c.host===state.role)list.push('faciliteren');
 if(c.owner===state.role)list.push('inhoud voorbereiden');
 if(!list.length)list.push('deelnemen en eigen acties opvolgen');
 return list.join(' · ');
}
function ceSelected(){return LIBRARY.filter(c=>state.picked[c.id])}
function ceReadinessCount(){
 ceEnsure();
 let ready=0,total=0;
 for(const c of ceSelected())for(let i=0;i<c.prepare.length;i++){total++;if((state.ceremonyChecks[c.id]||[]).includes(i))ready++}
 return {ready,total};
}
function ceRenderStats(){
 const c=ceReadinessCount(),sum=document.getElementById('readinessSummary');if(sum)sum.textContent=c.ready+'/'+c.total+' voorbereidingen klaar';
}
function ceRenderGuide(){
 const root=document.getElementById('ceremonyReadiness');if(!root)return;
 ceEnsure();const items=ceSelected();
 root.innerHTML='<div class="ceremony-guide-list">'+items.map(c=>{
 const saved=state.ceremonyChecks[c.id]||[],complete=c.prepare.length&&c.prepare.every((_,i)=>saved.includes(i));
 const status=complete?'Gereed':saved.length+' / '+c.prepare.length+' voorbereid';
 return '<details class="ceremony-guide-item"><summary><span>'+esc(c.name)+'</span><span class="ceremony-guide-status">'+esc(status)+'</span></summary>'+
 '<p class="hint"><strong>Jouw rol:</strong> '+esc(ceMyRole(c))+'<br><strong>Doel:</strong> '+esc(c.description)+'<br><strong>Resultaat:</strong> '+esc(c.output)+'</p>'+
 c.prepare.map((p,i)=>'<label class="ceremony-guide-check"><input type="checkbox" data-ce-check="'+esc(c.id)+':'+i+'" '+(saved.includes(i)?'checked':'')+'><span>'+esc(p)+'</span></label>').join('')+
 '<label class="field ceremony-guide-note"><span class="f-label">Eigen acties / notities</span><input data-ce-note="'+esc(c.id)+'" value="'+esc(state.ceremonyNotes[c.id]||'')+'" placeholder="Bijv. input van Business Owner ophalen"></label></details>';
 }).join('')+'</div>'+
 (items.length?'':'<p class="sub">Selecteer ceremonies om jouw voorbereidingschecklist te zien.</p>');
 ceRenderStats();
}
function ceExcel(){
 ceEnsure();
 const selected=ceSelected(),ev=occurrences().events,make=(title,headers,rows)=>[title,[[title+' – '+state.piName,ROLE_NAMES[state.role]||state.role,'ART: '+state.context.art],['Gegenereerd door SAFe Agile Forge'],headers,...rows]];
 const data=[
 make('Overzicht',['Onderwerp','Waarde'],[['PI',state.piName],['Rol',ROLE_NAMES[state.role]||state.role],['ART',state.context.art],['Team',state.context.team],['Ceremonies',selected.length],['Afspraken',ev.length],['Readiness',ceReadinessCount().ready+'/'+ceReadinessCount().total]]),
 make('Agenda',['Datum','Tijd','Duur minuten','Ceremonie','Iteratie','Planner','Facilitator','Inhoud eigenaar'],ev.map(x=>[x.date,x.time,x.duration,x.name,x.iteration,ROLE_NAMES[x.planner]||x.planner,ROLE_NAMES[x.host]||x.host,ROLE_NAMES[x.owner]||x.owner])),
 make('Ceremonies',['Groep','Ceremonie','Jouw verantwoordelijkheid','Omschrijving','Resultaat','Bron'],selected.map(c=>[c.group,c.name,ceMyRole(c),c.description,c.output,c.source])),
 make('Voorbereiding',['Ceremonie','Controlepunt','Status'],selected.flatMap(c=>c.prepare.map((x,i)=>[c.name,x,(state.ceremonyChecks[c.id]||[]).includes(i)?'Gereed':'Open']))),
 make('Acties en notities',['Ceremonie','Eigen notitie'],selected.map(c=>[c.name,state.ceremonyNotes[c.id]||''])),
 make('Iteraties',['Iteratie','Type','Start','Einde','Dagen'],state.iterations.map(it=>[it.name,it.type,it.start,it.end,it.start&&it.end?calendarDays(it.start,it.end):0]))
 ];
 try{
  const xlsx=workbookXlsx(data);
  saveEventBlob(xlsx,'safe-agile-forge-'+slug(state.piName)+'-'+state.role.toLowerCase()+'-planning.xlsx');
  toast('Excel met '+data.length+' tabbladen gedownload.');
 }catch(e){toast('Excel kon niet worden aangemaakt: '+e.message)}
}
const ceArt=document.getElementById('ceremonyArt'),ceTeam=document.getElementById('ceremonyTeam');
if(ceArt)ceArt.addEventListener('change',e=>{ceEnsure();state.context.art=e.target.value.trim();state.context.team='';ceFillSuggestions();ceContextValues();saveState();ceRenderCadence()});
if(ceTeam)ceTeam.addEventListener('change',e=>{ceEnsure();state.context.team=e.target.value.trim();saveState();ceRenderCadence()});
document.getElementById('ceremonyImportEvent')?.addEventListener('click',ceImportEvent);
document.getElementById('exportCeremonyExcel')?.addEventListener('click',ceExcel);
const ceGuide=document.getElementById('ceremonyReadiness');
if(ceGuide){
 ceGuide.addEventListener('change',e=>{
  const d=e.target.dataset;
  if(d.ceCheck){const [id,i]=d.ceCheck.split(':'),items=new Set(state.ceremonyChecks[id]||[]);e.target.checked?items.add(+i):items.delete(+i);state.ceremonyChecks[id]=[...items];saveState();ceRenderStats();const container=e.target.closest('.ceremony-guide-item');if(container){const current=LIBRARY.find(x=>x.id===id),count=items.size;container.querySelector('.ceremony-guide-status').textContent=count===current.prepare.length?'Gereed':count+' / '+current.prepare.length+' voorbereid'};}
  if(d.ceNote){state.ceremonyNotes[d.ceNote]=e.target.value.trim();saveState()}
 });
}
ceEnsure();ceContextValues();ceRenderGuide();ceRenderCadence();
