import React from "react";

export default function ChatText({ text }: { text: string }) {
  return <div className="whitespace-pre-line break-words">{text.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>
  )}</div>;
}
