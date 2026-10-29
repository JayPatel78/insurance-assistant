import type { GraphState, GraphUpdate } from '../state.ts';
import { log } from './log.ts';

// FAKE: a stand-in for the synthesizer (step 4), which writes a plain-language answer from
// the claims that passed the audit. This one lists the claims with numbered citations, or,
// when the audit didn't pass, says the policy couldn't confirm it.
export function synthesize(state: GraphState): GraphUpdate {
  if (state.audit?.verdict !== 'pass') {
    const final = {
      answer: "I couldn't confirm this from your policy. A member of our team will look at your question.",
      citations: [],
      confidence: 0,
    };
    return log('synthesize', { final }, 'an answer saying the policy couldn\'t confirm it');
  }

  const { claims } = state.draft;
  const final = {
    answer: claims.map((claim, index) => `[${index + 1}] ${claim.text}`).join('\n'),
    citations: claims.map((claim) => state.evidence.find((hit) => hit.id === claim.chunkIds[0])!.section),
    confidence: state.audit.confidence,
  };
  return log('synthesize', { final }, `an answer with ${final.citations.length} citations`);
}
