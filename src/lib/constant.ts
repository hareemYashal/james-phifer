export const dateRegex =
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
export const qtyMatchRegex = /\b(\d+)\s*(?:x\s*)?([A-Za-z\s]+)/i;
export const frontend_url = `${process.env.NEXT_PUBLIC_SITE_URL}`;
export const APIURL = `https://phifer.reachmoiz.com`;
