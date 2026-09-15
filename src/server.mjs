import {guildState} from './guild-state.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {events,topics,prep,plan,ethicsQuestions,disclosure,caveats,deadlines} from './course.mjs';
import {dueReminders} from './reminders.mjs';
import {research} from './research.mjs';
import {prompt} from './prompt.mjs';
import {studies,studyStep,studyGuide} from './study.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const cfg=fs.existsSync('config.json')?JSON.parse(fs.readFileSync('config.json')):{port:3438};fs.mkdirSync('data',{recursive:true});
const req=createRequire(import.meta.url);let discord;
discord=req('discord.js');
const {Client,GatewayIntentBits,PermissionFlagsBits:P,ChannelType,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle}=discord;
function wizard(code,step=0){return {content:studyStep(code,step),components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`study:${code}:${step-1}`).setLabel("Back").setStyle(ButtonStyle.Secondary).setDisabled(step===0),new ButtonBuilder().setCustomId(`study:${code}:${step+1}`).setLabel(step===3?"Reveal explanation":"Next").setStyle(ButtonStyle.Primary).setDisabled(step===5))],allowedMentions:{parse:[]}};}
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const token=process.env.ECHE_DISCORD_BOT_TOKEN;
const stateFile='data/state.json';
let persisted=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile)):{receipts:{},overrides:{},paused:false};
const runtime=guildState(persisted,()=>cfg.guildId,cfg.channelId);persisted=runtime.data;
const {context,local,state}=runtime;
const save=()=>{fs.writeFileSync(stateFile+'.tmp',JSON.stringify(persisted,null,2));fs.renameSync(stateFile+'.tmp',stateFile);};
save();
let status='Starting',lastError=null,client;
const getChannel=()=>client.channels.fetch(local().g.channelId);
const safe=e=>String(e.message||e).split(token||'__NO_TOKEN__').join('[redacted]').slice(0,700);
const chunks=s=>{const a=[];let p='';for(const line of s.split('\n')){if((p+'\n'+line).length>1850){a.push(p);p='';}p+=(p?'\n':'')+line;}if(p)a.push(p);return a;};
const upcoming=()=>events(state.overrides).filter(e=>Date.parse(e.start)>Date.now());
const nextLab=()=>upcoming().find(e=>e.kind==='Lab');
let queue=Promise.resolve();const serial=fn=>{const result=queue.then(fn);queue=result.catch(e=>{lastError=safe(e);console.error(lastError);});return result;};
async function deliver(key,text){
 if(state.receipts[key])return;
 // Persist intent before network I/O. Uncertain delivery is held for manual reconciliation.
 state.receipts[key]={status:'pending',at:new Date().toISOString()};save();
 try{const nonce=BigInt('0x'+createHash('sha256').update(local().id+':'+key).digest('hex').slice(0,15)).toString();const channel=await getChannel();const m=await channel.send({content:text.slice(0,1950),nonce,enforceNonce:true,allowedMentions:{parse:[]}});state.receipts[key]={status:'sent',messageId:m.id,at:new Date().toISOString()};save();}
 catch(e){state.receipts[key].status='uncertain';save();throw e;}
}
async function tickOne(){
 if(!client?.isReady()||!state.channelId||state.paused)return;
 for(const item of dueReminders(events(state.overrides),state.receipts)){
  await deliver(item.key,prep(item.event,item.hours));
  const researchTopic=item.event.topic==='UNKNOWN'?nextLab()?.topic:item.event.topic;
  if(item.hours===24&&researchTopic){const key=`reading:${researchTopic}:${item.event.date}`;await deliver(key,(item.event.topic==='UNKNOWN'?'Class topic unconfirmed. Optional reading for your next Group C lab instead.\n':'')+await research(researchTopic));}
 }
 for(const item of dueReminders(deadlines(),state.receipts)){await deliver(item.key,`${item.hours}h reminder: ${item.event.topic} ${item.event.type} due ${item.event.date} at 16:00 America/Toronto. Derived from outline p. 3 and Group C lab dates; check D2L amendments. Submit your own work to D2L using the required filename. Questions should be raised earlier than the final 36 hours.`);}
}
async function tick(){for(const [id,g] of Object.entries(persisted.guilds)){try{await context.run({id,g},tickOne);}catch(e){g.lastError=safe(e);lastError=g.lastError;save();}}}
const sub=(name,description,options=[])=>({type:1,name,description,options});
const command={name:'eche',description:'ECHE 3438 Group C learning and reminders',options:[
 sub('setup','Choose this server’s course channel',[{type:7,name:'channel',description:'Study-group text channel',required:true,channel_types:[ChannelType.GuildText]}]),
 sub('learn','Explore a manual chapter one step at a time',[{type:3,name:'topic',description:'Choose your experiment',required:true,choices:Object.entries(studies).map(([value,t])=>({name:t.title,value}))}]),sub('guide','Download summaries and readings for all six manual chapters'),sub('help','Show commands and how this planner works'),sub('plan','Download the complete course preparation plan'),sub('next','See the next class and Group C lab'),sub('questions','Questions and honest AI-use disclosure'),sub('prompt','Download the reusable Astra planning prompt'),sub('read','Find optional real-world reading'),sub('status','Check reminders and delivery health'),sub('pause','Pause reminders'),sub('resume','Resume reminders'),
 sub('topic','Set a confirmed Fall class topic from D2L',[{type:3,name:'date',description:'YYYY-MM-DD',required:true},{type:3,name:'code',description:'Confirmed topic',required:true,choices:Object.entries(topics).map(([value,t])=>({name:t.name,value}))}]),
 sub('resolve','Resolve an uncertain delivery after checking channel history',[{type:3,name:'key',description:'Delivery key shown by status',required:true},{type:3,name:'action',description:'Mark delivered or retry',required:true,choices:[{name:'Already delivered',value:'sent'},{name:'Not delivered; retry',value:'retry'}]}])
]};
async function answer(i,text){const c=chunks(text);await i.editReply({content:c[0],allowedMentions:{parse:[]}});for(const s of c.slice(1))await i.followUp({content:s,flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});}
async function connect(){
 if(!token){status='Discord token missing';return;}
 client=new Client({intents:[GatewayIntentBits.Guilds],rest:{retries:0}});
 client.on('error',e=>{lastError=safe(e);});
 client.on('interactionCreate',async i=>{
  if(i.isButton()&&i.customId.startsWith('study:')&&i.guildId&&i.channelId===persisted.guilds[i.guildId]?.channelId){const [,code,n]=i.customId.split(':');const step=Number(n);if(studies[code]&&Number.isInteger(step)&&step>=0&&step<=5)await i.update(wizard(code,step)).catch(()=>{});return;}
  if(!i.isChatInputCommand()||i.commandName!=='eche'||!i.guildId)return;
  try{
   await i.deferReply({flags:MessageFlags.Ephemeral});
   const s=i.options.getSubcommand();
   if(['setup','pause','resume','topic','resolve'].includes(s)&&!i.memberPermissions?.has(P.ManageGuild)){await answer(i,'Manage Server permission is required to change reminders.');return;}
   if(s==='setup'){
    await serial(async()=>{
     const c=i.options.getChannel('channel',true);await i.guild.members.fetchMe();
     if(c.guildId!==i.guildId||c.type!==ChannelType.GuildText||![P.ViewChannel,P.SendMessages,P.ReadMessageHistory,P.AttachFiles,P.EmbedLinks].every(p=>c.permissionsFor(i.guild.members.me)?.has(p))){await answer(i,'Choose a text channel where the bot can view, send, read history, embed links and attach files.');return;}
     const old=persisted.guilds[i.guildId];
     persisted.guilds[i.guildId]={channelId:c.id,receipts:old?.channelId===c.id?old.receipts:{},overrides:old?.overrides||{},paused:false};save();
     if(!cfg.guildId){cfg.guildId=i.guildId;cfg.channelId=c.id;fs.writeFileSync('config.json',JSON.stringify(cfg,null,2));}
     await answer(i,`Course reminders enabled in <#${c.id}>. Use /eche learn, /eche plan or /eche next there. Members with access to that channel can read reminders.`);
    });return;
   }
   const g=persisted.guilds[i.guildId];
   if(!g){await answer(i,'A server manager must run /eche setup channel:#study-channel first.');return;}
   if(i.channelId!==g.channelId){await answer(i,`Use course commands in <#${g.channelId}>.`);return;}
   await serial(()=>context.run({id:i.guildId,g},async()=>{
    if(s==='learn')await i.editReply(wizard(i.options.getString('topic')));
    if(s==='guide')await i.editReply({content:'All six manual chapters, tutorial mappings and reading paths.',files:[{attachment:Buffer.from(studyGuide()),name:'ECHE3438-study-guide.md'}]});
    if(s==='help')await answer(i,'/eche setup — choose this server’s course channel (Manage Server)\n/eche learn — guided chapter exploration\n/eche guide — all six chapter summaries and readings\n/eche next — next class and lab\n/eche plan — complete plan\n/eche prompt — reusable Astra prompt\n/eche read — optional article search\n/eche questions — technician questions\n/eche topic date:YYYY-MM-DD code:MF|LL|HU|AE — confirm a class topic\n/eche status, pause, resume\n\n24h and 12h reminders use America/Toronto. This is a source-based planner, not a live AI chat service. No model API cost.');
    if(s==='plan'||s==='prompt')await i.editReply({content:s==='plan'?'Complete plan and source limitations.':'Copy this prompt into Astra with your course documents.',files:[{attachment:Buffer.from(s==='plan'?plan(state.overrides):prompt(state.overrides)),name:s==='plan'?'ECHE3438-plan.txt':'ASTRA-PROMPT.txt'}]});
    if(s==='next')await answer(i,[upcoming()[0],nextLab()].filter((x,i,a)=>x&&a.findIndex(e=>e?.id===x.id)===i).map(e=>prep(e)).join('\n\n')||'No remaining confirmed sessions.');
    if(s==='questions')await answer(i,disclosure+'\n\n'+[...ethicsQuestions,...(topics[nextLab()?.topic]?.questions||[])].map(x=>'- '+x).join('\n'));
    if(s==='read')await answer(i,await research((upcoming()[0]?.topic!=='UNKNOWN'&&upcoming()[0]?.topic)||nextLab()?.topic));
    if(s==='status')await answer(i,`Discord: ${status}\nReminders: ${state.paused?'paused':'active'}\nTiming: 24h / 12h before confirmed events. Computer must be awake and online.\nUncertain deliveries: ${Object.entries(state.receipts).filter(([,v])=>v.status!=='sent').map(([k])=>k).join(', ')||'none'}\nLast error: ${lastError||'none'}`);
    if(s==='pause'||s==='resume'){state.paused=s==='pause';save();await answer(i,`Reminders ${state.paused?'paused':'resumed'}.`);if(!state.paused)await tickOne();}
    if(s==='topic'){const date=i.options.getString('date'),code=i.options.getString('code');if(!events().some(e=>e.date===date&&e.kind!=='Lab')){await answer(i,'That is not a scheduled Fall class date. Use YYYY-MM-DD.');return;}state.overrides[date]=code;save();await answer(i,`${date}: ${topics[code].name}. Recorded as user-confirmed from D2L.`);}
    if(s==='resolve'){const key=i.options.getString('key'),action=i.options.getString('action');if(!state.receipts[key]||state.receipts[key].status==='sent'){await answer(i,'No uncertain delivery with that key.');return;}if(action==='retry')delete state.receipts[key];else state.receipts[key].status='sent';save();await answer(i,'Recorded. A retry is eligible only while its reminder is still applicable.');}
   }));
  }catch(e){lastError=safe(e);if(i.deferred)await i.editReply('Request failed; check /eche status or the local dashboard.').catch(()=>{});}
 });
 client.once('clientReady',()=>serial(async()=>{
  await client.application.commands.create(command);
  if(cfg.guildId&&client.guilds.cache.has(cfg.guildId)){const guild=await client.guilds.fetch(cfg.guildId);await guild.commands.create(command);}
  status='Connected';
  fs.writeFileSync('data/ready.json',JSON.stringify({pid:process.pid,applicationId:client.user.id,username:client.user.username,started:new Date().toISOString()}));
  console.log('Ready: '+client.user.username+'; /eche setup available in installed servers.');await tick();
 }).catch(()=>{}));
 await client.login(token);
}
function calendar(){const esc=s=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const dt=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ECHE3438//Group C//EN',...events(state.overrides).flatMap(e=>['BEGIN:VEVENT',`UID:${e.id}@eche3438.local`,`DTSTAMP:${dt(Date.now())}`,`DTSTART:${dt(e.start)}`,`DTEND:${dt(Date.parse(e.start)+e.minutes*60000)}`,`SUMMARY:${esc(e.kind+': '+topics[e.topic].name)}`,`LOCATION:${e.room||topics[e.topic].room}`,`DESCRIPTION:${esc(prep(e))}`,...[24,12].flatMap(h=>['BEGIN:VALARM',`TRIGGER:-PT${h}H`,'ACTION:DISPLAY','DESCRIPTION:ECHE 3438 preparation','END:VALARM']),'END:VEVENT']),'END:VCALENDAR',''].join('\r\n');}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 if(pathname==='/api/status'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status,lastError,paused:state.paused,channel:cfg.channelId?`https://discord.com/channels/${cfg.guildId}/${cfg.channelId}`:null,events:upcoming(),deadlines:deadlines(),topics,caveats,receipts:state.receipts,configuredServers:Object.keys(persisted.guilds).length}));return;}
 if(['/plan.txt','/prompt.txt','/calendar.ics'].includes(pathname)){res.setHeader('Content-Type',pathname.endsWith('.ics')?'text/calendar':'text/plain; charset=utf-8');res.end(pathname==='/plan.txt'?plan(state.overrides):pathname==='/prompt.txt'?prompt(state.overrides):calendar());return;}
 if(pathname==='/study-guide.txt'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(studyGuide());return;}
 if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('public/index.html'));return;}
 res.writeHead(404);res.end('Not found');
});
server.on('error',e=>{console.error(safe(e));process.exit(1);});
server.listen(cfg.port,'127.0.0.1',()=>{console.log(`Dashboard: http://127.0.0.1:${cfg.port}`);connect().catch(e=>{status='Discord connection failed';lastError=safe(e);console.error(lastError);});});
setInterval(()=>serial(tick).catch(()=>{}),30000);
process.on('SIGTERM',()=>{client?.destroy();server.close(()=>process.exit(0));});
