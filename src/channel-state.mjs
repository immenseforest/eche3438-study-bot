// Keep legacy server keys so existing receipt history survives the upgrade.
export const channelEntry=(data,guildId,channelId)=>Object.entries(data.guilds).find(([key,g])=>key.split(':')[0]===guildId&&g.channelId===channelId);
export function configureChannel(data,guildId,channelId,group){
 const old=channelEntry(data,guildId,channelId);
 const key=old?.[0]||(!data.guilds[guildId]?guildId:`${guildId}:${channelId}`);
 const g=old?.[1]||{channelId,receipts:{},overrides:{},paused:false};
 g.group=group||g.group||'C';data.guilds[key]=g;return [key,g];
}
