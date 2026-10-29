import { Annotation } from '@langchain/langgraph';
import type { SearchHit } from '../retrieval/search.ts';

// What each agent hands to the next. Plain types for now; in step 4 they become Zod schemas
// that Gemini's answers are checked against (guide B.4).

// What the classifier works out from the question.
export interface Intent {
  topic: string;       // "coverage", "medical advice"…
  outOfScope: boolean; // true = politely refuse (medical or legal advice, someone else's policy)
}

// One statement of the researcher's draft, with its proof.
export interface Claim {
  text: string;       // "Emergency surgery abroad is covered up to €150,000 per policy year."
  chunkIds: string[]; // the chunk(s) it comes from
  quote: string;      // the exact supporting sentence, copied from that chunk
}

export interface Draft {
  claims: Claim[];
  unanswered: string[]; // parts of the question the evidence doesn't cover
}

export interface Audit {
  verdict: 'pass' | 'revise' | 'reject';
  issues: { claimIndex: number; problem: string; severity: 'low' | 'high' }[];
  confidence: number; // 0 to 1
}

export interface Final {
  answer: string;
  citations: string[]; // the sections the answer cites, in the order of its [1], [2]…
  confidence: number;
}

// The state every node reads and updates. Each field is a "channel".
// A field with no reducer keeps the LAST value a node wrote to it.
export const State = Annotation.Root({
  // Input: set by the app when the graph starts
  question: Annotation<string>,
  planCode: Annotation<string>,      // from the member's account, not from the question
  jurisdiction: Annotation<string>,

  // Written by the nodes
  intent: Annotation<Intent>,
  treatmentDate: Annotation<string>, // "2026-10-27": picks the policy version in force
  queries: Annotation<string[]>,

  // A field WITH a reducer: LangGraph calls reducer(current value, update) and stores the
  // result, so new chunks are added to the ones already there instead of replacing them.
  // default() is the value before any node has written to it.
  evidence: Annotation<SearchHit[]>({
    reducer: (current, update) => dedupeById([...current, ...update]),
    default: () => [],
  }),

  draft: Annotation<Draft>,
  audit: Annotation<Audit | null>, // null while a new draft waits for its audit
  // How many times the auditor has sent a draft back. Nodes return 1 to count one more.
  revisions: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
  final: Annotation<Final>,
});

export type GraphState = typeof State.State;   // the full state a node receives
export type GraphUpdate = typeof State.Update; // the part of it a node returns

// Keeps the first copy of each chunk. Different queries often find the same chunk.
function dedupeById(chunks: SearchHit[]): SearchHit[] {
  return chunks.filter((chunk, index) => chunks.findIndex((other) => other.id === chunk.id) === index);
}
