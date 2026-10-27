import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const codeFiles = ['pi-planner.js','pi-planner-advanced.js','pi-planner-export.js','pi-methodology.js','ceremony-features.js','safe-help.js'];
for(const file of codeFiles)assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}),'JavaScript syntax: '+file);

const index=read('index.html'),planner=read('pi-planner.html'),rsvp=read('rsvp.html');
const inline=index.match(/<script>([\s\S]*?)<\/script>/);
assert(inline,'Ceremony Planner inline script missing');
assert.doesNotThrow(()=>new vm.Script(inline[1],{filename:'index-inline.js'}));
assert.match(index,/id="forgeTaskChoice"/);
assert.match(index,/id="exportCeremonyExcel"/);
assert.match(planner,/id="phaseNav"/);
assert.match(planner,/id="eventExcel"/);
for(const p of codeFiles.slice(0,4))assert(planner.includes('src="./'+p),'Missing script include: '+p);
assert(planner.includes('pi-methodology.js'));
assert.match(rsvp,/mailto:/);

const elements=new Map();
const make=id=>{
 if(elements.has(id))return elements.get(id);
 const element={id, value:'', textContent:'', innerHTML:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},
  addEventListener(){},setAttribute(){},click(){},scrollIntoView(){},append(){},remove(){},focus(){},querySelectorAll:()=>[],closest:()=>null};
 elements.set(id,element);return element;
};
const document={
 getElementById:make,querySelectorAll:()=>[],querySelector:()=>null,
 createElement:t=>make('dynamic-'+t),
 body:{append(){},appendChild(){},classList:{add(){},remove(){}}},
 head:{appendChild(){}}
};
const localStorage={data:new Map(),getItem(k){return this.data.has(k)?this.data.get(k):null},setItem(k,v){this.data.set(k,v)}};
const sandbox=vm.createContext({document,localStorage,Blob,TextEncoder,URL,console,confirm:()=>true,
 window:{location:{href:'https://example.org/pi-planner.html'},confirm:()=>true,scrollTo(){},print(){}}});
for(const file of codeFiles.slice(0,4))vm.runInContext(read(file),sandbox,{filename:file});
vm.runInContext("state.days=['2027-05-04','2027-05-05'];state.ready=true;mfEnsure();state.method.objectives.push({id:'test',teamId:state.arts[0].teams[0].id,title:'Toon waarde aan stakeholders',commitment:'committed',plannedBV:8,actualBV:0,status:'planned'});",sandbox);

const pages=['overview','agenda','rooms','arts','tasks','speakers','audit','people','catering','invites','checklist','checkin','feedback','readiness','capacity','objectives','board','risks','confidence','results'];
for(const name of pages){
 vm.runInContext('tab='+JSON.stringify(name)+';renderDashboard();',sandbox);
 const body=make('view').innerHTML;
 assert(body.includes('class="panel'),'No panel for '+name);
 assert(!body.includes('Dit onderdeel kan niet worden geopend'),'Tab failed: '+name);
}
const sheetCount=vm.runInContext('prepareWorkbook().length',sandbox);
assert.equal(sheetCount,20,'20 sheet workbook expected');
const xlsx=vm.runInContext('workbookXlsx(prepareWorkbook())',sandbox);
const z=new Uint8Array(await xlsx.arrayBuffer());
assert.deepEqual(Array.from(z.slice(0,4)),[0x50,0x4b,0x03,0x04],'Valid ZIP-backed XLSX expected');

const pdf=vm.runInContext('pdfBuild()',sandbox);
const p=new TextDecoder().decode(await pdf.arrayBuffer());
assert(p.startsWith('%PDF-1.4'),'Valid PDF header');
assert(p.includes('startxref')&&p.trimEnd().endsWith('%%EOF'),'Valid PDF trailer');

console.log('SAFe Forge tests passed: syntax, scripts, 20 tabs, 20-sheet XLSX, PDF.');
