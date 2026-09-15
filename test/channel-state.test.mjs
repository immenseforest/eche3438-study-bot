import test from 'node:test';import assert from 'node:assert/strict';
import {channelEntry,configureChannel} from '../src/channel-state.mjs';
import {guildState} from '../src/guild-state.mjs';
test('two reminder channels in one server retain independent groups and settings',()=>{
 const data={version:2,guilds:{server:{channelId:'c',receipts:{sent:{status:'sent'}},overrides:{date:'MF'},paused:true}}};
 const [,c]=configureChannel(data,'server','c');assert.equal(c.group,'C');assert.equal(c.paused,true);
 const [,a]=configureChannel(data,'server','a','A');assert.equal(a.group,'A');assert.deepEqual(a.receipts,{});
 configureChannel(data,'server','a','B');assert.equal(a.group,'B');assert.equal(c.group,'C');assert.equal(c.receipts.sent.status,'sent');
 const restored=JSON.parse(JSON.stringify(data));assert.equal(channelEntry(restored,'server','a')[1].group,'B');assert.equal(channelEntry(restored,'other','a'),undefined);
});
test('channel contexts isolate scheduler receipts in the same server',async()=>{
 const s=guildState({version:2,guilds:{}},'server');configureChannel(s.data,'server','one','A');configureChannel(s.data,'server','two','D');
 await Promise.all(Object.entries(s.data.guilds).map(([id,g])=>s.context.run({id,g},async()=>{await Promise.resolve();s.state.receipts[s.state.group]={status:'sent'};})));
 assert.deepEqual(Object.keys(channelEntry(s.data,'server','one')[1].receipts),['A']);assert.deepEqual(Object.keys(channelEntry(s.data,'server','two')[1].receipts),['D']);
});
