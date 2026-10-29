import type { Audit, GraphState, GraphUpdate } from '../state.ts';
import { firstParagraph } from './chunk-text.ts';
import { log } from './log.ts';

// FAKE: a stand-in for the strong-model auditor (step 4), which checks every claim against its
// quote and looks for limits, excesses and exclusions the claim leaves out. This one has
// two fixed rules:
//   no claims at all                         → reject: the evidence doesn't answer the question
//   a quote stops before its paragraph ends  → revise: the rest may hold a condition
//                                              ("An excess of €150 applies to each claim…")
//   otherwise                                → pass
export function auditDraft(state: GraphState): GraphUpdate {
  const { claims } = state.draft;
  if (claims.length === 0) {
    return report({ verdict: 'reject', issues: [], confidence: 0 });
  }

  const issues: Audit['issues'] = [];
  claims.forEach((claim, index) => {
    const chunk = state.evidence.find((hit) => hit.id === claim.chunkIds[0])!;
    if (claim.quote !== firstParagraph(chunk.content)) {
      issues.push({ claimIndex: index, problem: 'the quote stops mid-paragraph', severity: 'high' });
    }
  });

  return report(issues.length > 0
    ? { verdict: 'revise', issues, confidence: 0.5 }
    : { verdict: 'pass', issues: [], confidence: 0.9 });
}

function report(audit: Audit): GraphUpdate {
  const flagged = audit.issues.map((issue) => issue.claimIndex);
  const detail = flagged.length > 0 ? `, claims ${flagged.join(', ')}: ${audit.issues[0].problem}` : '';
  return log('auditDraft', { audit }, `${audit.verdict} (confidence ${audit.confidence})${detail}`);
}
