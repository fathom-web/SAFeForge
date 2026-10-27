'use strict';
/* PI Event Command Center extension – runs entirely in the browser.
   Everything is stored with the main event snapshot in localStorage. */
const TASK_TEMPLATES=[
 ['Invitaties en distributielijst voorbereiden','Communicatie',-28,'hoog'],
 ['Locatie en toegangsproces bevestigen','Facilitair',-28,'hoog'],
 ['Plenaire zaal en teamruimtes indelen','Facilitair',-21,'hoog'],
 ['Business Context en Product Vision afstemmen','Inhoud',-21,'hoog'],
 ['System Architect, RTEs en sprekers bevestigen','Programma',-21,'hoog'],
 ['Teamcapaciteit, features en afhankelijkheden checken','Inhoud',-14,'hoog'],
 ['Techniek, presentaties en hybride faciliteiten testen','Techniek',-7,'hoog'],
 ['RSVP-overzicht en deelnemerslijst controleren','Communicatie',-7,'hoog'],
 ['Catering definitief bestellen','Catering',-5,'hoog'],
 ['Print-/digitale draaiboeken verspreiden','Programma',-2,'normaal'],
 ['Planningsborden, PI Objectives en ROAM klaarzetten','Inhoud',-1,'hoog'],
 ['Aanwezigen ontvangen en registreren','Uitvoering',0,'hoog'],
 ['Laatste programmacontrole dag 2','Uitvoering',1,'normaal'],
 ['Acties, risico’s en evaluaties vastleggen','Nazorg',2,'normaal']
];
function ensureOperations(){
 if(!Array.isArray(state.tasks))state.tasks=TASK_TEMPLATES.map(([title,category,offset,priority])=>({id:uid(),title,category,due:'',dueOffset:offset,autoDue:true,owner:'',status:'todo',priority}));
 if(!Array.isArray(state.speakers))state.speakers=state.agenda.filter(a=>/Business Context|Product.*Vision|Architecture Vision|Confidence Vote|Final Plan Review|Draft Plan Review/.test(a.title)).map(a=>({id:uid(),agendaId:a.id,name:'',email:'',status:'pending',note:''}));
 if(!Array.isArray(state.roomSpecs))state.roomSpecs=[];
 if(!Array.isArray(state.feedback))state.feedback=[];
 if(!Array.isArray(state.dependencies))state.dependencies=[];
 if(!Array.isArray(state.actions))state.actions=[];
 if(!Array.isArray(state.people))state.people=[];
 for(const person of state.people)if(!Array.isArray(person.checkin))person.checkin=[false,false];
 for(const a of state.arts||[])for(const t of a.teams||[]){if(t.room==null)t.room='';if(t.members==null)t.members=8}
 if(state.days?.[0])for(const t of state.tasks)if(t.autoDue&&Number.isFinite(t.dueOffset))t.due=dateAdd(state.days[0],t.dueOffset);
 const teams=(state.arts||[]).flatMap(a=>a.teams||[]);
 const needed=['Plenair',...Array.from({length:Math.max(Number(state.breakoutRooms)||0,teams.length)},(_,i)=>'Breakout '+(i+1))];
 for(const [i,name] of needed.entries())if(!state.roomSpecs.some(r=>r.name===name))state.roomSpecs.push({id:uid(),name,capacity:i===0?Math.max(30,scaleCounts().people+10):10,manual:false});
 const plen=state.roomSpecs.find(r=>r.name==='Plenair');if(plen&&!plen.manual)plen.capacity=Math.max(30,scaleCounts().people+10);
}
function statusBadge(text,color='grey'){return '<span class="traffic '+color+'">'+esc(text)+'</span>'}
function operationsMetrics(){
 ensureOperations();const due=state.tasks.filter(t=>t.status!=='done').length;
 const confirmed=state.speakers.filter(s=>s.status==='confirmed').length;
 const checked=state.people.filter(p=>p.checkin.some(Boolean)).length;
 return {due,speakers:confirmed,checked,feedback:state.feedback.length};
}
function viewARTs(){
 const rows=state.arts.map(art=>{
  const people=state.people.filter(p=>p.artId===art.id);
  const statuses={yes:people.filter(p=>p.status==='yes').length,maybe:people.filter(p=>p.status==='maybe').length,invited:people.filter(p=>p.status==='invited').length};
  const tRows=art.teams.map((t,i)=>'<tr><td>'+esc(t.name)+'</td><td>'+esc(t.members)+'</td><td>'+esc(t.room||'Breakout '+(i+1))+'</td><td>'+esc(t.sm||'Nog open')+'</td><td>'+esc(t.po||'Nog open')+'</td></tr>').join('');
  return '<div class="art-overview-row"><h3>'+esc(art.name)+'</h3><p class="sub">'+art.teams.length+' teams · '+art.teams.reduce((n,t)=>n+digit(t.members),0)+' verwachte teamleden · '+people.length+' geregistreerd · '+statuses.yes+' bevestigd · '+statuses.maybe+' misschien</p><div class="tablewrap"><table style="min-width:530px"><thead><tr><th>Team</th><th>Mensen</th><th>Ruimte</th><th>Scrum Master</th><th>PO</th></tr></thead><tbody>'+tRows+'</tbody></table></div></div>';
 }).join('');
 const opts=state.arts.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('');
 return '<section class="panel">'+paneHead('MULTI-ART VISIBILITY','ARTs & afhankelijkheden','Een eigen overzicht per ART met teams en deelnemers. Noteer afhankelijkheden tussen ARTs tijdens de PI Planning.')+
 rows+'<div class="sectiondivider"></div><h3>Cross-ART afhankelijkheden</h3>'+
 (state.dependencies.length?'<div class="tablewrap"><table><thead><tr><th>Van ART</th><th>Naar ART</th><th>Afhankelijkheid</th><th>Eigenaar</th><th>Status</th><th></th></tr></thead><tbody>'+
 state.dependencies.map(d=>'<tr><td>'+esc(state.arts.find(a=>a.id===d.from)?.name||'Onbekend')+'</td><td>'+esc(state.arts.find(a=>a.id===d.to)?.name||'Onbekend')+'</td><td>'+esc(d.title)+'</td><td>'+esc(d.owner||'-')+'</td><td><select data-dependency-status="'+esc(d.id)+'">'+selectOpts(d.status,['open','in-progress','resolved'])+'</select></td><td><button class="btn small warn" data-op-remove="dependency:'+esc(d.id)+'">×</button></td></tr>').join('')+'</tbody></table></div>':'<p class="sub">Nog geen afhankelijkheden vastgelegd.</p>')+
 '<form class="entry" data-op-form="dependency"><h3>Afhankelijkheid toevoegen</h3><div class="formgrid"><label class="field"><span>Van ART</span><select name="from" required>'+opts+'</select></label><label class="field"><span>Naar ART</span><select name="to" required>'+opts+'</select></label><label class="field"><span>Beschrijving</span><input name="title" maxlength="240" required placeholder="Bijv. interface afhankelijkheid"></label><label class="field"><span>Eigenaar</span><input name="owner" maxlength="100"></label></div><div class="actions"><button class="btn primary" type="submit">+ Vastleggen</button></div></form></section>';
}
function selectOpts(value,options){const labels={todo:'Open','in-progress':'In uitvoering',done:'Afgerond',blocked:'Geblokkeerd',open:'Open',resolved:'Opgelost',pending:'Nog te bevestigen',invited:'Uitgenodigd',confirmed:'Bevestigd',unavailable:'Niet beschikbaar',low:'Laag',normal:'Normaal',high:'Hoog',hoog:'Hoog',normaal:'Normaal',critical:'Kritiek'};return options.map(o=>'<option value="'+esc(o)+'" '+(o===value?'selected':'')+'>'+esc(labels[o]||o)+'</option>').join('')}
function viewTasks(){
 ensureOperations();
 const completed=state.tasks.filter(t=>t.status==='done').length,overdue=state.tasks.filter(t=>t.status!=='done'&&t.due&&t.due<(new Date()).toISOString().slice(0,10)).length;
 return '<section class="panel">'+paneHead('EVENT OPERATIONS','Organisatie & deadlines','Maak iedereen verantwoordelijk voor een concrete taak met eigenaar, deadline, prioriteit en status.')+
 '<div class="operational-grid"><div class="operational-card"><b>'+state.tasks.length+'</b><small>Taken totaal</small></div><div class="operational-card"><b>'+completed+'</b><small>Afgerond</small></div><div class="operational-card"><b>'+overdue+'</b><small>Deadline verstreken</small></div></div>'+
 '<div class="task-list">'+state.tasks.slice().sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(t=>{
 const color=t.status==='done'?'green':t.status==='blocked'?'red':t.status==='in-progress'?'amber':'grey';
 return '<div class="task-card"><div class="task-header"><strong>'+esc(t.title)+'</strong>'+statusBadge(t.category||'Overig','grey')+'</div>'+
 '<div class="task-details"><label class="field"><span>Eigenaar</span><input data-task-value="'+esc(t.id)+':owner" value="'+esc(t.owner||'')+'" placeholder="Naam / functie"></label>'+
 '<label class="field"><span>Uiterlijk</span><input type="date" data-task-value="'+esc(t.id)+':due" value="'+esc(t.due||'')+'"></label>'+
 '<label class="field"><span>Status</span><select data-task-value="'+esc(t.id)+':status">'+selectOpts(t.status,['todo','in-progress','blocked','done'])+'</select></label>'+
 '<label class="field"><span>Prioriteit</span><select data-task-value="'+esc(t.id)+':priority">'+selectOpts(t.priority,['hoog','normaal','low'])+'</select></label></div>'+
 '<div class="actions" style="margin-top:11px"><span>'+statusBadge(t.status==='done'?'Afgerond':t.status==='blocked'?'Geblokkeerd':t.status==='in-progress'?'Loopt':'Nog te doen',color)+'</span><button class="btn small warn" data-op-remove="task:'+esc(t.id)+'">Verwijderen</button></div></div>'}).join('')+'</div>'+
 '<form class="entry task-form" data-op-form="task"><h3>Extra organisatietaak</h3><div class="formgrid"><label class="field"><span>Taak / mijlpaal</span><input name="title" maxlength="220" required placeholder="Bijv. communicatie met Business Owners"></label><label class="field"><span>Eigenaar</span><input name="owner" maxlength="100"></label><label class="field"><span>Deadline</span><input name="due" type="date"></label><label class="field"><span>Categorie</span><select name="category"><option>Organisatie</option><option>Inhoud</option><option>Facilitair</option><option>Catering</option><option>Techniek</option><option>Nazorg</option></select></label></div><div class="actions"><span class="hint">Standaard deadlines zijn voorstellen, afgeleid van dag 1. Handmatig gewijzigde datums blijven staan.</span><button class="btn primary" type="submit">+ Taak toevoegen</button></div></form></section>';
}
function viewSpeakers(){
 ensureOperations();
 return '<section class="panel">'+paneHead('FACILITATION ROSTER','Sprekers & facilitators','Leg vast wie iedere belangrijke sessie leidt en of deze persoon daadwerkelijk is bevestigd.')+
 '<div class="task-list">'+state.speakers.map(s=>{
 const agenda=state.agenda.find(a=>a.id===s.agendaId);
 return '<div class="task-card"><div class="task-header"><strong>'+esc(agenda?agenda.title:'Spreker / speciale sessie')+'</strong>'+statusBadge(s.status==='confirmed'?'Bevestigd':s.status==='unavailable'?'Niet beschikbaar':'Nog niet bevestigd',s.status==='confirmed'?'green':s.status==='unavailable'?'red':'amber')+'</div>'+
 '<div class="task-details"><label class="field"><span>Naam / aanspreekpunt</span><input data-speaker-value="'+esc(s.id)+':name" value="'+esc(s.name||'')+'" placeholder="Naam"></label>'+
 '<label class="field"><span>Contact (optioneel)</span><input type="email" data-speaker-value="'+esc(s.id)+':email" value="'+esc(s.email||'')+'"></label>'+
 '<label class="field"><span>Status</span><select data-speaker-value="'+esc(s.id)+':status">'+selectOpts(s.status,['pending','invited','confirmed','unavailable'])+'</select></label>'+
 '<label class="field"><span>Notitie</span><input data-speaker-value="'+esc(s.id)+':note" value="'+esc(s.note||'')+'"></label></div>'+
 '<div class="actions" style="margin-top:9px"><span class="hint">'+(agenda?'Dag '+(agenda.day+1)+' · '+esc(agenda.start)+'–'+esc(agenda.end):'Eigen sessie')+'</span><button class="btn small warn" data-op-remove="speaker:'+esc(s.id)+'">Verwijderen</button></div></div>'}).join('')+'</div>'+
 '<form class="entry" data-op-form="speaker"><h3>Extra spreker / sessie-eigenaar</h3><div class="formgrid"><label class="field"><span>Sessie</span><select name="agendaId"><option value="">Algemeen / nog bepalen</option>'+state.agenda.map(a=>'<option value="'+esc(a.id)+'">'+esc('Dag '+(a.day+1)+' · '+a.title)+'</option>').join('')+'</select></label><label class="field"><span>Naam</span><input name="name" maxlength="120" placeholder="Naam / rol"></label></div><div class="actions"><button class="btn primary" type="submit">+ Spreker toevoegen</button></div></form></section>';
}
function getRooms(){
 ensureOperations();
 let allTeamIndex=0,alloc={};
 for(const a of state.arts)for(const t of a.teams){const name=t.room||'Breakout '+(++allTeamIndex);if(t.room)allTeamIndex++;(alloc[name]??=[]).push({art:a.name,team:t.name,members:+t.members||0})}
 return {alloc,specs:state.roomSpecs};
}
function scheduleWarnings(){
 ensureOperations();
 const issues=[],rooms=getRooms();
 const teamCount=scaleCounts().teams;
 if(state.plenairRooms<1&&state.format!=='online')issues.push({level:'critical',title:'Geen plenaire ruimte',desc:'Bij een fysieke of hybride PI Planning is doorgaans een plenaire opstelling nodig.'});
 if(state.breakoutRooms<teamCount)issues.push({level:'warning',title:'Breakouts gedeeld',desc:teamCount+' teams, maar '+state.breakoutRooms+' beschikbare ruimten/tafels. Controleer de gedeelde indeling.'});
 const plen=state.roomSpecs.find(r=>r.name==='Plenair');
 const confirmed=state.people.filter(p=>p.status==='yes');
 const minPlen=confirmed.length||scaleCounts().people;
 if(plen&&plen.capacity<minPlen&&state.format!=='online')issues.push({level:'critical',title:'Capaciteit plenair onvoldoende',desc:'Capaciteit '+plen.capacity+', verwacht of bevestigd '+minPlen+' personen.'});
 for(const [room,teams] of Object.entries(rooms.alloc)){
  const needed=teams.reduce((n,t)=>n+t.members,0);
  const spec=state.roomSpecs.find(r=>r.name.toLowerCase()===room.toLowerCase());
  if(!spec)issues.push({level:'warning',title:'Onbekende capaciteit: '+room,desc:teams.map(x=>x.team).join(', ')+' · '+needed+' personen. Voeg capaciteit toe.'});
  else if(needed>spec.capacity)issues.push({level:'critical',title:'Ruimte te klein: '+room,desc:needed+' teamleden, capaciteit '+spec.capacity+'.'});
 }
 const intervals=state.agenda.filter(a=>a.start&&a.end).sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start));
 for(const a of intervals){
  if(a.end<=a.start)issues.push({level:'critical',title:'Ongeldige sessietijd',desc:a.title+' eindigt voor/bij start ('+a.start+'–'+a.end+').'});
 }
 for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){
  const a=intervals[i],b=intervals[j];if(b.day>a.day)break;if(a.end<=b.start||b.end<=a.start)continue;
  const sameLocation=(a.location||'').trim().toLowerCase()&&a.location.trim().toLowerCase()===b.location?.trim().toLowerCase();
  const generic=/^teamruimte/i.test(a.location||'');
  const sameOwner=(a.owner||'').trim().toLowerCase()&&a.owner.trim().toLowerCase()===b.owner?.trim().toLowerCase();
  if(sameLocation&&!generic)issues.push({level:'critical',title:'Ruimteconflict: '+a.location,desc:'Dag '+(a.day+1)+': "'+a.title+'" en "'+b.title+'" overlappen.'});
  else if(sameOwner&&a.owner?.trim().length>4&&!/organisat|scrum master|teams|management|rte/i.test(a.owner))issues.push({level:'warning',title:'Facilitator mogelijk dubbel geboekt',desc:a.owner+' staat bij '+a.title+' en '+b.title+' op hetzelfde moment.'});
 }
 for(const s of state.speakers){const a=state.agenda.find(x=>x.id===s.agendaId);if(a&&!s.name&&s.status!=='confirmed')issues.push({level:'warning',title:'Spreker nog niet ingevuld',desc:a.title+' op dag '+(a.day+1)+'.'});}
 for(let i=0;i<state.speakers.length;i++)for(let j=i+1;j<state.speakers.length;j++){
  const a=state.speakers[i],b=state.speakers[j];if(!a.name||a.name.toLowerCase()!==b.name.toLowerCase())continue;
  const sa=state.agenda.find(x=>x.id===a.agendaId),sb=state.agenda.find(x=>x.id===b.agendaId);
  if(sa&&sb&&sa.id!==sb.id&&sa.day===sb.day&&sa.start<sb.end&&sb.start<sa.end)issues.push({level:'critical',title:'Spreker dubbel geboekt: '+a.name,desc:sa.title+' en '+sb.title+' overlappen.'});
 }
 return issues;
}
function viewAudit(){
 const issues=scheduleWarnings(),rooms=getRooms();
 const total=issues.filter(x=>x.level==='critical').length,warning=issues.length-total;
 return '<section class="panel">'+paneHead('PRE-FLIGHT CONTROL','Conflicten & capaciteit','Automatische signalen over ruimtebezetting, sessies, sprekers en teamcapaciteit. Controleer altijd de echte situatie.')+
 '<div class="operational-grid"><div class="operational-card"><b>'+total+'</b><small>Kritieke signalen</small></div><div class="operational-card"><b>'+warning+'</b><small>Aandachtspunten</small></div><div class="operational-card"><b>'+rooms.specs.length+'</b><small>Ruimtes in de lijst</small></div></div>'+
 (issues.length?issues.map(x=>'<div class="audit-issue '+(x.level==='critical'?'critical':'')+'">'+statusBadge(x.level==='critical'?'LET OP':'CHECK',x.level==='critical'?'red':'amber')+'<div><strong>'+esc(x.title)+'</strong><p>'+esc(x.desc)+'</p></div></div>').join(''):'<div class="audit-good">✓ Geen conflicten gedetecteerd op basis van de ingevoerde gegevens.</div>')+
 '<div class="sectiondivider"></div><h3>Ruimtes en capaciteit instellen</h3><p class="sub">Controleer capaciteit per zaal of tafel. Een aangepaste capaciteit wordt niet meer automatisch overschreven.</p>'+
 '<div class="tablewrap"><table style="min-width:490px"><thead><tr><th>Ruimte</th><th>Capaciteit</th><th>Toegewezen teams</th><th></th></tr></thead><tbody>'+
 rooms.specs.map(r=>'<tr><td><input data-cap-name="'+esc(r.id)+'" value="'+esc(r.name)+'" aria-label="Ruimtenaam"></td><td><input type="number" min="1" max="5000" data-capacity="'+esc(r.id)+'" value="'+esc(r.capacity)+'"></td><td>'+esc((rooms.alloc[r.name]||[]).map(t=>t.team).join(', ')||'Plenair / nog vrij')+'</td><td><button class="btn small warn" data-op-remove="room:'+esc(r.id)+'">×</button></td></tr>').join('')+'</tbody></table></div>'+
 '<form class="entry" data-op-form="room"><h3>Ruimte toevoegen</h3><div class="formgrid"><label class="field"><span>Naam</span><input name="name" required placeholder="Bijv. zaal C14"></label><label class="field"><span>Capaciteit</span><input name="capacity" type="number" min="1" max="5000" value="12"></label></div><div class="actions"><button class="btn primary" type="submit">+ Ruimte toevoegen</button></div></form>'+
 '<p class="smallprint">Conflicten zijn indicaties. Parallelle teambreakouts en hybride sessies kunnen bijzondere afspraken hebben. De tool kent geen echte reserveringen van locaties.</p></section>';
}
function checkStats(day){const list=state.people.filter(p=>p.status==='yes'&&p.days[day]);const arrived=list.filter(p=>p.checkin[day]);const meals=arrived.filter(p=>p.meals[day]!=='none');return {list,arrived,meals}}
function viewCheckin(){
 ensureOperations();const boxes=[0,1].map(day=>{
  const c=checkStats(day);
  return '<div class="agenda-day"><h3>Dag '+(day+1)+' · '+when(state.days[day])+' · '+c.arrived.length+'/'+c.list.length+' aanwezig · '+c.meals.length+' lunches bij aankomst</h3>'+
  (c.list.length?c.list.map(p=>'<div class="checkin-row"><div><strong>'+esc(p.name)+'</strong><small>'+esc(state.arts.find(a=>a.id===p.artId)?.name||p.role||'Deelnemer')+' · '+esc(p.meals[day]||'regular')+'</small></div><button class="btn small checkin-action '+(p.checkin[day]?'active':'')+'" data-checkin="'+esc(p.id)+':'+day+'">'+(p.checkin[day]?'✓ Binnen':'Check in')+'</button></div>').join(''):'<div class="empty">Geen bevestigde deelnemers voor dag '+(day+1)+'.</div>')+'</div>';
 }).join('');
 return '<section class="panel">'+paneHead('DAY-OF OPERATIONS','Check-in & werkelijke opkomst','Gebruik dit overzicht bij de ingang. Alleen bevestigde deelnemers worden getoond; RSVP-status pas je aan onder Deelnemers.')+
 boxes+'<div class="introbox"><strong>Live overzicht:</strong> de check-in wordt alleen op dit apparaat opgeslagen. Voor meerdere check-in medewerkers is gedeelde opslag vereist.</div></section>';
}
function viewFeedback(){
 ensureOperations();const scores=state.feedback.map(f=>Number(f.score)||0).filter(x=>x>0);
 const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toLocaleString('nl-NL',{maximumFractionDigits:1}):'–';
 return '<section class="panel">'+paneHead('RETROSPECTIVE & FOLLOW-UP','Evaluatie & verbeteracties','Leg feedback, scores, acties, eigenaren en voortgang vast voor een betere volgende PI Planning.')+
 '<div class="operational-grid"><div class="operational-card"><b>'+state.feedback.length+'</b><small>Feedbackpunten</small></div><div class="operational-card"><b>'+avg+'</b><small>Gemiddelde score / 5</small></div><div class="operational-card"><b>'+state.feedback.filter(f=>f.status==='done').length+'</b><small>Acties afgerond</small></div></div>'+
 (state.feedback.length?state.feedback.map(f=>'<div class="feedback-card"><div class="task-header"><strong>'+esc(f.title)+'</strong>'+statusBadge(f.score?f.score+'/5':'Actie',f.status==='done'?'green':'amber')+'</div><p>'+esc(f.comment||'Geen toelichting')+'</p><div class="formgrid"><label class="field"><span>Eigenaar</span><input data-feedback-value="'+esc(f.id)+':owner" value="'+esc(f.owner||'')+'"></label><label class="field"><span>Status</span><select data-feedback-value="'+esc(f.id)+':status">'+selectOpts(f.status,['todo','in-progress','done'])+'</select></label></div><div class="actions" style="margin-top:10px"><button class="btn small warn" data-op-remove="feedback:'+esc(f.id)+'">Verwijder</button></div></div>').join(''):'<p class="sub">Nog geen evaluatiepunten vastgelegd.</p>')+
 '<form data-op-form="feedback" class="entry"><h3>Feedback of actie toevoegen</h3><div class="formgrid"><label class="field"><span>Onderwerp</span><input name="title" maxlength="180" required placeholder="Wat ging goed / wat verbeteren?"></label><label class="field"><span>Beoordeling (optioneel)</span><select name="score"><option value="0">Geen score</option>'+[1,2,3,4,5].map(x=>'<option value="'+x+'">'+x+' / 5</option>').join('')+'</select></label><label class="field"><span>Actiehouder</span><input name="owner" maxlength="90"></label><label class="field"><span>Toelichting / concrete actie</span><textarea name="comment" rows="2" maxlength="1500"></textarea></label></div><div class="actions"><button type="submit" class="btn primary">+ Vastleggen</button></div></form><p class="smallprint">Feedback is lokaal vastgelegd. Er is geen gehoste enquête of automatische uitslagenpagina.</p></section>';
}
function operationalClick(e){
 const button=e.target.closest('button');if(!button)return false;
 if(button.dataset.checkin!==undefined){
  const [id,day]=button.dataset.checkin.split(':'),p=state.people.find(p=>p.id===id);
  if(p){p.checkin[+day]=!p.checkin[+day];save();renderDashboard()}return true;
 }
 if(button.dataset.opRemove!==undefined){
  const [kind,id]=button.dataset.opRemove.split(':');
  const lists={task:'tasks',speaker:'speakers',feedback:'feedback',dependency:'dependencies',room:'roomSpecs'};
  const prop=lists[kind];if(prop&&window.confirm('Dit onderdeel verwijderen?')){state[prop]=state[prop].filter(x=>x.id!==id);save();renderDashboard()}return true;
 }
 return false;
}
function operationalChange(e){
 const d=e.target.dataset,find=(arr,id)=>arr.find(x=>x.id===id);
 const keys=[['taskValue','tasks'],['speakerValue','speakers'],['feedbackValue','feedback']];
 for(const [attr,list]of keys){
  if(d[attr]!==undefined){const [id,field]=d[attr].split(':'),obj=find(state[list],id);if(obj){
   obj[field]=e.target.value;
   if(list==='tasks'&&field==='due')obj.autoDue=false;
   save();if(field!=='owner'&&field!=='name'&&field!=='email'&&field!=='note'&&field!=='title')renderDashboard();
  }return true}
 }
 if(d.capacity!==undefined){const r=find(state.roomSpecs,d.capacity);if(r){r.capacity=Math.max(1,+e.target.value||1);r.manual=true;save();renderDashboard()}return true}
 if(d.capName!==undefined){const r=find(state.roomSpecs,d.capName);if(r){r.name=e.target.value.trim();r.manual=true;save();renderDashboard()}return true}
 if(d.dependencyStatus!==undefined){const r=find(state.dependencies,d.dependencyStatus);if(r){r.status=e.target.value;save();renderDashboard()}return true}
 return false;
}
function operationalSubmit(e){
 const kind=e.target.dataset.opForm;if(!kind)return false;e.preventDefault();
 const d=new FormData(e.target),get=k=>String(d.get(k)||'').trim();
 if(kind==='task'&&get('title'))state.tasks.push({id:uid(),title:get('title'),category:get('category'),owner:get('owner'),status:'todo',priority:'normaal',due:get('due'),autoDue:false});
 if(kind==='speaker')state.speakers.push({id:uid(),agendaId:get('agendaId'),name:get('name'),email:'',status:'pending',note:''});
 if(kind==='room'&&get('name'))state.roomSpecs.push({id:uid(),name:get('name'),capacity:Math.max(1,+get('capacity')||10),manual:true});
 if(kind==='dependency'&&get('title'))state.dependencies.push({id:uid(),from:get('from'),to:get('to'),title:get('title'),owner:get('owner'),status:'open'});
 if(kind==='feedback'&&get('title'))state.feedback.push({id:uid(),title:get('title'),comment:get('comment'),score:+get('score')||0,owner:get('owner'),status:'todo'});
 save();renderDashboard();toast('Opgeslagen.');return true;
}
function makeRsvpUrl(){
 const payload={eventName:state.eventName,piName:state.piName,days:state.days,venue:state.venue,format:state.format,email:state.email,
  arts:state.arts.map(a=>({id:a.id,name:a.name,teams:a.teams.map(t=>({id:t.id,name:t.name}))}))};
 const json=JSON.stringify(payload);
 return new URL('rsvp.html#event='+encodeURIComponent(json),window.location.href).href;
}
function operationalAction(a){
 if(a==='eventPdf'){exportEventPDF();return true}
 if(a==='eventExcel'){exportEventExcel();return true}
 if(a==='rsvpLink'){if(!state.email){toast('Vul eerst een contact-e-mailadres in bij Instellingen.');return true}
  const url=makeRsvpUrl();
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(url).then(()=>toast('RSVP-link gekopieerd.')).catch(()=>window.prompt('Kopieer de link',url))}
  else window.prompt('Kopieer de link',url);return true;
 }
 return false;
}
function attachOperationalButtons(){
 const p=$('eventPDF'),x=$('eventExcel');if(p)p.addEventListener('click',()=>exportEventPDF());if(x)x.addEventListener('click',()=>exportEventExcel());
}
ensureOperations();
attachOperationalButtons();
if(state.ready)renderDashboard();
