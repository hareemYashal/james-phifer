import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function isCommonWord(text: string): boolean {
  const commonWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "this",
    "that",
    "these",
    "those",
    "here",
    "there",
    "where",
    "when",
    "why",
    "how",
    "page",
    "total",
    "amount",
    "description",
    "qty",
    "quantity",
    "price",
    "unit",
  ];
  return commonWords.includes(text.toLowerCase()) || text.length < 2;
}

// Helper function to categorize text based on content
export function categorizeText(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("invoice") || lowerText.includes("number")) {
    return "invoice";
  }
  if (
    lowerText.includes("phone") ||
    lowerText.includes("tel") ||
    /\d{3}-\d{3}-\d{4}/.test(text)
  ) {
    return "contact";
  }
  if (lowerText.includes("email") || lowerText.includes("@")) {
    return "contact";
  }
  if (
    lowerText.includes("address") ||
    lowerText.includes("street") ||
    lowerText.includes("city")
  ) {
    return "address";
  }
  if (
    lowerText.includes("date") ||
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text)
  ) {
    return "dates";
  }
  if (
    lowerText.includes("amount") ||
    lowerText.includes("total") ||
    lowerText.includes("$") ||
    lowerText.includes("c$")
  ) {
    return "financial";
  }
  if (
    lowerText.includes("company") ||
    lowerText.includes("corp") ||
    lowerText.includes("inc")
  ) {
    return "company";
  }

  return "other";
}
