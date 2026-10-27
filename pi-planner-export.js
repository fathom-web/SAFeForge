'use strict';
/* Native offline .xlsx (OOXML ZIP) + PDF event draaiboek, no third-party libraries. */
const enc=new TextEncoder();
function xml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')}
function xcol(n){let out='';n++;while(n){n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26)}return out}
function xsheet(rows){
 const cols=Math.max(2,...rows.map(r=>r.length)),head=Math.min(48,cols);
 const parts=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
 '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
 '<sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
 '<sheetFormatPr defaultRowHeight="17"/>','<cols>'];
 for(let c=0;c<cols;c++)parts.push('<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+(c===0?30:c===1?28:c===2?24:20)+'" customWidth="1"/>');
 parts.push('</cols><sheetData>');
 rows.forEach((row,r)=>{
  parts.push('<row r="'+(r+1)+'"'+(r===0?' ht="30" customHeight="1"':r===2?' ht="23" customHeight="1"':'')+'>');
  row.forEach((value,c)=>{
   const ref=xcol(c)+(r+1),style=r===0?2:r===2?1:0;
   if(typeof value==='number'&&Number.isFinite(value))parts.push('<c r="'+ref+'" s="'+style+'"><v>'+value+'</v></c>');
   else parts.push('<c r="'+ref+'" t="inlineStr" s="'+style+'"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>');
  });
  parts.push('</row>');
 });
 parts.push('</sheetData><autoFilter ref="A3:'+xcol(head-1)+Math.max(rows.length,3)+'"/></worksheet>');
 return parts.join('');
}
function crcTable(){const t=[];for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t.push(c>>>0)}return t}
const CRCT=crcTable();
function crc32(data){let c=0xffffffff;for(const b of data)c=CRCT[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function put16(d,o,v){d.setUint16(o,v,true)}function put32(d,o,v){d.setUint32(o,v>>>0,true)}
function zipStored(entries){
 const local=[],central=[];let offset=0;
 for(const [path,data] of entries){
  const name=enc.encode(path),body=enc.encode(data),crc=crc32(body);
  const h=new Uint8Array(30+name.length),d=new DataView(h.buffer);
  put32(d,0,0x04034b50);put16(d,4,20);put16(d,6,0);put16(d,8,0);put16(d,10,0);put16(d,12,0);put32(d,14,crc);put32(d,18,body.length);put32(d,22,body.length);put16(d,26,name.length);put16(d,28,0);h.set(name,30);
  local.push(h,body);
  const c=new Uint8Array(46+name.length),v=new DataView(c.buffer);
  put32(v,0,0x02014b50);put16(v,4,20);put16(v,6,20);put16(v,8,0);put16(v,10,0);put16(v,12,0);put16(v,14,0);put32(v,16,crc);put32(v,20,body.length);put32(v,24,body.length);put16(v,28,name.length);put16(v,30,0);put16(v,32,0);put16(v,34,0);put16(v,36,0);put32(v,38,0);put32(v,42,offset);c.set(name,46);central.push(c);
  offset+=h.length+body.length;
 }
 const cd=central.reduce((n,x)=>n+x.length,0),e=new Uint8Array(22),v=new DataView(e.buffer);
 put32(v,0,0x06054b50);put16(v,4,0);put16(v,6,0);put16(v,8,entries.length);put16(v,10,entries.length);put32(v,12,cd);put32(v,16,offset);put16(v,20,0);
 return new Blob([...local,...central,e],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function workbookXlsx(tabs){
 const specs=tabs.map((t,i)=>({name:t[0].replace(/[\\/*?:[\]]/g,'').slice(0,31),rows:t[1],id:i+1}));
 const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+specs.map(x=>'<Override PartName="/xl/worksheets/sheet'+x.id+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';
 const rel='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const main='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+specs.map(x=>'<sheet name="'+xml(x.name)+'" sheetId="'+x.id+'" r:id="rId'+x.id+'"/>').join('')+'</sheets></workbook>';
 const workbookRel='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+specs.map(x=>'<Relationship Id="rId'+x.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+x.id+'.xml"/>').join('')+'<Relationship Id="rId'+(specs.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FF0A5C59"/><sz val="16"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF126A67"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 const files=[['[Content_Types].xml',types],['_rels/.rels',rel],['xl/workbook.xml',main],['xl/_rels/workbook.xml.rels',workbookRel],['xl/styles.xml',styles],...specs.map(x=>['xl/worksheets/sheet'+x.id+'.xml',xsheet(x.rows)])];
 return zipStored(files);
}
function prepareWorkbook(){
 ensureOperations();
 const c=scaleCounts(),issues=scheduleWarnings(),att=state.people.filter(p=>p.status==='yes');
 const artById=id=>state.arts.find(x=>x.id===id);
 const taskClosed=state.tasks.filter(t=>t.status==='done').length;
 const make=(title,headers,rows)=>[title,[[title.toUpperCase(),state.piName,'Gegenereerd: '+new Date().toLocaleString('nl-NL')],['SAFe Agile Forge – PI Event Command Center'],headers,...rows]];
 const info=[
 ['Evenement',state.eventName],['PI',state.piName],['Dag 1',state.days[0]],['Dag 2',state.days[1]],['Locatie',state.venue],['Adres',state.address],['Deelnamevorm',state.format],['ART-indeling',state.planningMode],
 ['Aantal ARTs',c.arts],['Teams',c.teams],['Verwacht totaal',c.people],['Geregistreerd',state.people.length],['Bevestigd',att.length],['Taken afgerond',taskClosed],['Open taken',state.tasks.length-taskClosed],['Open signalen',issues.length],['Organisator',state.organizer],['Contact',state.email],
 ['Notitie','Lokale export; bescherm eventuele contact- en cateringgegevens.']
 ];
 let ti=0,teamRows=[];
 for(const art of state.arts)for(const t of art.teams){ti++;const name=t.room||'Breakout '+ti,registered=state.people.filter(p=>p.artId===art.id&&p.teamId===t.id);teamRows.push([art.name,t.name,+t.members||0,name,state.roomSpecs.find(r=>r.name===name)?.capacity||'',t.sm||'',t.po||'',registered.length,registered.filter(p=>p.status==='yes').length])}
 const prog=state.agenda.slice().sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start)).map(a=>['Dag '+(a.day+1),state.days[a.day],a.start,a.end,a.title,a.location,a.owner]);
 const guests=state.people.map(p=>[p.name,p.email,p.role,artById(p.artId)?.name||'',artById(p.artId)?.teams.find(t=>t.id===p.teamId)?.name||'',p.status,p.days[0]?'Ja':'Nee',p.days[1]?'Ja':'Nee',p.checkin?.[0]?'Ja':'Nee',p.checkin?.[1]?'Ja':'Nee',p.meals[0],p.meals[1],p.mealNote||'']);
 const tasks=state.tasks.map(t=>[t.title,t.category,t.owner,t.due,t.status,t.priority]);
 const sp=state.speakers.map(x=>{const a=state.agenda.find(t=>t.id===x.agendaId);return [a?.title||'Algemeen',a?'Dag '+(a.day+1):'',a?.start||'',a?.end||'',x.name,x.email,x.status,x.note]});
 const allocation=getRooms();
 const rooms=state.roomSpecs.map(r=>{const assigned=allocation.alloc[r.name]||[],people=assigned.reduce((n,x)=>n+x.members,0);return [r.name,+r.capacity||0,assigned.map(a=>a.art+': '+a.team).join(', '),people,people>r.capacity?'ONVOLDOENDE':'OK']});
 const catering=[0,1].map(day=>{const m=mealsFor(day),cs=checkStats(day);return ['Dag '+(day+1),state.days[day],cs.list.length,cs.arrived.length,m.regular,m.veggie,m.vegan,m.other,m.none,cs.meals.length]});
 const dependencies=state.dependencies.map(d=>[artById(d.from)?.name||'',artById(d.to)?.name||'',d.title,d.owner,d.status]);
 const feedback=state.feedback.map(f=>[f.title,f.score||'',f.comment||'',f.owner||'',f.status]);
 const checklist=state.checks.map(c=>[c.name,c.done?'Gereed':'Open']);
 return [
 make('Dashboard',['Onderwerp','Waarde'],info),
 make('ARTs en teams',['ART','Team','Verwacht','Breakout','Capaciteit','Scrum Master','Product Owner','Geregistreerd','Bevestigd'],teamRows),
 make('Programma',['Dag','Datum','Start','Einde','Sessie','Ruimte','Verantwoordelijke'],prog),
 make('Deelnemers',['Naam','E-mail','Rol','ART','Team','RSVP','Dag 1','Dag 2','Check-in 1','Check-in 2','Lunch 1','Lunch 2','Notitie'],guests),
 make('Organisatie',['Taak','Categorie','Eigenaar','Deadline','Status','Prioriteit'],tasks),
 make('Sprekers',['Sessie','Dag','Start','Einde','Naam','E-mail','Status','Notitie'],sp),
 make('Ruimtes',['Ruimte','Capaciteit','Toegewezen teams','Benodigde plaatsen','Controle'],rooms),
 make('Catering',['Dag','Datum','RSVP bevestigd','Aangekomen','Standaard','Vegetarisch','Vegan','Anders','Geen lunch','Lunches aangekomen'],catering),
 make('Conflicten',['Ernst','Signaal','Toelichting'],issues.map(i=>[i.level,i.title,i.desc])),
 make('Afhankelijkheden',['Van ART','Naar ART','Afhankelijkheid','Eigenaar','Status'],dependencies),
 make('Evaluatie',['Onderwerp','Score (1-5)','Toelichting','Eigenaar','Status'],feedback),
 make('Checklist',['Actie','Status'],checklist),
 ...(state.method?[
  make('SAFe Readiness',['Categorie','Controlepunt','Eigenaar','Status','Toelichting'],state.method.readiness.map(x=>[x.group,x.title,x.owner,x.status,x.note])),
  make('Teamcapaciteit',['ART','Team','Iteratie','Beschikbaar','Gepland','Belasting %'],state.method.capacity.map(x=>{const t=mfTeam(x.teamId);return [t?.art.name||'',t?.team.name||'',x.iteration,+x.available||0,+x.planned||0,x.available?Math.round((+x.planned||0)/x.available*100):0]})),
  make('PI Objectives',['ART','Team','PI Objective','Commitment','Planned BV','Actual BV','Status'],state.method.objectives.map(x=>{const t=mfTeam(x.teamId);return [t?.art.name||'',t?.team.name||'',x.title,x.commitment,+x.plannedBV||0,+x.actualBV||0,x.status]})),
  make('ART Planning Board',['ART','Team','Iteratie','Feature / Enabler','Type','Status'],state.method.features.map(x=>{const t=mfTeam(x.teamId);return [t?.art.name||'',t?.team.name||'',x.iteration,x.title,x.type,x.status]})),
  make('ROAM Risicos',['ART','Risico','ROAM','Eigenaar','Maatregel'],state.method.risks.map(x=>[artById(x.artId)?.name||'',x.title,x.roam,x.owner,x.action])),
  make('Confidence Votes',['ART','Team','Confidence 1-5','Toelichting'],state.method.votes.map(x=>{const t=mfTeam(x.teamId);return [t?.art.name||'',t?.team.name||'',x.score,x.note]})),
  make('Planningbesluiten',['Besluit','Eigenaar','Status'],state.method.decisions.map(x=>[x.title,x.owner,x.status]))
 ]:[])];
}
function saveEventBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportEventExcel(){
 try{const file=workbookXlsx(prepareWorkbook());saveEventBlob(file,'pi-planner-'+(state.piName||'planning').replace(/[^a-z0-9-]/gi,'-')+'.xlsx');toast('Excel-werkmap met '+prepareWorkbook().length+' tabbladen gedownload.')}
 catch(e){toast('Excel-export mislukt: '+e.message);}
}
/* Local PDF generator uses PDF 1.4 Type1 fonts, ASCII-safe content and automatic page breaks. */
function pdfAscii(s){return String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/[^ -~]/g,' ')}
function pdfE(s){return pdfAscii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
function pdfLines(str,maxChars){const words=pdfAscii(str).split(/\s+/),out=[];let line='';for(const w of words){if(!w)continue;if(w.length>maxChars){if(line){out.push(line);line=''}for(let i=0;i<w.length;i+=maxChars)out.push(w.slice(i,i+maxChars));continue}if(line&&line.length+w.length+1>maxChars){out.push(line);line=''}line+=(line?' ':'')+w;}if(line)out.push(line);return out.length?out:['']}
function pdfBuild(){
 ensureOperations();const pages=[];let ops=[],y=780,n=0;
 function draw(s,x,yy,size=10,bold=false,color='0.15 0.26 0.27'){ops.push(color+' rg\nBT /'+(bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x+' '+Math.round(yy)+' Tm ('+pdfE(s)+') Tj ET\n')}
 function page(){if(ops.length)pages.push(ops.join(''));ops=[];n++;ops.push('0.07 0.51 0.47 RG 2 w 40 811 m 555 811 l S\n');draw('SAFe AGILE FORGE  /  PI EVENT COMMAND CENTER',44,818,10,true,'0.07 0.48 0.42');draw('Pagina '+n,506,31,8);y=782;}
 function write(s,size=10,bold=false,indent=0,after=5){const width=Math.max(35,size===13?74:size===10?100:110)-indent/3;for(const ln of pdfLines(s,width)){if(y<73)page();draw(ln,45+indent,y,size,bold);y-=(size+5)}y-=after;}
 function title(s){if(y<150)page();y-=13;write(s,15,true,0,8)}
 function sub(s){if(y<130)page();y-=5;write(s,12,true,0,5)}
 function row(k,v){write(k+': '+String(v??''),9,false,5,2)}
 function list(lines){for(const l of lines)write('- '+l,9,false,8,3);}
 const stats=scaleCounts(),audit=scheduleWarnings(),tasks=state.tasks.slice().sort((a,b)=>(a.due||'999').localeCompare(b.due||'999'));
 page();title(state.eventName+' – '+state.piName);
 row('Dag 1',when(state.days[0]));row('Dag 2',when(state.days[1]));row('Locatie',state.venue+(state.address?' / '+state.address:''));row('Deelname',state.format);row('Organisator',state.organizer);row('Contact',state.email);row('ARTs en teams',stats.arts+' ART(s), '+stats.teams+' teams, circa '+stats.people+' personen');
 write('Dit draaiboek is een lokale momentopname. Controleer rollen, agenda, beschikbaarheid en eventueel vertrouwelijke persoonsgegevens voordat je het verspreidt.',9,false,0,10);
 title('01 – Programma en facilitatie');
 for(const day of [0,1]){sub('Dag '+(day+1)+' – '+when(state.days[day]));for(const a of state.agenda.filter(x=>x.day===day).sort((a,b)=>a.start.localeCompare(b.start)))write(a.start+'-'+a.end+'   '+a.title+'   | '+a.location+' | '+a.owner,9,false,7,4)}
 title('02 – ARTs, teams en breakout-ruimtes');
 let index=0;
 for(const a of state.arts){sub(a.name);for(const t of a.teams){index++;row(t.name,'ca. '+t.members+' mensen, '+(t.room||'Breakout '+index)+', SM: '+(t.sm||'open')+', PO: '+(t.po||'open'))}}
 title('03 – Organisatorische taken en deadlines');
 for(const t of tasks)write('['+t.status+'] '+t.title+' | eigenaar: '+(t.owner||'open')+' | deadline: '+(t.due||'open')+' | '+t.priority,9,false,5,5);
 title('04 – Sprekers en sessie-eigenaren');
 for(const s of state.speakers){const a=state.agenda.find(x=>x.id===s.agendaId);row(a?.title||'Algemeen',(s.name||'naam open')+' | '+s.status+' | '+(s.note||''))}
 title('05 – Deelnemers en RSVP');
 const statuses={invited:0,yes:0,maybe:0,no:0};state.people.forEach(p=>statuses[p.status]=(statuses[p.status]||0)+1);
 row('Aantal geregistreerd',state.people.length);for(const [k,v]of Object.entries(statuses))row(k,v);
 for(const p of state.people)write(p.name+' | '+p.role+' | '+p.status+' | Dag1: '+(p.days[0]?'ja':'nee')+' | Dag2: '+(p.days[1]?'ja':'nee'),9,false,5,3);
 title('06 – Catering per dag');
 for(const d of [0,1]){const meals=mealsFor(d),stats=checkStats(d);sub('Dag '+(d+1)+' – '+state.days[d]);row('Bevestigd',stats.list.length);row('Aanwezig gecheckt',stats.arrived.length);for(const [k,v]of Object.entries(meals))row(k,v);}
 title('07 – Risico, capaciteit en conflicten');
 if(!audit.length)write('Geen signalen op basis van de huidige invoer.',10,false,0,4);
 else for(const item of audit)write('['+item.level+'] '+item.title+' – '+item.desc,9,false,5,5);
 title('08 – Cross-ART afhankelijkheden');
 if(!state.dependencies.length)write('Nog geen afhankelijkheden vastgelegd.',9);
 else for(const d of state.dependencies)write((state.arts.find(a=>a.id===d.from)?.name||'')+' -> '+(state.arts.find(a=>a.id===d.to)?.name||'')+': '+d.title+' | '+d.owner+' | '+d.status,9,false,5,5);
 title('09 – Checklist');
 list(state.checks.map(c=>(c.done?'[x] ':'[ ] ')+c.name));
 title('10 – Evaluatie en vervolgacties');
 if(!state.feedback.length)write('Nog geen evaluatiepunten vastgelegd.',9);
 else for(const f of state.feedback)write(f.title+' | score '+(f.score||'nvt')+'/5 | '+f.status+' | eigenaar '+(f.owner||'open')+' | '+(f.comment||''),9,false,5,6);

 if(state.method){
  title('11 – SAFe Readiness');
  for(const x of state.method.readiness||[])write('['+x.status+'] '+x.group+' / '+x.title+' | '+x.owner,9,false,5,4);
  title('12 – Capaciteit per team en iteratie');
  for(const x of state.method.capacity||[]){const t=typeof mfTeam==='function'?mfTeam(x.teamId):null;write((t?.art.name||'')+' / '+(t?.team.name||'')+' I'+x.iteration+' | beschikbaar '+x.available+' | gepland '+x.planned,9,false,5,3)}
  title('13 – PI Objectives en Business Value');
  for(const x of state.method.objectives||[]){const t=typeof mfTeam==='function'?mfTeam(x.teamId):null;write((t?.team.name||'')+': '+x.title+' | '+x.commitment+' | planned BV '+x.plannedBV+' | actual BV '+x.actualBV,9,false,5,4)}
  title('14 – ART Planning Board');
  for(const x of state.method.features||[]){const t=typeof mfTeam==='function'?mfTeam(x.teamId):null;write('I'+x.iteration+' | '+(t?.team.name||'')+' | '+x.type+': '+x.title+' | '+x.status,9,false,5,4)}
  title('15 – ROAM en risicoopvolging');
  for(const x of state.method.risks||[])write('['+x.roam+'] '+x.title+' | eigenaar '+(x.owner||'open')+' | maatregel '+(x.action||'-'),9,false,5,4);
  title('16 – Confidence Votes, besluiten en Plan Rework');
  row('Herplanning',state.method.rework||'');row('Plan vastgesteld',state.method.committedAt||'Nog niet');
  for(const x of state.method.votes||[]){const t=typeof mfTeam==='function'?mfTeam(x.teamId):null;write((t?.team.name||'')+': '+x.score+'/5 '+x.note,9,false,5,4)}
  for(const x of state.method.decisions||[])write(x.title+' | '+x.owner+' | '+x.status,9,false,5,4);
 }
 if(ops.length)pages.push(ops.join(''));
 const objects=[];const push=x=>(objects.push(x),objects.length),catalog=push(''),pagesObj=push(''),normal=push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),bold=push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
 const children=[];
 for(const p of pages){const st=push('<< /Length '+p.length+' >>\nstream\n'+p+'endstream');children.push(push('<< /Type /Page /Parent '+pagesObj+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+normal+' 0 R /F2 '+bold+' 0 R >> >> /Contents '+st+' 0 R >>'));}
 objects[pagesObj-1]='<< /Type /Pages /Kids ['+children.map(x=>x+' 0 R').join(' ')+'] /Count '+children.length+' >>';
 objects[catalog-1]='<< /Type /Catalog /Pages '+pagesObj+' 0 R >>';
 let out='%PDF-1.4\n',offsets=[0];
 objects.forEach((o,i)=>{offsets.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
 const xref=out.length;out+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 out+='trailer\n<< /Size '+(objects.length+1)+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return new Blob([enc.encode(out)],{type:'application/pdf'});
}
function exportEventPDF(){
 try{const b=pdfBuild();saveEventBlob(b,'pi-planner-'+(state.piName||'planning').replace(/[^a-z0-9-]/gi,'-')+'-draaiboek.pdf');toast('PDF-draaiboek gedownload.')}
 catch(e){toast('PDF-export mislukt: '+e.message);}
}
