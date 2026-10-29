import { findPolicyInForce } from '../../retrieval/policy-in-force.ts';
import { hybridSearch, type SearchHit } from '../../retrieval/search.ts';
import type { GraphState, GraphUpdate } from '../state.ts';
import { heading } from './log.ts';

// Chunks kept per query: 3, the K of the recall check.
const HITS_PER_QUERY = 3;

// A real node, not a fake: it needs no LLM, only step 2's search. It finds the ONE policy
// in force for the member's plan and country on the treatment date, then runs the hybrid
// search once per query. It returns every hit, repeats included: the evidence reducer
// drops them. (Step 5 replaces the loop with one parallel retrieve per query.)
export async function retrieve(state: GraphState): Promise<GraphUpdate> {
  const { planCode, jurisdiction, treatmentDate } = state;
  const policy = await findPolicyInForce(planCode, jurisdiction, treatmentDate);
  if (!policy) {
    console.log(`→ retrieve  no ${planCode} ${jurisdiction} policy in force on ${treatmentDate}`);
    return { evidence: [] };
  }

  console.log(`→ retrieve  searches ${policy.title} ${policy.version}`);
  const evidence: SearchHit[] = [];
  for (const query of state.queries) {
    const hits = await hybridSearch(policy.id, query, HITS_PER_QUERY);
    console.log(`    ${`"${query}"`.padEnd(36)} ${hits.map(heading).join(' | ')}`);
    evidence.push(...hits);
  }
  console.log(`            returns ${evidence.length} chunks`);
  return { evidence };
}
