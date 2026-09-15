export function dueReminders(events,receipts,now=Date.now()){
 const due=[];
 for(const e of events){const start=Date.parse(e.start);if(start<=now)continue;
  // After downtime deliver only the most recent applicable reminder, never a burst.
  const hours=[12,24].find(h=>start-h*3600000<=now);
  if(!hours)continue;
  const key=`${e.id}:${hours}`;
  if(!receipts[key])due.push({event:e,hours,key});
 }
 return due;
}
