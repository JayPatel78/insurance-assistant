import type { Claim, GraphState, GraphUpdate } from '../state.ts';
import { firstParagraph, firstSentence } from './chunk-text.ts';
import { heading, log } from './log.ts';

// FAKE: a stand-in for the fast-model researcher (step 4), which reads the evidence and writes
// claims in its own words, each with the exact sentence that proves it. This one makes one
// claim per chunk and uses the quote as the claim's text. A first draft quotes only the
// first sentence; a revision quotes the whole paragraph for each claim the auditor flagged.
export function research(state: GraphState): GraphUpdate {
  const flagged = new Set(state.audit?.issues.map((issue) => issue.claimIndex));
  const claims: Claim[] = state.evidence.map((chunk, index) => {
    const quote = flagged.has(index) ? firstParagraph(chunk.content) : firstSentence(chunk.content);
    return { text: quote, chunkIds: [chunk.id], quote };
  });
  const draft = { claims, unanswered: claims.length === 0 ? [state.question] : [] };

  // Running after an audit means this is a revision: return 1 and the revisions reducer adds
  // it to the count. audit: null clears the old verdict, which was about the previous draft.
  const revisions = state.audit ? 1 : 0;
  const sections = claims.length > 0 ? ` (${state.evidence.map(heading).join(', ')})` : '';
  const what = claims.length === 0 ? 'no evidence to quote'
    : flagged.size > 0 ? `quoting whole paragraphs for claims ${[...flagged].join(', ')}` : 'first sentences only';
  return log('research', { draft, audit: null, revisions },
    `a draft of ${claims.length} claims${sections}, ${what}; revisions +${revisions}`);
}
