import Link from "next/link";

// Renders text with #hashtags and @mentions turned into links.
// Plain (no hooks) so it works in both server and client components.
const TOKEN = /([#@][a-zA-Z0-9_]+)/g;

export default function RichText({ text, className }) {
  if (!text) return null;
  const parts = String(text).split(TOKEN);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part[0] === "#" && part.length > 1) {
          return <Link key={i} href={`/tag/${part.slice(1).toLowerCase()}`} className="font-medium text-brand hover:underline">{part}</Link>;
        }
        if (part[0] === "@" && part.length > 1) {
          return <Link key={i} href={`/u/${part.slice(1).toLowerCase()}`} className="font-medium text-brand hover:underline">{part}</Link>;
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
}
