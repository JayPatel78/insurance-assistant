import { END, START, StateGraph } from '@langchain/langgraph';
import { afterAudit } from './edges/after-audit.ts';
import { afterClassify } from './edges/after-classify.ts';
import { auditDraft } from './nodes/audit-draft.ts';
import { classify } from './nodes/classify.ts';
import { expand } from './nodes/expand.ts';
import { humanReview } from './nodes/human-review.ts';
import { research } from './nodes/research.ts';
import { retrieve } from './nodes/retrieve.ts';
import { synthesize } from './nodes/synthesize.ts';
import { State } from './state.ts';

// The assistant as a graph: every node and edge in one place, so the whole shape reads top
// to bottom (compare guide B.2). Each node lives in nodes/; the functions that choose the
// next node for a conditional edge live in edges/.
export const app = new StateGraph(State)
  .addNode('classify', classify)
  .addNode('expand', expand)
  .addNode('retrieve', retrieve)
  .addNode('research', research)
  .addNode('auditDraft', auditDraft) // not 'audit': a node can't have the name of a state field
  .addNode('humanReview', humanReview)
  .addNode('synthesize', synthesize)

  .addEdge(START, 'classify')
  .addConditionalEdges('classify', afterClassify, ['expand', END])
  .addEdge('expand', 'retrieve')
  .addEdge('retrieve', 'research')
  .addEdge('research', 'auditDraft')
  .addConditionalEdges('auditDraft', afterAudit, ['synthesize', 'research', 'humanReview'])
  .addEdge('humanReview', 'synthesize')
  .addEdge('synthesize', END)
  .compile();
