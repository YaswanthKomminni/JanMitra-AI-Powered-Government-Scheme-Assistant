export function cleanSpokenText(text: string): string {
  return text.split(/\n\n---\n/)[0].replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "").replace(/\[(?:[DCOR]\d+(?:,\s*[DCOR]\d+)*|D-outline)\]/g, "")
    .replace(/[*#`_]/g, "").replace(/^\s*(?:[-•]|\d+[.)])\s+/gm, "").replace(/\s+/g, " ").trim();
}

export function localVoiceBriefing(text: string): string {
  const body = text.split(/\n\n---\n/)[0];
  const lines = body.split(/\n+/).map(s => s.trim()).filter(s => s && !/^\*\*[^*]+\*\*$/.test(s));
  const important = lines.filter(s => /not eligible|exclud|not required|not verified|unverified|cannot confirm|deadline|గడువు|अंतिम|అర్హ|पात्र/i.test(s));
  return cleanSpokenText(Array.from(new Set([...lines.slice(0, 3), ...important.slice(0, 2)])).join("\n")).slice(0, 2400);
}
