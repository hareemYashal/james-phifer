import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export async function processDocumentAPI(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("extractCoordinates", "true");
    formData.append("extractKeyValue", "true");
    formData.append("includeRegions", "true");

    const response = await fetch(
      `https://883c-182-180-99-121.ngrok-free.app/process-document`,
      {
        method: "POST",
        body: formData,
        // Add any headers your API requires
        headers: {
          // 'Authorization': 'Bearer your-token',
          // 'X-API-Key': 'your-api-key',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Document processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Utility function to convert display names to database-friendly keys
export function toDatabaseKey(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

// Enhanced function to extract key-value pairs from full text
export function extractKeyValuePairsFromText(
  text: string
): Array<{key: string; value: string}> {
  const pairs: Array<{key: string; value: string}> = [];

  // Split text into lines and look for patterns
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip very short lines
    if (line.length < 3) continue;

    // Look for "Label:" or "Label :" patterns
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      const key = colonMatch[1].trim();
      const value = colonMatch[2].trim();
      if (key.length > 1 && value.length > 0 && !isCommonWord(key)) {
        pairs.push({key, value});
      }
    }

    // Look for invoice-specific patterns
    const invoiceNumberMatch = line.match(/Invoice\s+number\s+([A-Z0-9-]+)/i);
    if (invoiceNumberMatch) {
      pairs.push({key: "Invoice Number", value: invoiceNumberMatch[1]});
    }

    const dateMatch = line.match(/Date\s+of\s+issue\s+(.+)/i);
    if (dateMatch) {
      pairs.push({key: "Date of Issue", value: dateMatch[1].trim()});
    }

    const dueDateMatch = line.match(/Date\s+due\s+(.+)/i);
    if (dueDateMatch) {
      pairs.push({key: "Date Due", value: dueDateMatch[1].trim()});
    }

    // Look for amounts
    const amountMatch = line.match(/([C$]+[\d,]+\.[\d]{2})/g);
    if (amountMatch) {
      amountMatch.forEach((amount, index) => {
        if (line.toLowerCase().includes("total")) {
          pairs.push({key: "Total Amount", value: amount});
        } else if (line.toLowerCase().includes("subtotal")) {
          pairs.push({key: "Subtotal", value: amount});
        } else if (line.toLowerCase().includes("due")) {
          pairs.push({key: "Amount Due", value: amount});
        } else {
          pairs.push({key: `Amount ${index + 1}`, value: amount});
        }
      });
    }

    // Look for addresses (lines with postal codes or common address patterns)
    if (
      line.match(/\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/) ||
      line.match(
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i
      )
    ) {
      pairs.push({key: "Address", value: line});
    }

    // Look for phone numbers
    const phoneMatch = line.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      pairs.push({key: "Phone Number", value: phoneMatch[1]});
    }

    // Look for email addresses
    const emailMatch = line.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (emailMatch) {
      pairs.push({key: "Email Address", value: emailMatch[1]});
    }

    // Look for dates in various formats
    const generalDateMatch = line.match(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/i
    );
    if (
      generalDateMatch &&
      !pairs.some((p) => p.value === generalDateMatch[1])
    ) {
      pairs.push({key: "Date", value: generalDateMatch[1]});
    }
  }

  // Look for multi-line patterns
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    // Check if current line is a label and next line is the value
    if (
      currentLine.length > 0 &&
      currentLine.length < 50 &&
      !currentLine.includes(":") &&
      nextLine.length > 0 &&
      nextLine.length < 100 &&
      !isCommonWord(currentLine)
    ) {
      // Skip if it looks like a continuation of previous content
      if (
        !currentLine.match(/^\d/) &&
        !nextLine.match(/^\d/) &&
        !pairs.some((p) => p.key === currentLine || p.value === nextLine)
      ) {
        pairs.push({key: currentLine, value: nextLine});
      }
    }
  }

  return pairs;
}

// Helper function to check if a word is too common to be useful
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
