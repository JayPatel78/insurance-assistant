// Helpers for the fake researcher and auditor: they pick quotes out of a chunk by position,
// where the real agents read the text.

// The first paragraph under the chunk's heading line:
// "All planned in-patient admissions and all planned surgery need pre-authorisation. Ask for it…"
export function firstParagraph(content: string): string {
  const start = content.indexOf('\n\n');
  const body = start === -1 ? content : content.slice(start + 2);
  return body.split('\n')[0];
}

// Only that paragraph's first sentence:
// "All planned in-patient admissions and all planned surgery need pre-authorisation."
export function firstSentence(content: string): string {
  const paragraph = firstParagraph(content);
  return paragraph.match(/^.*?[.:](?=\s|$)/)?.[0] ?? paragraph;
}
