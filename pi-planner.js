'use strict';
/* PI Event Planner – 100% browser-local, no accounts, no external requests. */
const K='safe-agile-forge-pi-event-v1';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const val=(o,k,f='')=>o&&o[k]!=null?o[k]:f;
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const digit=(s,n=0)=>Number.isFinite(+s)?Math.max(0,Math.min(5000,+s||0)):n;
const max=(n,a,b)=>Math.max(a,Math.min(b,n));
const clone=x=>JSON.parse(JSON.stringify(x));
const DAYLABEL=['Dag 1','Dag 2'];
const CHECKS=[
'Locatie en plenair ruimte bevestigd',
'Voldoende breakout-ruimtes of teamtafels toegewezen',
'RTE(s), Product Management en Business Owners uitgenodigd',
'System Architects en betrokken stakeholders geïnformeerd',
'Visie, roadmap en belangrijkste features voorbereid',
'Capaciteit, teambacklogs en afhankelijkheden beschikbaar',
'Sprekers en presentatiebestanden afgestemd',
'Planningborden, ROAM en PI Objectives voorbereid',
'Audio, beamer en wifi/connectiviteit getest',
'Instructies voor online / hybride deelnemers voorbereid',
'Uitnodigingen en programma verspreid',
'Aanmeldingen en cateringvoorkeuren verwerkt',
'Facilitators, tijdbewakers en aanspreekpunten bevestigd',
'Besluitvormings- en escalatieroute vastgelegd',
'After-action terugblik en actielijst voorzien'
];
const AGENDA=[
[0,'09:00','09:30','Ontvangst & start','Plenair','Organisatie'],
[0,'09:30','10:00','Business Context','Plenair','Business Owners'],
[0,'10:00','10:45','Product / Solution Vision','Plenair','Product Management'],
[0,'10:45','11:15','Architecture Vision & Development Practices','Plenair','System Architect'],
[0,'11:15','12:30','Team Breakout 1','Teamruimte(s)','Scrum Masters & teams'],
[0,'12:30','13:15','Lunchpauze','Catering','Organisatie'],
[0,'13:15','15:40','Team Breakout 1 – vervolg','Teamruimte(s)','Scrum Masters & teams'],
[0,'15:40','16:30','Draft Plan Review','Plenair','RTE & teams'],
[0,'16:30','17:00','Management Review & Problem Solving','Bespreekruimte','RTE / management'],
[1,'09:00','09:20','Dagstart / wijzigingen vanuit management','Plenair','RTE'],
[1,'09:20','11:30','Team Breakout 2','Teamruimte(s)','Scrum Masters & teams'],
[1,'11:30','12:30','Final Plan Review','Plenair','RTE & teams'],
[1,'12:30','13:15','Lunchpauze','Catering','Organisatie'],
[1,'13:15','14:10','ART PI Risks (ROAM)','Plenair','RTE & teams'],
[1,'14:10','14:40','Confidence Vote','Plenair','RTE'],
[1,'14:40','15:15','Planning Retrospective','Plenair','RTE'],
[1,'15:15','15:30','Afsluiting & vervolgstappen','Plenair','Organisatie']
];
function defaultTeam(n){return {id:uid(),name:'Team '+n,members:8}}
function defaultArt(n){return {id:uid(),name:'ART '+n,teams:Array.from({length:5},(_,i)=>defaultTeam(i+1))}}
function fresh(){return {
 version:1,ready:false,piName:'PI 2027.1',eventName:'PI Planning',
 arts:[defaultArt(1)],days:['',''],format:'onsite',venue:'',address:'',plenairRooms:1,breakoutRooms:6,organizer:'',email:'',
 extraParticipants:10,businessOwners:2,architects:1,facilitators:1,techLead:'',sponsor:'',catering:true,
 notes:'',agenda:AGENDA.map(a=>({id:uid(),day:a[0],start:a[1],end:a[2],title:a[3],location:a[4],owner:a[5]})),
 people:[],checks:CHECKS.map(name=>({id:uid(),name,done:false}))
}}
function safeLoad(){try{const j=JSON.parse(localStorage.getItem(K));if(j&&Array.isArray(j.arts)&&Array.isArray(j.agenda)&&Array.isArray(j.people)&&Array.isArray(j.checks)&&Array.isArray(j.days))return {...fresh(),...j};}catch(e){}return fresh()}
let state=safeLoad(),step=0,tab='overview',editing=null;
const save=()=>{try{localStorage.setItem(K,JSON.stringify(state))}catch(e){toast('Lokale opslag niet beschikbaar; gebruik JSON-back-up.')}};
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('visible'),3500)}
function dateAdd(s,n){if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return '';const d=new Date(s+'T12:00:00');if(Number.isNaN(d.getTime()))return '';d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function when(s){if(!s)return 'Nog niet gepland';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?'Ongeldige datum':new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function fld(label,key,type='text',placeholder=''){return '<label class="field"><span>'+esc(label)+'</span><input type="'+type+'" data-field="'+key+'" value="'+esc(state[key])+'" placeholder="'+esc(placeholder)+'"></label>'}
function num(label,key,min=0,maxN=500){return '<label class="field"><span>'+esc(label)+'</span><input type="number" data-num="'+key+'" min="'+min+'" max="'+maxN+'" step="1" value="'+esc(state[key])+'"></label>'}
function option(v,k,label){return '<option value="'+k+'" '+(v===k?'selected':'')+'>'+esc(label)+'</option>'}
function select(label,key,opts){return '<label class="field"><span>'+esc(label)+'</span><select data-field="'+key+'">'+opts.map(p=>option(state[key],p[0],p[1])).join('')+'</select></label>'}
const text=(tag,txt,cl)=>'<'+tag+' class="'+(cl||'')+'">'+esc(txt)+'</'+tag+'>';
function setArtCount(n){n=max(n,1,15);while(state.arts.length<n)state.arts.push(defaultArt(state.arts.length+1));state.arts=state.arts.slice(0,n);save()}
function setTeamCount(artIdx,n){const art=state.arts[artIdx];if(!art)return;n=max(n,1,30);while(art.teams.length<n)art.teams.push(defaultTeam(art.teams.length+1));art.teams=art.teams.slice(0,n);save()}
function scaleCounts(){const teams=state.arts.reduce((n,a)=>n+a.teams.length,0),members=state.arts.reduce((n,a)=>n+a.teams.reduce((m,t)=>m+digit(t.members),0),0),others=digit(state.extraParticipants),people=members+others;return {arts:state.arts.length,teams,members,others,people,rooms:teams+1}}
function renderWizard(){
 $('dashboard').classList.remove('on');$('wizard').classList.remove('off');
 document.querySelectorAll('[data-stephead]').forEach(b=>{const n=+b.dataset.stephead;b.classList.toggle('active',step===n);b.classList.toggle('done',step>n)});
 $('prevStep').style.visibility=step===0?'hidden':'visible';
 $('nextStep').textContent=step===2?'Open PI Command Center →':'Volgende →';
 $('wizardError').textContent='';
 $('wizardContents').innerHTML=step===0?stepScale():step===1?stepEvent():stepOrganisation();
}
function stepScale(){
 const c=scaleCounts();
 return '<div class="kicker">01 / SCALE & STRUCTURE</div><h2>Hoe groot is jullie PI Planning?</h2><p class="sub">Start met ARTs en teams. Zo kan Forge ruimtebehoefte, lunch en teambreakouts inschatten. Aantallen zijn aanpasbaar.</p>'+
 '<label class="field" style="max-width:250px"><span>Hoeveel ARTs doen mee?</span><input type="number" min="1" max="15" value="'+state.arts.length+'" data-art-count><small>Meerdere ARTs? Reserveer extra afstemming voor gezamenlijke afhankelijkheden.</small></label>'+
 '<div class="art-list">'+state.arts.map((art,i)=>'<div class="art-card"><div class="art-title"><strong>ART '+(i+1)+'</strong><span class="art-count">'+art.teams.length+' teams</span></div>'+
 '<div class="formgrid"><label class="field"><span>Naam ART</span><input data-art-name="'+i+'" maxlength="100" value="'+esc(art.name)+'" placeholder="Bijv. ART Align & Innovate"></label>'+
 '<label class="field"><span>Hoeveel teams in deze ART?</span><input type="number" data-art-teams="'+i+'" min="1" max="30" value="'+art.teams.length+'"></label></div>'+
 '<details style="margin-top:14px"><summary style="cursor:pointer;color:#16786e;font-weight:850;font-size:12px">Teams benoemen en teamgrootte aanpassen</summary><div class="team-edit-list">'+art.teams.map((t,j)=>'<div class="field"><span>Team '+(j+1)+'</span><input data-team-name="'+i+':'+j+'" maxlength="80" value="'+esc(t.name)+'"></div><label class="field"><span>Verwacht aantal mensen</span><input type="number" data-team-members="'+i+':'+j+'" min="1" max="60" value="'+t.members+'"></label>').join('')+'</div></details></div>').join('')+'</div>'+
 '<div class="introbox"><strong>Automatische inschatting:</strong> '+c.arts+' ART(s) · '+c.teams+' teams · '+c.members+' teamleden. Voor de breakouts is doorgaans ruimte per team of teamtafel nodig. De exacte indeling bepaal je later.</div>';
}
function stepEvent(){const c=scaleCounts();
 return '<div class="kicker">02 / DATES & LOCATION</div><h2>Wanneer en waar komen jullie samen?</h2><p class="sub">Forge start met twee aaneengesloten PI-planningsdagen. Het programma blijft volledig aanpasbaar.</p>'+
 '<div class="formgrid">'+fld('PI-naam','piName')+fld('Naam evenement','eventName')+
 '<label class="field"><span>Dag 1 · datum</span><input type="date" data-day="0" value="'+esc(state.days[0])+'"></label>'+
 '<label class="field"><span>Dag 2 · datum</span><input type="date" data-day="1" value="'+esc(state.days[1])+'"><small>Wordt standaard de volgende kalenderdag; kies zelf een andere datum.</small></label>'+
 select('Deelnamevorm','format',[['onsite','Fysiek'],['hybrid','Hybride'],['online','Online']])+fld('Locatie / gebouw','venue','text','Bijv. vergadercentrum')+
 fld('Adres / toegangsinformatie (niet vertrouwelijk)','address')+
 num('Breakout-ruimtes / teamtafels', 'breakoutRooms',0,200)+
 num('Plenaire ruimtes','plenairRooms',0,20)+'</div>'+
 '<div class="introbox"><strong>Ruimtecheck:</strong> '+c.teams+' teams. Een mogelijke startindeling is '+c.teams+' breakout-ruimtes/tafels en 1 plenaire zaal. Teams kunnen samen een ruimte delen als dat past.</div>';
}
function stepOrganisation(){const c=scaleCounts();
 return '<div class="kicker">03 / PEOPLE & LOGISTICS</div><h2>Wie organiseert, spreekt en faciliteert?</h2><p class="sub">Deze gegevens helpen het programma, de uitnodiging en cateringplanning compleet te maken.</p>'+
 '<div class="formgrid">'+fld('Hoofdorganisator / aanspreekpunt','organizer')+fld('Contact-e-mailadres voor reacties','email','email')+
 num('Overige deelnemers (BO, architecten, gasten)','extraParticipants',0,1500)+num('Business Owners','businessOwners',0,100)+
 num('System Architects / engineers','architects',0,100)+num('RTEs / facilitators','facilitators',0,100)+
 fld('Technisch aanspreekpunt','techLead')+fld('Sponsor / opdrachtgever','sponsor')+'</div>'+
 '<label class="toggle-line"><input type="checkbox" data-check-catering '+(state.catering?'checked':'')+'> Lunchregistratie en catering meenemen (beide dagen)</label>'+
 '<div class="introbox"><strong>Verwachte omvang:</strong> circa '+c.people+' mensen ('+c.members+' teamleden + '+c.others+' overige). Van deze mensen zijn nog geen individuele contactgegevens vastgelegd. Uitnodigingen worden pas na invoer of CSV-import voorbereid, niet automatisch verstuurd.</div>'+
 '<div class="introbox"><strong>Ook belangrijk:</strong> afstemming tussen ARTs, plenaire sprekers, toegangsrechten/locatie-instructies, toegankelijkheid, faciliteiten voor hybride deelnemers en verantwoordelijkheden per sessie.</div>';
}
function validateStep(){
 if(step===0&&state.arts.some(a=>!a.name.trim()||a.teams.some(t=>!t.name.trim()||digit(t.members)<1)))return 'Vul een ART-naam, teamnaam en geldige teamgrootte in.';
 if(step===1){if(!state.days[0]||!state.days[1])return 'Vul de datums voor beide PI-planningsdagen in.';if(state.days[1]<=state.days[0])return 'Dag 2 moet na dag 1 plaatsvinden.'}
 if(step===2&&state.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email))return 'Controleer het contact-e-mailadres.';
 return '';
}
function goNext(){const error=validateStep();if(error){$('wizardError').textContent=error;return}if(step<2){step++;renderWizard()}else{state.ready=true;save();tab='overview';renderDashboard();window.scrollTo({top:0,behavior:'smooth'})}}
function mealOptions(v){return [['regular','Standaard'],['veggie','Vegetarisch'],['vegan','Vegan'],['other','Anders / afstemmen'],['none','Geen lunch']].map(a=>option(v,a[0],a[1])).join('')}
function statusOptions(v){return [['invited','Uitgenodigd'],['yes','Aanwezig'],['maybe','Misschien'],['no','Afwezig']].map(a=>option(v,a[0],a[1])).join('')}
function statusName(v){return {invited:'Uitgenodigd',yes:'Aanwezig',maybe:'Misschien',no:'Afwezig'}[v]||'Uitgenodigd'}
function counts(){const scale=scaleCounts();return {...scale,registrations:state.people.length,yes:state.people.filter(p=>p.status==='yes').length,maybe:state.people.filter(p=>p.status==='maybe').length,pending:state.people.filter(p=>p.status==='invited').length,done:state.checks.filter(c=>c.done).length}}
function renderDashboard(){
 $('wizard').classList.add('off');$('dashboard').classList.add('on');
 const c=counts();
 $('dashboardTitle').textContent=state.eventName||'PI Planning';
 $('eventSubheading').textContent=(state.piName||'PI')+' · '+when(state.days[0])+' & '+when(state.days[1]);
 $('metrics').innerHTML=[['ARTs',c.arts],['Teams',c.teams],['Verwacht',c.people],['Aangemeld',c.yes],['Checks gereed',c.done+'/'+state.checks.length]].map(a=>'<div class="metric"><b>'+a[1]+'</b><small>'+a[0]+'</small></div>').join('');
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 $('view').innerHTML=tab==='overview'?viewOverview():tab==='agenda'?viewAgenda():tab==='people'?viewPeople():tab==='catering'?viewCatering():tab==='invites'?viewInvites():viewChecklist();
}
function paneHead(kicker,title,desc){return '<div class="kicker">'+kicker+'</div><h2>'+title+'</h2><p class="sub">'+desc+'</p>'}
function viewOverview(){
 const c=counts(),missing=[];
 if(!state.venue&&state.format!=='online')missing.push('Locatie nog niet ingevuld');
 if(!state.organizer)missing.push('Organisator niet ingevuld');
 if(!state.email)missing.push('Contact-e-mailadres ontbreekt');
 if(state.people.length===0)missing.push('Nog geen deelnemers toegevoegd');
 if(state.arts.length>1)missing.push('Meerdere ARTs: plan cross-ART dependency- en alignmentmomenten');
 if(state.breakoutRooms<c.teams)missing.push('Controleer of er genoeg breakout-ruimtes of teamtafels zijn');
 return '<div class="layout"><section class="panel">'+paneHead('EVENT SUMMARY','Je PI Planning in één overzicht','De basis voor organisatie, planning en logistiek.')+
 '<div class="formgrid">'+[
 ['PI',state.piName],['ARTs',c.arts+''],['Teams',c.teams+''],['Verwacht aantal mensen','ca. '+c.people],['Dag 1',when(state.days[0])],['Dag 2',when(state.days[1])],['Deelnamevorm',{onsite:'Fysiek',hybrid:'Hybride',online:'Online'}[state.format]],['Locatie',state.venue||'Nog open'],['Breakouts',state.breakoutRooms+' plekken'],['Plenair',state.plenairRooms+' ruimte(s)'],['Eventorganisatie',state.organizer||'Nog open'],['Contactadres',state.email||'Nog open']
 ].map(a=>'<div class="entry" style="margin:0"><small class="hint">'+esc(a[0])+'</small><div><strong>'+esc(a[1])+'</strong></div></div>').join('')+'</div><div class="sectiondivider"></div><div class="buttonline"><button class="btn primary" data-tab="agenda">Programma bewerken</button><button class="btn" data-tab="people">Aanmeldingen beheren</button><button class="btn" data-tab="invites">Uitnodiging maken</button></div></section>'+
 '<aside class="panel aside"><h3>Wat vraagt nog aandacht?</h3>'+(!missing.length?'<p class="smallprint">Basisinstellingen zien er compleet uit. Check nu je programma en deelnemers.</p>':'<ul>'+missing.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>')+
 '<div class="sectiondivider"></div><h3>ARTs & teams</h3>'+state.arts.map(a=>'<p class="smallprint"><strong>'+esc(a.name)+'</strong><br>'+a.teams.length+' teams · '+a.teams.reduce((n,t)=>n+digit(t.members),0)+' mensen (inschatting)</p>').join('')+
 '<div class="sectiondivider"></div><h3>Bescherming van gegevens</h3><p class="smallprint">Alle gegevens staan lokaal in deze browser. Gebruik geen operationele, vertrouwelijke of gevoelige persoonsgegevens. Exporteer regelmatig een back-up. Er worden geen uitnodigingen verstuurd.</p></aside></div>';
}
function viewAgenda(){
 return '<section class="panel">'+
 '<div class="sectiontop"><div>'+paneHead('DAY-BY-DAY / FACILITATION','Programma & draaiboek','SAFe-geïnspireerd tweedaags voorstel. Wijzig alles naar de werkwijze van jouw ART(s).')+'</div><div class="buttonline"><button class="btn" data-action="addAgenda">+ Onderdeel</button><button class="btn" data-action="print">Print / PDF</button><button class="btn primary" data-action="agendaICS">Download agenda (.ics)</button></div></div>'+
 [0,1].map(d=>'<div class="agenda-day"><h3>'+DAYLABEL[d]+' · '+when(state.days[d])+'</h3>'+
 state.agenda.filter(a=>a.day===d).sort((a,b)=>a.start.localeCompare(b.start)).map(a=>'<div class="agendarow"><div class="time">'+esc(a.start)+'–'+esc(a.end)+'</div><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.location||'Locatie open')+' · '+esc(a.owner||'Facilitator open')+'</small></div><div class="mini-actions"><button data-edit-agenda="'+esc(a.id)+'" title="Wijzigen">Bewerk</button><button data-remove-agenda="'+esc(a.id)+'" title="Verwijderen">×</button></div></div>').join('')+'</div>').join('')+
 '<div id="agendaEditor">'+(editing?agendaForm():'' )+'</div>'+
 '<p class="smallprint">Het programma is een voorstel, geen officieel vaststaand SAFe-schema. Extra ARTs kunnen eigen breakouts of Solution Train-afstemming nodig hebben. Gedownloade .ics-afspraken worden niet automatisch naar deelnemers verstuurd.</p></section>';
}
function agendaForm(){const x=editing==='new'?{id:'',day:0,start:'09:00',end:'10:00',title:'',location:'',owner:''}:state.agenda.find(a=>a.id===editing);if(!x)return '';
 return '<div class="entry" id="agendaForm"><h3>'+(editing==='new'?'Nieuw programmaonderdeel':'Onderdeel aanpassen')+'</h3><div class="formgrid">'+
 '<label class="field"><span>Dag</span><select id="agendaDay">'+option(String(x.day),'0','Dag 1')+option(String(x.day),'1','Dag 2')+'</select></label>'+
 '<label class="field"><span>Onderdeel</span><input id="agendaTitle" value="'+esc(x.title)+'"></label>'+
 '<label class="field"><span>Starttijd</span><input id="agendaStart" type="time" value="'+esc(x.start)+'"></label>'+
 '<label class="field"><span>Eindtijd</span><input id="agendaEnd" type="time" value="'+esc(x.end)+'"></label>'+
 '<label class="field"><span>Ruimte / breakout</span><input id="agendaLocation" value="'+esc(x.location)+'"></label>'+
 '<label class="field"><span>Spreker / facilitator</span><input id="agendaOwner" value="'+esc(x.owner)+'"></label></div>'+
 '<div class="actions"><button class="btn" data-action="cancelAgenda">Annuleren</button><button class="btn primary" data-action="saveAgenda">Opslaan</button></div></div>';
}
function artSelect(index){return '<select data-person-art="'+index+'"><option value="">Selecteer ART</option>'+state.arts.map(a=>'<option value="'+esc(a.id)+'" '+(state.people[index].artId===a.id?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select>'}
function teamSelect(index){const p=state.people[index],art=state.arts.find(a=>a.id===p.artId);return '<select data-person-team="'+index+'"><option value="">Geen / extern</option>'+(art?art.teams.map(t=>'<option value="'+esc(t.id)+'" '+(p.teamId===t.id?'selected':'')+'>'+esc(t.name)+'</option>').join(''):'')+'</select>'}
function viewPeople(){return '<section class="panel">'+
 '<div class="sectiontop"><div>'+paneHead('REGISTRATION DESK','Deelnemers & RSVP','Bouw een deelnemerslijst en houd reacties handmatig bij. Import/export met CSV is mogelijk.')+'</div><div class="buttonline"><button class="btn" data-action="csvTemplate">CSV-sjabloon</button><button class="btn" data-action="importCSV">CSV importeren</button><button class="btn" data-action="exportCSV">CSV exporteren</button></div></div>'+
 '<div class="introbox"><strong>Belangrijk:</strong> deze site verstuurt geen e-mails en heeft geen online registratieformulier. Aanmeldingen komen via jullie eigen kanalen binnen; je verwerkt ze hier handmatig of via CSV-import.</div>'+
 '<form id="newPerson" class="entry"><h3>Deelnemer toevoegen</h3><div class="formgrid three">'+
 '<label class="field"><span>Naam</span><input name="name" maxlength="120" required placeholder="Naam deelnemer"></label>'+
 '<label class="field"><span>E-mail (optioneel)</span><input type="email" name="email" placeholder="naam@organisatie.nl"></label>'+
 '<label class="field"><span>Functie</span><input name="role" placeholder="BO / PM / PO / SM / …"></label></div>'+
 '<div class="actions"><small class="hint">ART, team, aanwezigheid en lunchvoorkeur kun je daarna aanpassen.</small><button class="btn primary" type="submit">+ Toevoegen</button></div></form>'+
 '<div class="tablewrap"><table><thead><tr><th>Naam / rol</th><th>ART</th><th>Team</th><th>RSVP</th><th>Dag 1</th><th>Dag 2</th><th>Actie</th></tr></thead><tbody>'+
 (state.people.length?state.people.map((p,i)=>'<tr><td class="namecell">'+esc(p.name)+'<br><small class="hint">'+esc(p.role||p.email||'')+'</small></td><td>'+artSelect(i)+'</td><td>'+teamSelect(i)+'</td><td><select data-person-status="'+i+'">'+statusOptions(p.status)+'</select></td><td><input type="checkbox" data-person-day="'+i+':0" '+(p.days[0]?'checked':'')+' aria-label="Dag 1 aanwezig"></td><td><input type="checkbox" data-person-day="'+i+':1" '+(p.days[1]?'checked':'')+' aria-label="Dag 2 aanwezig"></td><td><button class="btn small warn" data-person-delete="'+i+'">Verwijder</button></td></tr>').join(''):'<tr><td colspan="7" class="empty">Nog geen deelnemers. Voeg personen toe of importeer een CSV.</td></tr>')+
 '</tbody></table></div><p class="smallprint">Status “Aanwezig” betekent bevestigd voor de aangevinkte dag(en); “Uitgenodigd” en “Misschien” tellen niet als definitieve lunchbestelling.</p></section>';
}
function confirmed(day){return state.people.filter(p=>p.status==='yes'&&p.days[day])}
function mealsFor(day){return confirmed(day).reduce((o,p)=>{const k=p.meals[day]||'regular';o[k]=(o[k]||0)+1;return o},{regular:0,veggie:0,vegan:0,other:0,none:0})}
function viewCatering(){
 const yes0=confirmed(0),yes1=confirmed(1),labels={regular:'Standaard',veggie:'Vegetarisch',vegan:'Vegan',other:'Anders / afstemmen',none:'Geen lunch'};
 return '<section class="panel">'+paneHead('FOOD & HOSPITALITY','Lunch & catering','Tellingen op basis van bevestigde aanwezigen. Wijzig voorkeuren per persoon en dag.')+
 (state.catering?'':'<div class="introbox">Catering is momenteel uitgeschakeld in de intake. Je kunt voorkeuren alsnog bijhouden of de optie aanzetten in Instellingen.</div>')+
 '<div class="mealstats">'+[0,1].map(d=>{const ms=mealsFor(d),total=confirmed(d).length-ms.none;return '<div class="mealstat"><strong>'+DAYLABEL[d]+' · '+when(state.days[d])+'</strong><b>'+total+'</b>lunches te bestellen<br>'+
 Object.entries(labels).map(([k,l])=>l+': '+ms[k]).join(' · ')+'</div>'}).join('')+'</div>'+
 '<div class="tablewrap"><table><thead><tr><th>Naam</th><th>RSVP</th><th>Lunch dag 1</th><th>Lunch dag 2</th><th>Opmerking</th></tr></thead><tbody>'+
 (state.people.length?state.people.map((p,i)=>'<tr><td><strong>'+esc(p.name)+'</strong></td><td>'+esc(statusName(p.status))+'</td><td><select data-meal="'+i+':0">'+mealOptions(p.meals[0])+'</select></td><td><select data-meal="'+i+':1">'+mealOptions(p.meals[1])+'</select></td><td><input data-meal-note="'+i+'" value="'+esc(p.mealNote||'')+'" placeholder="Alleen praktische toelichting"></td></tr>').join(''):'<tr><td colspan="5" class="empty">Voeg eerst deelnemers toe.</td></tr>')+'</tbody></table></div>'+
 '<div class="actions"><span class="hint">Dieet-/gezondheidsgegevens zijn gevoelig; noteer alleen wat noodzakelijk is voor de cateraar en deel bestanden veilig.</span><button class="btn primary" data-action="cateringCSV">Download cateringtelling (.csv)</button></div></section>';
}
function invitationText(){const scale=scaleCounts(),names=state.arts.map(a=>a.name).join(', ');
 return 'UITNODIGING: '+(state.eventName||'PI Planning')+'\n\n'+
 'Planning Interval: '+state.piName+'\nART(s): '+names+'\n\n'+
 'Beste collega,\n\nJe bent uitgenodigd voor de PI Planning van '+state.piName+'. Tijdens de planningsdagen stemmen we prioriteiten, afhankelijkheden en teamplannen af.\n\n'+
 'Dag 1: '+when(state.days[0])+'\nDag 2: '+when(state.days[1])+'\nLocatie: '+(state.venue||'Volgt')+(state.address?' ('+state.address+')':'')+'\nVorm: '+({onsite:'Fysiek',hybrid:'Hybride',online:'Online'}[state.format])+'\n'+
 'Verwacht aantal teams: '+scale.teams+'\n\n'+
 'Wil je laten weten:\n1. Of je op dag 1 en/of dag 2 aanwezig bent.\n2. Of je '+(state.catering?'een lunch wilt en zo ja welke voorkeur (standaard, vegetarisch, vegan of anders).':'speciale praktische voorzieningen nodig hebt.')+'\n'+
 '3. Of er relevante toegankelijkheids- of praktische behoeften zijn.\n\n'+
 'Reacties graag sturen naar: '+(state.email||'de organisator')+'\n\n'+
 'Met vriendelijke groet,\n'+(state.organizer||'PI Planning organisatie')+'\n\n'+
 '(Uitnodiging voorbereid met SAFe Agile Forge. Verzenden en RSVPs verwerken gebeurt handmatig.)';
}
function viewInvites(){const c=counts();return '<section class="panel">'+paneHead('COMMUNICATIONS','Uitnodigingen & communicatie','Maak uitnodigingen en download een .ics-eventbestand. Versturen en reacties verzamelen blijft handmatig.')+
 '<div class="introbox"><strong>Uitnodigingsbeheer:</strong> '+c.registrations+' personen in de lijst; '+c.yes+' bevestigd, '+c.pending+' nog uitgenodigd, '+c.maybe+' misschien. Deze tool heeft geen centrale inbox of RSVP-portaal.</div>'+
 '<div class="invitation">'+esc(invitationText())+'</div>'+
 '<div class="actions"><div class="right"><button class="btn primary" data-action="copyInvite">Kopieer uitnodiging</button><button class="btn" data-action="eventICS">Download 2-daags event (.ics)</button><button class="btn" data-action="mailto">Open e-mailconcept</button></div></div>'+
 '<p class="smallprint">Gebruik voor grote aantallen je vertrouwde mailsoftware of interne distributielijsten. De e-mailknop opent alleen een concept in je eigen mailprogramma, zonder automatische verzending. Voeg ontvangers toe en controleer inhoud en beveiligingsclassificatie.</p></section>';
}
function viewChecklist(){const c=counts();return '<section class="panel">'+paneHead('BEFORE · DURING · AFTER','Organisatiechecklist','Een praktisch overzicht van alles wat geregeld moet zijn voor beide PI-planningsdagen.')+
 '<div class="introbox"><strong>'+c.done+' van de '+state.checks.length+' onderdelen afgerond.</strong> Leg eigenaarschap en deadlines vast in je eigen teamplanning als je meer detail nodig hebt.</div>'+
 state.checks.map((x,i)=>'<div class="checkrow"><input type="checkbox" id="check'+i+'" data-check-index="'+i+'" '+(x.done?'checked':'')+'><label for="check'+i+'">'+esc(x.name)+'</label><button class="btn small warn" data-remove-check="'+i+'">×</button></div>').join('')+
 '<form id="newCheck" class="entry"><h3>Eigen actie toevoegen</h3><div class="buttonline"><input name="name" maxlength="180" placeholder="Bijv. Security desk aanmelden" required style="flex:1;min-width:150px"><button type="submit" class="btn primary">Toevoegen</button></div></form></section>';
}
function csvEncode(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}
function csv(rows){return '\uFEFF'+rows.map(r=>r.map(csvEncode).join(';')).join('\r\n')+'\r\n'}
function download(name,body,type){const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function exportCSV(template=false){
 const rows=[['naam','email','rol','art','team','rsvp','dag1','dag2','lunch1','lunch2']];
 if(template)rows.push(['Voorbeeld Persoon','voorbeeld@organisatie.nl','PO',state.arts[0]?.name||'ART 1',state.arts[0]?.teams[0]?.name||'Team 1','invited','ja','ja','standard','veggie']);
 else for(const p of state.people){const art=state.arts.find(a=>a.id===p.artId),team=art?.teams.find(t=>t.id===p.teamId);rows.push([p.name,p.email||'',p.role||'',art?.name||'',team?.name||'',p.status,p.days[0]?'ja':'nee',p.days[1]?'ja':'nee',p.meals[0],p.meals[1]])}
 download(template?'pi-planner-deelnemers-sjabloon.csv':'pi-planner-deelnemers.csv',csv(rows),'text/csv;charset=utf-8');
}
function parseCSV(t){
 const sep=t.includes(';')?';':',';let rows=[],r=[],cur='',quote=false;
 for(let i=0;i<t.length;i++){const x=t[i];if(quote){if(x==='"'&&t[i+1]==='"'){cur+='"';i++}else if(x==='"')quote=false;else cur+=x}else if(x==='"')quote=true;else if(x===sep){r.push(cur);cur=''}else if(x==='\n'){r.push(cur.replace(/\r$/,''));rows.push(r);r=[];cur=''}else cur+=x}
 if(cur||r.length){r.push(cur);rows.push(r)}
 return rows.filter(x=>x.some(v=>v.trim()));
}
function importCSV(text){
 const rows=parseCSV(text.replace(/^\uFEFF/,''));if(rows.length<2)throw new Error('CSV bevat geen deelnemers');
 const headers=rows[0].map(x=>x.toLowerCase().trim()),idx=k=>headers.indexOf(k);
 if(idx('naam')<0)throw new Error('Kolom "naam" ontbreekt');
 let added=0;
 for(const values of rows.slice(1)){
  const get=k=>idx(k)<0?'':(values[idx(k)]||'').trim(),name=get('naam');if(!name)continue;
  const art=state.arts.find(x=>x.name.toLowerCase()===get('art').toLowerCase()),team=art?.teams.find(x=>x.name.toLowerCase()===get('team').toLowerCase());
  const yes=v=>v.toLowerCase()!=='nee'&&v.toLowerCase()!=='no'&&v!=='0';
  const status=['invited','yes','maybe','no'].includes(get('rsvp'))?get('rsvp'):'invited';
  state.people.push({id:uid(),name,email:get('email'),role:get('rol'),artId:art?.id||'',teamId:team?.id||'',status,days:[yes(get('dag1')),yes(get('dag2'))],meals:[get('lunch1')||'regular',get('lunch2')||'regular'],mealNote:''});
  added++;
 }
 save();toast(added+' deelnemers geïmporteerd.');renderDashboard();
}
function csvCatering(){const lab={regular:'Standaard',veggie:'Vegetarisch',vegan:'Vegan',other:'Anders',none:'Geen lunch'};
 const rows=[['dag','datum','dieet','aantal']];
 for(let day=0;day<2;day++){const ms=mealsFor(day);Object.keys(lab).forEach(k=>rows.push(['Dag '+(day+1),state.days[day],lab[k],ms[k]]))}
 download('pi-planner-catering.csv',csv(rows),'text/csv;charset=utf-8');
}
function saveJSON(){download('pi-planner-'+(state.piName||'event').replace(/[^a-z0-9-]/gi,'-').toLowerCase()+'.json',JSON.stringify(state,null,2),'application/json;charset=utf-8')}
function compactICS(t){return String(t??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,x=>'\\'+x)}
function stamp(day,time){return day.replace(/-/g,'')+'T'+time.replace(':','')+'00'}
function icsEvents(agenda=false){
 const now=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NOVYX FORGE//PI Event Planner//NL','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 const events=agenda?state.agenda: [{id:'day1',day:0,start:'09:00',end:'17:00',title:state.eventName+' – dag 1'},{id:'day2',day:1,start:'09:00',end:'17:00',title:state.eventName+' – dag 2'}];
 for(const a of events){const day=state.days[a.day];if(!day)continue;lines.push('BEGIN:VEVENT','UID:'+a.id+'-'+day+'@safe-agile-forge.local','DTSTAMP:'+now,'DTSTART:'+stamp(day,a.start),'DTEND:'+stamp(day,a.end),'SUMMARY:'+compactICS(a.title),'LOCATION:'+compactICS(state.venue+' '+state.address),'DESCRIPTION:'+compactICS('PI: '+state.piName+'\nOrganisatie: '+state.organizer+'\n'+(a.owner||'')+'\nControleer deze afspraak en verstuur je uitnodigingen zelf.'),'END:VEVENT')}
 lines.push('END:VCALENDAR');
 return lines.map(foldICS).join('\r\n')+'\r\n';
}
function foldICS(line){let buf='',n=0,out=[];for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(n+bytes>74){out.push(buf);buf=' '+ch;n=bytes+1}else{buf+=ch;n+=bytes}}out.push(buf);return out.join('\r\n')}
function copyInvite(){const t=invitationText();if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t).then(()=>toast('Uitnodiging gekopieerd.')).catch(()=>window.prompt('Kopieer de uitnodiging:',t));else window.prompt('Kopieer de uitnodiging:',t)}
function dispatchAction(name){
 if(name==='jsonExport')return saveJSON();
 if(name==='jsonImport'){return $('fileJSON').click()}
 if(name==='csvTemplate')return exportCSV(true);
 if(name==='importCSV')return $('fileCSV').click();
 if(name==='exportCSV')return exportCSV(false);
 if(name==='cateringCSV')return csvCatering();
 if(name==='copyInvite')return copyInvite();
 if(name==='eventICS'){return download('pi-planning-event.ics',icsEvents(),'text/calendar;charset=utf-8')}
 if(name==='agendaICS'){return download('pi-planning-draaiboek.ics',icsEvents(true),'text/calendar;charset=utf-8')}
 if(name==='mailto'){const sub=encodeURIComponent('Uitnodiging '+state.piName+' PI Planning'),body=encodeURIComponent(invitationText());return window.location.href='mailto:?subject='+sub+'&body='+body}
 if(name==='print'){tab='agenda';renderDashboard();return window.print()}
 if(name==='addAgenda'){editing='new';tab='agenda';renderDashboard();return $('agendaForm')?.scrollIntoView({behavior:'smooth',block:'center'})}
 if(name==='cancelAgenda'){editing=null;renderDashboard();return}
 if(name==='saveAgenda'){
  const get=k=>$(k).value.trim();
  const title=get('agendaTitle'),start=get('agendaStart'),end=get('agendaEnd');
  if(!title||!start||!end||end<=start)return toast('Vul een titel en geldige start- en eindtijd in.');
  const data={day:+get('agendaDay'),title,start,end,location:get('agendaLocation'),owner:get('agendaOwner')};
  if(editing==='new')state.agenda.push({id:uid(),...data});else {const row=state.agenda.find(x=>x.id===editing);if(row)Object.assign(row,data)}
  editing=null;save();renderDashboard();return toast('Programma bijgewerkt.');
 }
}
function onViewClick(e){
 const el=e.target.closest('button');if(!el)return;
 if(el.dataset.tab){tab=el.dataset.tab;editing=null;renderDashboard();return}
 if(el.dataset.action){dispatchAction(el.dataset.action);return}
 if(el.dataset.editAgenda){editing=el.dataset.editAgenda;renderDashboard();return $('agendaForm')?.scrollIntoView({behavior:'smooth',block:'center'})}
 if(el.dataset.removeAgenda){if(confirm('Dit onderdeel uit het programma verwijderen?')){state.agenda=state.agenda.filter(a=>a.id!==el.dataset.removeAgenda);save();renderDashboard()}return}
 if(el.dataset.personDelete!==undefined){const i=+el.dataset.personDelete;if(confirm('Deelnemer '+state.people[i]?.name+' verwijderen?')){state.people.splice(i,1);save();renderDashboard()}return}
 if(el.dataset.removeCheck!==undefined){state.checks.splice(+el.dataset.removeCheck,1);save();renderDashboard()}
}
function onViewChange(e){
 const el=e.target;
 function set(key,index,property){if(state.people[index]){state.people[index][key]=property;save();renderDashboard()}}
 if(el.dataset.personArt!==undefined){const i=+el.dataset.personArt;const p=state.people[i];if(p){p.artId=el.value;p.teamId='';save();renderDashboard()}return}
 if(el.dataset.personTeam!==undefined){set('teamId',+el.dataset.personTeam,el.value);return}
 if(el.dataset.personStatus!==undefined){set('status',+el.dataset.personStatus,el.value);return}
 if(el.dataset.personDay!==undefined){const [i,d]=el.dataset.personDay.split(':').map(Number);if(state.people[i]){state.people[i].days[d]=el.checked;save();renderDashboard()}return}
 if(el.dataset.meal!==undefined){const [i,d]=el.dataset.meal.split(':').map(Number);if(state.people[i]){state.people[i].meals[d]=el.value;save();renderDashboard()}return}
 if(el.dataset.mealNote!==undefined){const i=+el.dataset.mealNote;if(state.people[i]){state.people[i].mealNote=el.value;save()}return}
 if(el.dataset.checkIndex!==undefined){const x=state.checks[+el.dataset.checkIndex];if(x){x.done=el.checked;save();renderDashboard()}return}
}
function onViewSubmit(e){
 if(e.target.id==='newPerson'){e.preventDefault();const d=new FormData(e.target),name=String(d.get('name')||'').trim();if(!name)return;state.people.push({id:uid(),name,email:String(d.get('email')||'').trim(),role:String(d.get('role')||'').trim(),artId:'',teamId:'',status:'invited',days:[true,true],meals:['regular','regular'],mealNote:''});save();renderDashboard();toast('Deelnemer toegevoegd.');return}
 if(e.target.id==='newCheck'){e.preventDefault();const d=new FormData(e.target),name=String(d.get('name')||'').trim();if(!name)return;state.checks.push({id:uid(),name,done:false});save();renderDashboard();return}
}
function wizardChange(e){
 const el=e.target,d=el.dataset;
 if(d.artCount!==undefined){setArtCount(digit(el.value,1));renderWizard();return}
 if(d.artTeams!==undefined){setTeamCount(+d.artTeams,digit(el.value,1));renderWizard();return}
 if(d.artName!==undefined){if(state.arts[+d.artName])state.arts[+d.artName].name=el.value;save();return}
 if(d.teamName!==undefined){const [a,t]=d.teamName.split(':').map(Number);if(state.arts[a]?.teams[t])state.arts[a].teams[t].name=el.value;save();return}
 if(d.teamMembers!==undefined){const [a,t]=d.teamMembers.split(':').map(Number);if(state.arts[a]?.teams[t])state.arts[a].teams[t].members=max(digit(el.value,1),1,60);save();return}
 if(d.day!==undefined){const i=+d.day;state.days[i]=el.value;if(i===0&&!state.days[1])state.days[1]=dateAdd(el.value,1);save();if(i===0)renderWizard();return}
 if(d.checkCatering!==undefined){state.catering=el.checked;save();return}
 if(d.num!==undefined){state[d.num]=digit(el.value);save();return}
 if(d.field!==undefined){state[d.field]=el.value;save();return}
}
$('wizardContents').addEventListener('change',wizardChange);
$('wizardContents').addEventListener('input',e=>{const d=e.target.dataset;if(d.artName!==undefined||d.teamName!==undefined||d.field!==undefined){wizardChange(e)}});
$('prevStep').addEventListener('click',()=>{if(step>0){step--;renderWizard()}});
$('nextStep').addEventListener('click',goNext);
$('editSetup').addEventListener('click',()=>{step=0;renderWizard();window.scrollTo({top:0,behavior:'smooth'})});
$('tabs').addEventListener('click',e=>{const btn=e.target.closest('button[data-tab]');if(btn){tab=btn.dataset.tab;editing=null;renderDashboard()}});
$('view').addEventListener('click',onViewClick);
$('view').addEventListener('change',onViewChange);
$('view').addEventListener('submit',onViewSubmit);
$('exportJSON').addEventListener('click',saveJSON);
$('importJSON').addEventListener('click',()=>$('fileJSON').click());
$('fileJSON').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.arts)||!Array.isArray(data.agenda)||!Array.isArray(data.people)||!Array.isArray(data.checks)||!Array.isArray(data.days))throw new Error('Geen geldig eventbestand');state={...fresh(),...data};save();state.ready?renderDashboard():renderWizard();toast('Event succesvol ingeladen.')}catch(err){toast('Import mislukt: '+err.message)}e.target.value=''});
$('fileCSV').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{importCSV(await f.text())}catch(err){toast('CSV-import mislukt: '+err.message)}e.target.value=''});
state.ready?renderDashboard():renderWizard();
