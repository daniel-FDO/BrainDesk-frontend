export type FormatKind =
  | 'bold'
  | 'italic'
  | 'math'
  | 'link'
  | 'image'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'quote'

export interface FormatResult {
  value: string
  /** Selection to restore in the textarea after the edit. */
  start: number
  end: number
}

const WRAPS: Partial<Record<FormatKind, [string, string]>> = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  math: ['$', '$'],
}

const LINE_PREFIXES: Partial<Record<FormatKind, string>> = {
  h1: '# ',
  h2: '## ',
  h3: '### ',
  bullet: '- ',
  quote: '> ',
}

function replaceRange(value: string, start: number, end: number, text: string) {
  return value.slice(0, start) + text + value.slice(end)
}

/** Applies a Markdown format to the selected range of `value`. Pure, so the textarea stays controlled. */
export function applyFormat(value: string, start: number, end: number, kind: FormatKind): FormatResult {
  const selected = value.slice(start, end)

  const wrap = WRAPS[kind]
  if (wrap) {
    const text = selected || 'text'
    const innerStart = start + wrap[0].length
    return {
      value: replaceRange(value, start, end, wrap[0] + text + wrap[1]),
      start: innerStart,
      end: innerStart + text.length,
    }
  }

  if (kind === 'link' || kind === 'image') {
    const opener = kind === 'image' ? '![' : '['
    const text = selected || (kind === 'image' ? 'alt text' : 'link text')
    const url = 'https://'
    const urlStart = start + opener.length + text.length + 2
    return {
      value: replaceRange(value, start, end, `${opener}${text}](${url})`),
      start: urlStart,
      end: urlStart + url.length,
    }
  }

  // Line formats apply to every line the selection touches.
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', end)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const prefixed = value
    .slice(lineStart, lineEnd)
    .split('\n')
    .map((line, i) => (kind === 'numbered' ? `${i + 1}. ` : LINE_PREFIXES[kind]) + line)
    .join('\n')
  const caret = lineStart + prefixed.length
  return { value: replaceRange(value, lineStart, lineEnd, prefixed), start: caret, end: caret }
}
