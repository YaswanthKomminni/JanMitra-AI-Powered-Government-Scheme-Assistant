/** Text is evidence; filenames, skin tones and paper colors are not domain decisions. */
export function assessUploadText(text: string): "in_scope" | "out_of_scope" | "uncertain" {
  if (text.trim().length < 25) return "uncertain";
  const relevant = /\b(agricultur\w*|farmer\w*|kisan|krishi|crop\w*|soil|patta|pahani|khasra|pattadar|sale deed|land record|icar|dare|welfare|yojana|scheme\w*|beneficiar\w*|aadhaar|ration|pension|scholarship|subsid\w*|government|govt|directorate|counselling|counseling)\b|ప్రభుత్వ|పథక|వ్యవసాయ|రైతు|सरकार|योजना|कृषि|किसान|அரசு|விவசாய|திட்ட|ಸರ್ಕಾರ|ಯೋಜನೆ|ಕೃಷಿ|সরকার|প্রকল্প|কৃষি/i.test(text);
  if (relevant) return "in_scope";
  const tech = text.match(/environment variables|render\.com|localhost|npm (?:run|install|start)|git commit|powershell|syntaxerror|database_url|postgresql:\/\//gi) || [];
  return new Set(tech.map((word) => word.toLowerCase())).size >= 2 ? "out_of_scope" : "uncertain";
}
