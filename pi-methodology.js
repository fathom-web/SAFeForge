'use strict';
/* SAFe Forge – classical PI Planning methodological guidance.
   Only local data; reference defaults are suggestions, not SAFe certification. */
const MF_READINESS=[
 ['organization','RTE, Product Management, Business Owners en beslissers zijn bevestigd','RTE'],
 ['organization','Teams, rollen, capaciteit en deelnemende ARTs zijn bekend','RTE'],
 ['organization','Escalatiepad en management review zijn voorbereid','RTE'],
 ['content','Business Context, Product Vision en roadmap zijn voorbereid','PM / Business Owners'],
 ['content','ART Backlog en geprioriteerde features zijn gereed','PM'],
 ['content','Architectuurvisie, enablers, NFRs en afhankelijkheden zijn voorbereid','System Architect'],
 ['content','Teamcapaciteit en bekende beperkingen zijn geïnventariseerd','PO / SM'],
 ['logistics','Plenaire en teamruimtes en toegankelijkheid zijn bevestigd','Organisatie'],
 ['logistics','Techniek, hybride deelname en sprekers zijn getest','Organisatie'],
 ['logistics','Uitnodigingen en catering zijn georganiseerd','Organisatie'],
 ['logistics','Borden voor objectives, dependencies, risico’s en votes zijn beschikbaar','RTE']
];
function mfEnsure(){
 if(!state.method||typeof state.method!=='object')state.method={};
 const m=state.method;
 if(!Array.isArray(m.readiness))m.readiness=MF_READINESS.map((x,i)=>({id:'r'+i,group:x[0],title:x[1],owner:x[2],status:'open',note:''}));
 for(const name of ['capacity','objectives','features','risks','votes','decisions'])if(!Array.isArray(m[name]))m[name]=[];
 if(!m.rework)m.rework='not-needed';
 if(!m.profile)m.profile='classical-safe';
 const teams=state.arts.flatMap(a=>a.teams.map(t=>({art:a,team:t}))),ids=new Set(teams.map(x=>x.team.id));
 for(const x of teams){
  for(let i=1;i<=4;i++)if(!m.capacity.some(c=>c.teamId===x.team.id&&c.iteration===i))m.capacity.push({id:uid(),teamId:x.team.id,iteration:i,available:(+x.team.members||8)*8,planned:0});
  if(!m.votes.some(v=>v.teamId===x.team.id))m.votes.push({id:uid(),teamId:x.team.id,score:0,note:''});
 }
 m.capacity=m.capacity.filter(c=>ids.has(c.teamId));m.votes=m.votes.filter(v=>ids.has(v.teamId));
}
function mfTeam(id){for(const a of state.arts)for(const t of a.teams)if(t.id===id)return {art:a,team:t};return null}
function mfTeams(){return state.arts.flatMap(a=>a.teams.map(t=>({id:t.id,name:a.name+' / '+t.name})))}
function mfSelect(vals,selected){return vals.map(v=>'<option value="'+esc(v[0])+'" '+(String(v[0])===String(selected)?'selected':'')+'>'+esc(v[1])+'</option>').join('')}
function mfOpts(values,sel){return mfSelect(values,sel)}
function mfInput(label,name,kind='text',required=false){return '<label class="field"><span>'+esc(label)+'</span><input name="'+name+'" type="'+kind+'" '+(required?'required':'')+'></label>'}
function mfHead(k,title,desc){return '<section class="panel mf-view"><div class="kicker">'+k+'</div><h2>'+title+'</h2><p class="sub">'+desc+'</p>'}
function mfCounters(array){return '<div class="operational-grid">'+array.map(x=>'<div class="operational-card"><b>'+esc(x[1])+'</b><small>'+esc(x[0])+'</small></div>').join('')+'</div>'}
function mfForm(kind,title,fields){return '<form data-mf-form="'+kind+'" class="entry"><h3>'+title+'</h3><div class="formgrid">'+fields+'</div><div class="actions"><button class="btn primary" type="submit">+ Toevoegen</button></div></form>'}
function mfReadiness(){
 mfEnsure();const m=state.method.readiness,groups=[['organization','Organizational Readiness'],['content','Content Readiness'],['logistics','Logistics Readiness']];
 let content=mfHead('01 / PREPARATION','PI Planning Readiness','Check niet alleen de locatie en de uitnodigingen: ook de besluitvorming, visie, backlog, capaciteit en architectuurinput moeten gereed zijn.');
 content+=mfCounters(groups.map(([id,title])=>[title,Math.round(m.filter(x=>x.group===id&&x.status==='ready').length/m.filter(x=>x.group===id).length*100)+'%']));
 for(const [id,title]of groups){
  const rows=m.filter(x=>x.group===id),ready=rows.filter(x=>x.status==='ready').length;
  content+='<div class="mf-ready"><h3>'+title+' <small>'+ready+'/'+rows.length+'</small></h3><div class="mf-meter"><span style="width:'+Math.round(100*ready/rows.length)+'%"></span></div>';
  for(const x of rows)content+='<div class="mf-ready-row"><div><strong>'+esc(x.title)+'</strong><small>Voorstel eigenaar: '+esc(x.owner)+'</small></div><select data-mf="readiness:'+x.id+':status">'+mfOpts([['open','Open'],['working','Mee bezig'],['ready','Gereed']],x.status)+'</select><input aria-label="Toelichting" placeholder="Bewijs / eigenaar" data-mf="readiness:'+x.id+':note" value="'+esc(x.note)+'"></div>';
  content+='</div>';
 }
 return content+'<p class="smallprint">Een gereedmelding is een handmatige bevestiging, geen automatische SAFe-goedkeuring.</p></section>';
}
function mfCapacity(){
 mfEnsure();const rows=state.method.capacity,over=rows.filter(x=>+x.planned>+x.available);
 return mfHead('02 / CAPACITY','Teamcapaciteit per iteratie','Kies per team een consistente meeteenheid. Verwerk vakanties en afwezigheid voordat je commitment vraagt.')+
 '<div class="introbox">De beginwaarden zijn een schatting op basis van de teamgrootte, géén gevalideerde capaciteit. Laat teams deze zelf aanpassen.</div>'+
 mfCounters([['Capaciteitsregels',rows.length],['Overbelast',over.length],['ARTs',state.arts.length]])+
 '<div class="tablewrap"><table><thead><tr><th>ART</th><th>Team</th><th>Iteratie</th><th>Beschikbaar</th><th>Gepland</th><th>Belasting</th></tr></thead><tbody>'+
 rows.map(x=>{const t=mfTeam(x.teamId),pct=x.available?Math.round(x.planned/x.available*100):0;
 return '<tr><td>'+esc(t?.art.name||'')+'</td><td>'+esc(t?.team.name||'')+'</td><td>I'+x.iteration+'</td><td><input type="number" min="0" data-mf="capacity:'+x.id+':available" value="'+x.available+'"></td><td><input type="number" min="0" data-mf="capacity:'+x.id+':planned" value="'+x.planned+'"></td><td><span class="traffic '+(pct>100?'red':'green')+'">'+pct+'%</span></td></tr>'}).join('')+'</tbody></table></div></section>';
}
function mfObjectives(){
 mfEnsure();const x=state.method.objectives;
 return mfHead('03 / OBJECTIVES','PI Objectives & Business Value','Business Owners kennen Planned BV toe op een schaal van 1–10. Maak onderscheid tussen committed en uncommitted doelen.')+
 mfCounters([['Objectives',x.length],['Committed',x.filter(i=>i.commitment==='committed').length],['Met Business Value',x.filter(i=>+i.plannedBV>0).length]])+
 '<div class="tablewrap"><table><thead><tr><th>Team</th><th>Doelstelling</th><th>Soort</th><th>Planned BV</th><th>Actual BV</th><th>Status</th><th></th></tr></thead><tbody>'+
 (x.length?x.map(o=>'<tr><td>'+esc(mfTeam(o.teamId)?.team.name||'')+'</td><td><input data-mf="objectives:'+o.id+':title" value="'+esc(o.title)+'"></td><td><select data-mf="objectives:'+o.id+':commitment">'+mfOpts([['committed','Committed'],['uncommitted','Uncommitted']],o.commitment)+'</select></td><td><input type="number" min="0" max="10" data-mf="objectives:'+o.id+':plannedBV" value="'+o.plannedBV+'"></td><td><input type="number" min="0" max="10" data-mf="objectives:'+o.id+':actualBV" value="'+o.actualBV+'"></td><td><select data-mf="objectives:'+o.id+':status">'+mfOpts([['planned','Gepland'],['ontrack','Op schema'],['risk','Risico'],['done','Gereed']],o.status)+'</select></td><td><button class="btn small warn" data-mf-delete="objectives:'+o.id+'">×</button></td></tr>').join(''):'<tr><td colspan="7">Nog geen objectives ingevoerd</td></tr>')+'</tbody></table></div>'+
 mfForm('objectives','Team PI Objective toevoegen','<label class="field"><span>Team</span><select name="teamId">'+mfOpts(mfTeams().map(t=>[t.id,t.name]),'')+'</select></label>'+mfInput('Doelstelling','title','text',true)+
 '<label class="field"><span>Commitment</span><select name="commitment">'+mfOpts([['committed','Committed'],['uncommitted','Uncommitted']],'committed')+'</select></label>'+
 '<label class="field"><span>Planned BV (1–10)</span><input type="number" min="1" max="10" name="plannedBV"></label>')+'</section>';
}
function mfBoard(){
 mfEnsure();const items=state.method.features;let board='';
 for(const art of state.arts){
  board+='<h3>'+esc(art.name)+'</h3><div class="mf-board"><div class="mf-board-h">Team</div>'+[1,2,3,4].map(i=>'<div class="mf-board-h">I'+i+'</div>').join('');
  for(const team of art.teams){
   board+='<div class="mf-board-team">'+esc(team.name)+'</div>';
   for(let i=1;i<=4;i++)board+='<div class="mf-board-cell">'+items.filter(o=>o.teamId===team.id&&o.iteration===i).map(o=>'<div class="mf-feature"><strong>'+esc(o.title)+'</strong><small>'+esc(o.type)+'</small><button data-mf-delete="features:'+o.id+'" type="button">×</button></div>').join('')+'</div>';
  }board+='</div>';
 }
 return mfHead('04 / ART PLANNING BOARD','Planning Board','Visualiseer de voorlopige verdeling van features en enablers over teams en iteraties. Koppel dit aan capaciteit en afhankelijkheden.')+
 mfCounters([['Features / enablers',items.length],['Teams',mfTeams().length],['ARTs',state.arts.length]])+
 '<div class="mf-board-scroll">'+board+'</div>'+
 mfForm('features','Feature toevoegen','<label class="field"><span>Team</span><select name="teamId">'+mfOpts(mfTeams().map(t=>[t.id,t.name]),'')+'</select></label>'+mfInput('Feature / enabler','title','text',true)+
 '<label class="field"><span>Iteratie</span><select name="iteration">'+mfOpts([[1,'I1'],[2,'I2'],[3,'I3'],[4,'I4']],1)+'</select></label>'+
 '<label class="field"><span>Type</span><select name="type">'+mfOpts([['Feature','Feature'],['Enabler','Enabler']],'Feature')+'</select></label>')+
 '<p class="smallprint">Bepaal echte featuretoewijzing samen met teams. Cross-ART afhankelijkheden beheer je in ART-overzicht.</p></section>';
}
function mfRisks(){
 mfEnsure();const m=state.method.risks,cats=['Open','Resolved','Owned','Accepted','Mitigated'];
 return mfHead('05 / PI RISKS','ROAM Risk Board','Resolved, Owned, Accepted en Mitigated. Risico’s zonder eigenaar mogen niet op Owned staan.')+
 mfCounters([['Risico’s',m.length],['Open',m.filter(x=>x.roam==='Open').length],['Met eigenaar',m.filter(x=>x.owner).length]])+
 '<div class="mf-roam">'+cats.map(cat=>'<div class="mf-roam-col"><h3>'+cat+'</h3>'+
 m.filter(x=>x.roam===cat).map(x=>'<div class="mf-risk"><strong>'+esc(x.title)+'</strong><small>'+esc(x.owner||'Eigenaar ontbreekt')+'</small><select data-mf="risks:'+x.id+':roam">'+mfOpts(cats.map(c=>[c,c]),x.roam)+'</select><input data-mf="risks:'+x.id+':action" value="'+esc(x.action||'')+'" placeholder="Mitigatie / vervolgactie"><button class="btn small warn" data-mf-delete="risks:'+x.id+'">Verwijder</button></div>').join('')+'</div>').join('')+'</div>'+
 mfForm('risks','PI-risico toevoegen',mfInput('Risico','title','text',true)+mfInput('Eigenaar','owner')+
 '<label class="field"><span>ART</span><select name="artId">'+mfOpts(state.arts.map(a=>[a.id,a.name]),'')+'</select></label>'+
 '<label class="field"><span>ROAM</span><select name="roam">'+mfOpts(cats.map(c=>[c,c]),'Open')+'</select></label>')+'</section>';
}
function mfConfidence(){
 mfEnsure();const m=state.method,v=m.votes,r=m.risks,objective=m.objectives,ready=m.readiness.every(x=>x.status==='ready');
 const missing=v.filter(x=>!x.score),low=v.filter(x=>x.score>0&&x.score<4),open=r.filter(x=>x.roam==='Open');
 const issues=[];
 if(!ready)issues.push('Readiness is nog niet volledig');
 if(!objective.length)issues.push('Team PI Objectives ontbreken');
 if(open.length)issues.push(open.length+' risico’s zijn niet geROAMd');
 if(missing.length)issues.push(missing.length+' teams hebben niet gestemd');
 if(low.length)issues.push(low.length+' teams hebben onvoldoende confidence');
 if(m.rework==='needed')issues.push('Plan Rework staat nog op noodzakelijk');
 const canCommit=!issues.length;
 return mfHead('06 / ALIGNMENT','Confidence Vote & Plan Rework','Team- en ART-confidence vereisen gezamenlijke beoordeling. Bij onvoldoende vertrouwen wordt herplanning noodzakelijk.')+
 mfCounters([['Team votes',v.length-missing.length+'/'+v.length],['Score onder 4',low.length],['Open risico’s',open.length]])+
 (issues.length?'<div class="mf-alert"><strong>Commitment nog niet gereed</strong><ul>'+issues.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul></div>':'<div class="audit-good">Registratie voldoet aan de ingestelde basiscontroles. De uiteindelijke beslissing blijft bij de ART.</div>')+
 '<div class="tablewrap"><table><thead><tr><th>ART</th><th>Team</th><th>Confidence</th><th>Toelichting</th></tr></thead><tbody>'+
 v.map(x=>{const t=mfTeam(x.teamId);return '<tr><td>'+esc(t?.art.name||'')+'</td><td>'+esc(t?.team.name||'')+'</td><td><select data-mf="votes:'+x.id+':score">'+mfOpts([[0,'Nog niet'],[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],x.score)+'</select></td><td><input data-mf="votes:'+x.id+':note" value="'+esc(x.note||'')+'"></td></tr>'}).join('')+'</tbody></table></div>'+
 '<div class="entry"><h3>ART Plan Rework & Commitment</h3><div class="formgrid"><label class="field"><span>Herplanning</span><select data-mf-root="rework">'+mfOpts([['not-needed','Niet nodig'],['needed','Nodig'],['in-progress','In uitvoering'],['resolved','Afgerond']],m.rework)+'</select></label>'+
 '<label class="field"><span>Planstatus</span><button type="button" class="btn '+(canCommit?'primary':'')+'" data-mf-action="commit" '+(canCommit?'':'disabled')+'>'+(m.committedAt?'✓ Vastgesteld op '+esc(m.committedAt):'Plan vaststellen')+'</button></label></div></div>'+
 '<h3>Planning adjustments / Management Review</h3>'+
 '<div class="tablewrap"><table><thead><tr><th>Besluit</th><th>Eigenaar</th><th>Status</th><th></th></tr></thead><tbody>'+
 m.decisions.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.owner)+'</td><td><select data-mf="decisions:'+x.id+':status">'+mfOpts([['open','Open'],['decided','Besloten'],['done','Afgerond']],x.status)+'</select></td><td><button class="btn small warn" data-mf-delete="decisions:'+x.id+'">×</button></td></tr>').join('')+'</tbody></table></div>'+
 mfForm('decisions','Planning adjustment / besluit',mfInput('Besluit','title','text',true)+mfInput('Eigenaar','owner'))+'</section>';
}
function mfResults(){
 mfEnsure();const m=state.method,ready=m.readiness.every(x=>x.status==='ready'),miss=[];
 if(!ready)miss.push('Readiness niet compleet');
 if(!m.objectives.length)miss.push('Objectives ontbreken');
 if(m.objectives.some(x=>x.commitment==='committed'&&(!x.plannedBV||+x.plannedBV<1)))miss.push('Committed objectives zonder Business Value');
 if(m.risks.some(x=>x.roam==='Open'))miss.push('Open PI-risico’s');
 if(m.votes.some(x=>!x.score))miss.push('Ontbrekende confidence votes');
 if(!m.committedAt)miss.push('ART-plan nog niet formeel vastgesteld');
 return mfHead('07 / RESULTS','PI Plan & overdracht','Controleer de uitkomsten van PI Planning en draag besluiten, doelen, risico’s en afhankelijkheden over naar de uitvoering.')+
 mfCounters([['Objectives',m.objectives.length],['Risico’s',m.risks.length],['Besluiten',m.decisions.length]])+
 (miss.length?'<div class="mf-alert"><strong>Ontbrekende methodische resultaten</strong><ul>'+miss.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></div>':'<div class="audit-good">Basiscontroles afgerond</div>')+
 '<div class="mf-result">'+state.arts.map(a=>'<div class="mf-result-card"><h3>'+esc(a.name)+'</h3>'+
 m.objectives.filter(o=>mfTeam(o.teamId)?.art.id===a.id).map(o=>'<p><strong>'+esc(o.title)+'</strong> <small>('+o.commitment+', BV '+(o.plannedBV||'–')+')</small></p>').join('')+'</div>').join('')+'</div>'+
 '<div class="buttonline"><button class="btn primary" type="button" data-mf-action="pdf">PDF draaiboek</button><button class="btn" type="button" data-mf-action="excel">Excel met PI-resultaten</button></div></section>';
}
function mfChange(e){
 const d=e.target.dataset;
 if(d.mfRoot){state.method[d.mfRoot]=e.target.value;state.method.committedAt='';save();renderDashboard();return true}
 if(!d.mf)return false;
 const [type,id,key]=d.mf.split(':'),obj=state.method[type]?.find(x=>x.id===id);
 if(!obj)return true;
 if(['score','plannedBV','actualBV','available','planned'].includes(key))obj[key]=Math.max(0,Math.min(key==='planned'||key==='available'?10000:key==='score'?5:10,+e.target.value||0));
 else obj[key]=e.target.value;
 if(type==='risks'&&key==='roam'&&obj.roam==='Owned'&&!obj.owner){obj.roam='Open';toast('Voor Owned is een eigenaar verplicht.')}
 state.method.committedAt='';save();
 if(!['note','title','action'].includes(key))renderDashboard();
 return true;
}
function mfClick(e){
 const el=e.target.closest('button');if(!el)return false;
 if(el.dataset.mfDelete){const [type,id]=el.dataset.mfDelete.split(':');state.method[type]=state.method[type].filter(x=>x.id!==id);state.method.committedAt='';save();renderDashboard();return true}
 if(el.dataset.mfAction==='pdf'){exportEventPDF();return true}
 if(el.dataset.mfAction==='excel'){exportEventExcel();return true}
 if(el.dataset.mfAction==='commit'){
  const m=state.method;
  if(!m.objectives.length||m.readiness.some(x=>x.status!=='ready')||m.risks.some(x=>x.roam==='Open')||m.votes.some(x=>x.score<4)||m.rework==='needed'){toast('Nog onvoldoende klaar voor commitment.');return true}
  m.committedAt=new Date().toISOString().slice(0,10);save();renderDashboard();return true;
 }
 return false;
}
function mfSubmit(e){
 const type=e.target.dataset.mfForm;if(!type)return false;e.preventDefault();
 const f=new FormData(e.target),v=k=>String(f.get(k)||'').trim(),x={id:uid()};
 if(type==='objectives')Object.assign(x,{teamId:v('teamId'),title:v('title'),commitment:v('commitment'),plannedBV:Math.min(10,+v('plannedBV')||0),actualBV:0,status:'planned'});
 if(type==='features')Object.assign(x,{teamId:v('teamId'),title:v('title'),iteration:Math.max(1,+v('iteration')||1),type:v('type'),status:'planned'});
 if(type==='risks')Object.assign(x,{title:v('title'),owner:v('owner'),artId:v('artId'),roam:v('roam')==='Owned'&&!v('owner')?'Open':v('roam'),action:''});
 if(type==='decisions')Object.assign(x,{title:v('title'),owner:v('owner'),status:'open'});
 if(!x.title){toast('Vul een titel in.');return true}
 state.method[type].push(x);state.method.committedAt='';save();renderDashboard();toast('Opgeslagen');return true;
}
mfEnsure();
