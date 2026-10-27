'use strict';
/* SAFe Agile Forge terminology guide; standalone browser-only UI. */
(function(){
 const glossary=[
 ['ART','Agile Release Train: meerdere samenwerkende Agile Teams die gezamenlijk waarde leveren.','Meerdere teams die samen één oplossing realiseren.'],
 ['PI','Planning Interval: periode waarin een ART gezamenlijk doelen nastreeft.','Meerdere iteraties en meestal een IP Iteration.'],
 ['PI Planning','Gezamenlijk een haalbaar plan maken met doelen, risico’s en afhankelijkheden.','Een realistisch plan is het doel, niet alleen een kalender.'],
 ['PI Objectives','Meetbare resultaten die teams in de komende PI willen bereiken.','Een uitkomst voor gebruikers, niet slechts een takenlijst.'],
 ['Committed Objectives','Doelen waarvoor het team toezegt zich maximaal in te zetten en afwijkingen tijdig te melden.','Niet gelijk aan een absolute garantie.'],
 ['Uncommitted Objectives','Gepland werk met meer onzekerheid dat niet binnen hetzelfde commitment valt.','Geen extraatje voor als er tijd overblijft.'],
 ['Business Value','Waarde die Business Owners aan PI Objectives toekennen.','Planned BV vóór de PI, Actual BV na uitvoering.'],
 ['ART Planning Board','Bord met features, teams, iteraties, afhankelijkheden en mijlpalen.','Laat zien wie op welk moment elkaar nodig heeft.'],
 ['ROAM','PI Risks classificeren: Resolved, Owned, Accepted, Mitigated.','Owned vereist een eigenaar.'],
 ['Confidence Vote','Teams en de ART geven aan hoeveel vertrouwen zij hebben in hun plan.','Lage confidence bespreek je en kan tot herplanning leiden.'],
 ['RTE','Release Train Engineer: ondersteunt de ART bij flow, afstemming, PI Planning en verbetering.','Organiseert het ritme maar presenteert niet alle inhoud.'],
 ['Product Manager','Bepaalt productrichting en prioriteiten op ART-niveau.','Visie, roadmap en featurevolgorde voorbereiden.'],
 ['Product Owner','Verduidelijkt waarde, teambacklog en teamdoelstellingen.','Stories en prioriteiten met teams bespreken.'],
 ['Scrum Master','Ondersteunt het team bij samenwerking, flow en continu verbeteren.','Faciliteert teamoverleggen en helpt impediments oplossen.'],
 ['Business Owner','Verbindt bedrijfswaarde, richting en beslissingen.','Licht Business Context toe en waardeert PI Objectives.'],
 ['System Architect','Bewaakt technische richting, enablers en architectuurkaders.','Bereidt Architecture Vision voor.'],
 ['IP Iteration','Tijd voor innovatie, leren, verbetering en voorbereiding van de volgende PI.','Niet standaard inzetten om gemiste feature-commitments in te halen.'],
 ['System Demo','Geïntegreerde werkende ART-resultaten laten zien voor feedback.','Demonstreer echte integratie, geen losse presentaties.'],
 ['Inspect & Adapt','PI-resultaten evalueren, oorzaken onderzoeken en verbeteracties kiezen.','Geef de verbeteracties een eigenaar en opvolging.'],
 ['Readiness','Controle dat organisatie, inhoud en logistiek echt gereed zijn.','Groene status is een handmatige bevestiging.']
 ];
 const css='#forgeHelpButton{position:fixed;z-index:75;right:18px;bottom:20px;background:#135d5b;color:#fff;border:1px solid #80d5bf;border-radius:999px;padding:12px 16px;font:bold 12px system-ui;box-shadow:0 8px 30px #174c4b5c;cursor:pointer}#forgeHelpDialog{max-width:min(720px,calc(100vw - 24px));max-height:84vh;width:100%;border:1px solid #8de1c8;border-radius:22px;background:#fff;color:#193e43;padding:0;box-shadow:0 20px 80px #07151a8c}#forgeHelpDialog::backdrop{background:#071922ae;backdrop-filter:blur(4px)}.forge-help-head{padding:22px;display:flex;gap:18px;justify-content:space-between;align-items:start;background:#173b4b;color:#e9fff8}.forge-help-head h2{font-size:23px;margin:5px 0}.forge-help-head p{font-size:12px;color:#b8d3d1;margin:0}.forge-help-head button{background:#285568;border:1px solid #83c1b2;border-radius:9px;color:#fff;padding:9px 12px;cursor:pointer}.forge-help-body{padding:20px 22px;overflow-y:auto;max-height:calc(84vh - 120px)}.forge-help-body label{display:block;font-weight:750;font-size:12px}.forge-help-body input[type=search]{display:block;width:100%;background:#fff;color:#193e43;margin:8px 0 15px;padding:12px;border:1px solid #c3e0d6;border-radius:10px}.forge-term{padding:13px;background:#f7fbf9;border:1px solid #d7e9de;border-radius:11px;margin:8px 0}.forge-term h3{color:#148475;margin:0 0 4px;font-size:14px}.forge-term p{margin:0;font-size:12px;color:#386a63;line-height:1.55}.forge-term small{display:block;color:#7e9790;margin-top:7px}.forge-help-mode{padding:10px;border-radius:10px;background:#e8f6ee;margin-bottom:15px;color:#1a6558}.forge-help-mode label{display:flex;align-items:center;gap:10px}.forge-help-mode input{width:auto}.forge-help-footer{color:#7b9189;font-size:11px;line-height:1.55}';
 const el=document.createElement('style');el.textContent=css;document.head.appendChild(el);
 const trigger=document.createElement('button');trigger.id='forgeHelpButton';trigger.type='button';trigger.textContent='? SAFe-hulp';trigger.setAttribute('aria-label','Open SAFe-begrippenhulp');document.body.appendChild(trigger);
 const dialog=document.createElement('dialog');dialog.id='forgeHelpDialog';dialog.innerHTML='<div class="forge-help-head"><div><small>SAFe AGILE FORGE · HELP</small><h2>Wat betekent dit?</h2><p>Uitleg in gewone taal, met praktische voorbeelden.</p></div><button type="button" id="forgeHelpClose">Sluiten ✕</button></div><div class="forge-help-body"><label for="forgeHelpSearch">Zoek een begrip</label><input type="search" id="forgeHelpSearch" placeholder="Bijv. ROAM, PI Objectives of Business Value"><div class="forge-help-mode"><label><input id="forgeHelpBeginner" type="checkbox"> Beginneruitleg tonen</label></div><div id="forgeHelpResults"></div><p class="forge-help-footer">Uitleg is vereenvoudigd en geschreven in eigen woorden. Gebruik de officiële SAFe-materialen en ART-afspraken voor methodische besluiten.</p></div>';document.body.appendChild(dialog);
 const search=dialog.querySelector('#forgeHelpSearch'),out=dialog.querySelector('#forgeHelpResults'),mode=dialog.querySelector('#forgeHelpBeginner');
 const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function render(){const q=search.value.trim().toLowerCase(),hits=glossary.filter(x=>x.join(' ').toLowerCase().includes(q));out.innerHTML=hits.length?hits.map(x=>'<div class="forge-term"><h3>'+escape(x[0])+'</h3><p>'+escape(x[1])+'</p><small>Praktijkvoorbeeld: '+escape(x[2])+'</small></div>').join(''):'<div class="forge-term">Geen passende begrippen gevonden.</div>'}
 try{mode.checked=localStorage.getItem('forge-beginner-mode')!=='expert'}catch(e){mode.checked=true}
 mode.addEventListener('change',()=>{try{localStorage.setItem('forge-beginner-mode',mode.checked?'beginner':'expert')}catch(e){}});
 search.addEventListener('input',render);
 trigger.addEventListener('click',()=>{render();if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');search.focus()});
 dialog.querySelector('#forgeHelpClose').addEventListener('click',()=>{if(dialog.close)dialog.close();else dialog.removeAttribute('open');trigger.focus()});
 render();
})();
