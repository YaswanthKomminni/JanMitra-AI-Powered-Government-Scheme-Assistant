import React from "react";

function fragments(text: string) {
  return text.split(/(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>]+|\*\*[^*\n]+\*\*)/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    const url = link?.[2] || (/^https?:\/\//.test(part) ? part.replace(/[.,;]+$/, "") : undefined);
    if (url) return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="underline">{link?.[1] || part}</a>;
    return part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
export default function ChatText({ text }: { text: string }) {
  const divider = text.indexOf("\n\n---\n");
  return <div className="whitespace-pre-line break-words">
    {fragments(divider < 0 ? text : text.slice(0, divider))}
    {divider >= 0 && <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Sources / ఆధారాలు</summary>{fragments(text.slice(divider + 6))}</details>}
  </div>;
}
