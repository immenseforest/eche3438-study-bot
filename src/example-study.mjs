export const studies={DEMO:{title:'Explore an experiment'}};
const stages=['Imagine a question you could test.','Identify an input you can vary and an output you can measure.','Explain why the output might change.','Make a prediction before running the experiment.','Compare your prediction with real observations; keep uncertainty visible.','Read the authorized course notes and write one question for the instructor.'];
export function studyStep(code,index=0){if(!studies[code])throw new Error('Unknown topic');return `**${studies[code].title} · ${index+1}/6**\n\n${stages[index]}`;}
export const studyGuide=()=>stages.join('\n\n');
