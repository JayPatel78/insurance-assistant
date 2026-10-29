import type { GraphState, GraphUpdate } from '../state.ts';
import { log } from './log.ts';

// FAKE: a stand-in for the LLM query expander. The real one (step 4) rewrites the question
// in the policy's words; this one always returns the same three queries.
export function expand(state: GraphState): GraphUpdate {
  return log('expand', {
    queries: ['emergency surgery abroad', 'emergency admission notification', 'waiting period for an emergency'],
  });
}
