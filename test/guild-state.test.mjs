import test from 'node:test';import assert from 'node:assert/strict';
import {guildState} from '../src/guild-state.mjs';import {dueReminders} from '../src/reminders.mjs';
test('migration preserves old receipts and topic overrides',()=>{
 const old={receipts:{'class:24':{status:'sent'}},overrides:{'2026-09-16':'MF'},paused:false};
 const s=guildState(old,'one','channel1');assert.equal(s.data.guilds.one.channelId,'channel1');assert.deepEqual(s.state.receipts,old.receipts);assert.deepEqual(s.state.overrides,old.overrides);
});
test('concurrent server contexts isolate receipts, pauses and default dashboard',async()=>{
 const s=guildState({version:2,guilds:{one:{receipts:{},overrides:{},paused:false},two:{receipts:{},overrides:{},paused:false}}},'one');
 await Promise.all(Object.entries(s.data.guilds).map(([id,g])=>s.context.run({id,g},async()=>{await new Promise(r=>setTimeout(r,id==='one'?5:1));s.state.receipts[id]={status:'sent'};s.state.paused=id==='two';assert.equal(s.local().id,id);} )));
 assert.deepEqual(Object.keys(s.data.guilds.one.receipts),['one']);assert.deepEqual(Object.keys(s.data.guilds.two.receipts),['two']);assert.equal(s.state.paused,false);assert.equal(s.data.guilds.two.paused,true);
});
test('missed 24-hour reminder catches up once with latest applicable window',()=>{
 const now=Date.parse('2026-09-15T12:00Z'),e={id:'event',start:new Date(now+10*3600000).toISOString()};
 assert.equal(dueReminders([e],{},now)[0].hours,12);assert.equal(dueReminders([e],{'event:12':{status:'uncertain'}},now).length,0);
});

test('dashboard follows primary guild configured after startup',()=>{
 let primary=null;const s=guildState({version:2,guilds:{}},()=>primary);
 s.data.guilds.one={channelId:'channel1',receipts:{reminder:{status:'sent'}},overrides:{},paused:false};primary='one';
 assert.equal(s.local().id,'one');assert.equal(s.state.receipts.reminder.status,'sent');s.state.paused=true;assert.equal(s.data.guilds.one.paused,true);
});
