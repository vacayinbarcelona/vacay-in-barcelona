// Renders a <script type="application/ld+json"> block. `<` is escaped so a
// stray value (e.g. a review comment containing "</script>") can't break out
// of the script tag — standard practice for JSON-LD built from user/CMS data.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  // eslint-disable-next-line react/no-danger
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
