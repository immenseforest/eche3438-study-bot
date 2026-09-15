import {AsyncLocalStorage} from 'node:async_hooks';
export function guildState(raw,defaultGuild,defaultChannel){
 const primary=()=>typeof defaultGuild==='function'?defaultGuild():defaultGuild;
 const data=raw.version===2?raw:{version:2,guilds:primary()?{[primary()]:{...raw,channelId:defaultChannel}}:{}};
 const context=new AsyncLocalStorage();
 const local=()=>context.getStore()||{id:primary(),g:data.guilds[primary()]||{receipts:{},overrides:{},paused:false}};
 const state=new Proxy({},{get:(_,k)=>local().g[k],set:(_,k,v)=>{local().g[k]=v;return true;}});
 return {data,context,local,state};
}
