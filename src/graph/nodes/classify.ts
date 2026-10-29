import type { GraphState, GraphUpdate } from '../state.ts';
import { log } from './log.ts';

// FAKE: a stand-in for the LLM classifier, with the same input and output shape but a fixed
// rule instead of a Gemini call. Free, instant, same result every run. Step 4 makes it real.
export function classify(state: GraphState): GraphUpdate {
  const medicalAdvice = /should I (take|stop)|diagnos/i.test(state.question);
  return log('classify', {
    intent: { topic: medicalAdvice ? 'medical advice' : 'coverage', outOfScope: medicalAdvice },
    treatmentDate: '2026-10-27', // the real classifier reads it from the question, or uses today
  });
}
