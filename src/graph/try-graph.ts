import { pool } from '../db/pool.ts';
import { app } from './graph.ts';

// Three runs, one for each way through the graph. Only the first makes Gemini calls (three
// small ones: retrieve embeds each query). planCode and jurisdiction come from the member's
// account; the question is what they typed.
const MAIN_QUESTION = 'Am I covered for an emergency appendectomy in Spain, and do I need pre-authorisation?';
const runs = [
  { title: 'Gold FR member, the main question: the revise loop runs once',
    input: { question: MAIN_QUESTION, planCode: 'GOLD', jurisdiction: 'FR' } },
  { title: 'Medical advice: out of scope, stops after classify',
    input: { question: 'Should I stop taking my blood pressure tablets before surgery?', planCode: 'GOLD', jurisdiction: 'FR' } },
  { title: 'A plan we hold no policy for: audit rejects, a person reviews',
    input: { question: MAIN_QUESTION, planCode: 'BRONZE', jurisdiction: 'FR' } },
];

for (const { title, input } of runs) {
  console.log(`\n=== ${title} ===`);
  const state = await app.invoke(input);

  if (!state.final) {
    console.log('No answer: the app shows a polite refusal.');
    continue;
  }
  console.log(`\nrevisions: ${state.revisions}, confidence: ${state.final.confidence}`);
  for (const line of state.final.answer.split('\n')) console.log(`  ${clip(line, 96)}`);
}

await pool.end();

function clip(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
