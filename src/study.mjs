import fs from 'node:fs';
const privateFile=new URL('../private/study.mjs',import.meta.url);
const pack=await import(fs.existsSync(privateFile)?privateFile.href:'./example-study.mjs');
export const {studies,studyStep,studyGuide}=pack;
