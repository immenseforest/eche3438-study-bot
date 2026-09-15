import {plan,disclosure} from './course.mjs';
export const prompt=(overrides={},group='C')=>`Help me understand my course through small preparation steps, predictions and source-linked explanations. Distinguish confirmed facts from assumptions. Do not invent measurements or deadlines.\n\n${disclosure}\n\n${plan(overrides,group)}`;
