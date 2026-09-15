import fs from 'node:fs';
import {topics} from './course.mjs';
const cacheFile=new URL('../data/research.json',import.meta.url);
export async function research(topic){
 const t=topics[topic];if(!t?.query)return 'Class topic is unconfirmed. Set it with /eche topic before searching for related articles.';
 let cache={};try{cache=JSON.parse(fs.readFileSync(cacheFile));}catch{}
 if(cache[topic]&&Date.now()-cache[topic].at<7*86400000)return cache[topic].text;
 const u=new URL('https://api.crossref.org/works');u.search=new URLSearchParams({'query.bibliographic':t.query,rows:'3',filter:'type:journal-article',select:'title,DOI,published,container-title'});
 try{
  const r=await fetch(u,{headers:{'User-Agent':'ECHE3438StudyPlanner/1.0 (personal educational reading)'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Research service unavailable');
  const items=(await r.json()).message.items;
  const lines=items.filter(x=>/^10\.\d{4,9}\//.test(x.DOI)).map(x=>`${String(x.title?.[0]||'Untitled').replace(/<[^>]*>/g,'').slice(0,200)} (${x.published?.['date-parts']?.[0]?.[0]||'date unknown'})\nhttps://doi.org/${encodeURI(x.DOI)}`);
  const text=`Optional article discovery: ${t.name}\nSearched ${new Date().toISOString().slice(0,10)}. Crossref metadata only; full texts and findings have not been reviewed. Relevance varies and some articles require access.\n\n${lines.join('\n\n')}\n\nReading question: how does the real system differ from our lab apparatus?`;
  cache[topic]={at:Date.now(),text};fs.writeFileSync(cacheFile,JSON.stringify(cache,null,2));return text;
 }catch{return `Live article search unavailable. Try again later.\nReviewed background links:\n${t.links.map(x=>x.join(': ')).join('\n')}`;}
}
