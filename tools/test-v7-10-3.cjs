'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
const m=require('../assets/menta-config-v7-10.js');
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const home=fs.readFileSync('index.html','utf8'),students=fs.readFileSync('studenti.html','utf8');
check('release is V7.10.3',()=>{assert.equal(v.web_version,'7.10.3');assert.equal(v.menta_version,'7.10.3');assert.equal(v.student_path_version,'7.10.3');});
check('home has one prominent student entry',()=>{assert.equal((home.match(/id="student-entry-title"/g)||[]).length,1);assert.match(home,/Sei uno studente\?/);assert.match(home,/href="\/studenti\.html"/);assert.match(home,/href="\/universita\.html"/);assert(!home.includes('<strong>Studenti e università</strong>'));});
check('student hub exposes four distinct starting paths',()=>{for(const href of ['/universita.html','/scuole.html','/servizi.html','/ascolto.html'])assert(students.includes('href="'+href+'"'));assert.equal((students.match(/class="student-path-card"/g)||[]).length,4);assert.match(students,/<h1>Sei uno studente\?<\/h1>/);});
check('student CSS is local and referenced',()=>{assert(fs.existsSync('assets/studenti-v7-10-3.css'));assert(home.includes('/assets/studenti-v7-10-3.css'));assert(students.includes('/assets/studenti-v7-10-3.css'));});
check('generic Menta student intent uses hub while explicit university stays direct',()=>{assert.equal(m.version,'7.10.3');assert.equal(m.routes.students.page,'/studenti.html');const s=m.intents.find(x=>x.id==='students');const u=m.intents.find(x=>x.id==='university');assert.deepEqual(s.routes,['students']);assert.deepEqual(u.routes,['university']);assert(u.priority>s.priority);});
check('current clinical and support counts stay unchanged by UX release',()=>{assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,315);assert.equal(v.map.unlocated,128);assert.equal(v.support_layer.consultori_master,135);});
const report={version:'7.10.3',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
