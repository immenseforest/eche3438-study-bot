export const sources={manual:'Your authorized local course materials'};
export const topics={DEMO:{name:'Explore an experiment',room:'Confirm locally',concept:'Start with a testable question.',steps:['Name the variable you change.','Name the response you measure.','List what should stay comparable.'],questions:['Which observation would challenge my prediction?'],pages:'Add verified source references',query:'experimental design measurement uncertainty',links:[]}};
export const caveats=['Demo content only: no instructor documents, student records or real course dates are bundled. Add a private course pack before using scheduled reminders.'];
export const events=()=>[];
export const deadlines=()=>[];
export const prep=(e,hours)=>`${hours||'Next'} preparation: ${e.topic} — ${e.date}. Verify the current course announcement.`;
export const disclosure='This tool supports planning and learning. Verify its content and follow the course policy on assessed work.';
export const ethicsQuestions=['What help is permitted for preparation and assessed work?'];
export const plan=()=>caveats.join('\n');

export const supportedGroups=['A','B','C','D'];
