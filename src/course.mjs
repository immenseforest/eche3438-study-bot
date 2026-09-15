import fs from 'node:fs';
const privateFile=new URL('../private/course.mjs',import.meta.url);
const pack=await import(fs.existsSync(privateFile)?privateFile.href:'./example-course.mjs');
export const {sources,topics,caveats,events,deadlines,prep,plan,disclosure,ethicsQuestions}=pack;

export const supportedGroups=pack.supportedGroups||['C'];
export const groupCaveats=pack.groupCaveats||(()=>pack.caveats);
