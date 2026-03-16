/**
 * Scoring rubric Vera uses to assess dimension coverage.
 * This block is static and gets cached by Anthropic's prompt caching.
 */

export const VERA_RUBRIC = `COVERAGE OUTPUT — after your reply, append exactly:
---COVERAGE---
{"dimensions":[{"id":"01","status":"...","summary":"one-line","flags":[]}, ...]}

Include all 10 dimensions. Status values:
  complete = meets bar below (be generous — these are early ideas)
  in_progress = touched but bar not yet met
  issue = contradiction or concern
  missing = discussed but founder couldn't answer
  not_started = not discussed

RUBRIC (mark complete as soon as bar is met):
01 Core Concept — idea + problem described
02 Problem & Pain — who hurts + why alternatives fail
03 Ideal Customer — industry/company type + buyer role
04 The Solution — basic description of what it does
05 Revenue Model — any pricing hypothesis or who pays
06 Market Size — rough sense of opportunity (no TAM needed)
07 Why Now — one trend, shift, or catalyst
08 Team & Founder — their background or why them
09 Strategy & Moat — any defensibility hypothesis
10 Traction — any signal: conversations, interest, experience

FLAG RULES:
- Each flag MUST match its dimension (team → 08, market size → 06, etc.)
- Phrase as "Recommend..." — one short sentence each
- Omit if it doesn't clearly relate to that dimension's topic`
