/**
 * Normalize AI-generated research content that may contain markdown
 * (## headers, **bold**, *italic*) so it displays as plain prose without
 * literal hashtags and stars.
 */
export function formatResearchContent(raw: string): string {
  if (!raw?.trim()) return raw ?? ''
  let out = raw
    // Headers: ## Header or ### Header -> just the text on its own line
    .replace(/#{1,6}\s+/g, '')
    // Bold: **text** or __text__ -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Italic: *text* -> text (after bold so ** is already gone)
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Trim excess blank lines (more than 2 newlines -> 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return out
}
