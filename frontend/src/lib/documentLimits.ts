export const MAX_DOCUMENT_CHARACTERS = 1_000_000;
export const MAX_DOCUMENT_PAGES = 300;
export interface ExtractionCoverage {
  method: "pdf_text" | "pdf_scan" | "docx" | "doc" | "text";
  characters: number;
  pagesRead?: number;
  totalPages?: number;
  unreadablePages?: number[];
  truncated: boolean;
}
