import { toNeedle } from '../../lib/textSearch'

/** `text` with every case-insensitive occurrence of `query` marked. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const needle = toNeedle(query)
  if (!needle) return <>{text}</>

  const parts: { text: string; match: boolean }[] = []
  const haystack = text.toLocaleLowerCase()
  let from = 0
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false })
    parts.push({ text: text.slice(at, at + needle.length), match: true })
    from = at + needle.length
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false })

  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark className="rounded-[2px] bg-[#fff1a8] text-inherit" key={index}>
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  )
}
