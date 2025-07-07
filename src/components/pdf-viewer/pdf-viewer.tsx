"use client";

import type React from "react";
import {useState, useRef} from "react";
import {Document, Page as PDFPage, pdfjs} from "react-pdf";
import {
  Upload,
  Download,
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  RefreshCw,
  FileText,
  AlertCircle,
  Zap,
  Settings,
} from "lucide-react";
import Header from "@/shared/header";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedRegion {
  id: string;
  coordinates: BoundingBox;
  pageNumber: number;
  fieldType?: string;
  confidence: number;
}

interface ExtractedField {
  id: string;
  key: string;
  displayName: string;
  value: string;
  confidence: number;
  coordinates: BoundingBox;
  category: string;
  pageNumber: number;
  regionId: string;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// API Configuration - Update these endpoints to match your backend
const API_CONFIG = {
  PROCESS_DOCUMENT: "/api/process-document",
  EXTRACT_FIELDS: "/api/extract-fields",
};

// Main API function to process document and extract coordinates + key-value pairs
async function processDocumentAPI(file: File): Promise<APIResponse> {
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
function toDatabaseKey(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

// Enhanced function to extract key-value pairs from full text
function extractKeyValuePairsFromText(
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
function isCommonWord(text: string): boolean {
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
function categorizeText(text: string): string {
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

// Function to parse API response and extract regions and fields from OCR data
function parseAPIResponse(apiData: any): {
  regions: DetectedRegion[];
  fields: ExtractedField[];
} {
  const regions: DetectedRegion[] = [];
  const fields: ExtractedField[] = [];

  try {
    // Handle OCR-style API response with pages and tokens
    if (apiData.pages && Array.isArray(apiData.pages)) {
      apiData.pages.forEach((page: any, pageIndex: number) => {
        const pageNumber = page.page_number || pageIndex + 1;
        const pageDimensions = page.dimensions || {width: 1, height: 1};

        if (page.tokens && Array.isArray(page.tokens)) {
          page.tokens.forEach((token: any, tokenIndex: number) => {
            // Process tokens with non-empty text
            if (token.text && token.text.trim() !== "") {
              // Convert bounding box format
              let coordinates: BoundingBox = {x: 0, y: 0, width: 0, height: 0};

              if (
                token.bounding_box &&
                Array.isArray(token.bounding_box) &&
                token.bounding_box.length >= 2
              ) {
                const bbox = token.bounding_box;
                const minX = Math.min(...bbox.map((p: any) => p.x));
                const maxX = Math.max(...bbox.map((p: any) => p.x));
                const minY = Math.min(...bbox.map((p: any) => p.y));
                const maxY = Math.max(...bbox.map((p: any) => p.y));

                coordinates = {
                  x: minX,
                  y: minY,
                  width: maxX - minX,
                  height: maxY - minY,
                };
              }

              // Create region for each meaningful token
              const regionId = `region_${pageNumber}_${tokenIndex}`;
              regions.push({
                id: regionId,
                coordinates,
                pageNumber,
                fieldType: "text_field",
                confidence: token.confidence || 0.5,
              });
            }
          });
        }
      });
    }

    // Extract key-value pairs from the full text (this is the main source of data)
    if (apiData.text) {
      const extractedPairs = extractKeyValuePairsFromText(apiData.text);
      extractedPairs.forEach((pair, index) => {
        const fieldId = `extracted_${index}`;
        fields.push({
          id: fieldId,
          key: toDatabaseKey(pair.key),
          displayName: pair.key,
          value: pair.value,
          confidence: 0.9, // High confidence for text-extracted pairs
          coordinates: {x: 0, y: 0, width: 0, height: 0}, // No specific coordinates for text extraction
          category: categorizeText(pair.key),
          pageNumber: 1,
          regionId: `region_text_${index}`,
        });
      });
    }

    // If we have very few fields, try to extract more from structured patterns
    if (fields.length < 5 && apiData.text) {
      const additionalFields = extractStructuredData(apiData.text);
      additionalFields.forEach((field, index) => {
        const fieldId = `structured_${index}`;
        fields.push({
          id: fieldId,
          key: toDatabaseKey(field.key),
          displayName: field.key,
          value: field.value,
          confidence: 0.8,
          coordinates: {x: 0, y: 0, width: 0, height: 0},
          category: categorizeText(field.key),
          pageNumber: 1,
          regionId: `region_structured_${index}`,
        });
      });
    }
  } catch (error) {
    console.error("Error parsing OCR API response:", error);
  }

  return {regions, fields};
}

// Additional function to extract structured data from invoice-like documents
function extractStructuredData(
  text: string
): Array<{key: string; value: string}> {
  const fields: Array<{key: string; value: string}> = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Extract company names (usually at the top)
  const companyLines = lines.slice(0, 5);
  companyLines.forEach((line) => {
    if (
      line.length > 3 &&
      line.length < 50 &&
      !line.includes("@") &&
      !line.match(/\d{3}/) &&
      !line.toLowerCase().includes("invoice") &&
      !line.toLowerCase().includes("date")
    ) {
      fields.push({key: "Company Name", value: line});
    }
  });

  // Extract all monetary values
  const moneyRegex = /([C$]+[\d,]+\.[\d]{2})/g;
  let match;
  while ((match = moneyRegex.exec(text)) !== null) {
    const amount = match[1];
    const context = text.substring(
      Math.max(0, match.index - 50),
      match.index + 50
    );

    if (context.toLowerCase().includes("subtotal")) {
      fields.push({key: "Subtotal", value: amount});
    } else if (
      context.toLowerCase().includes("total") &&
      !context.toLowerCase().includes("subtotal")
    ) {
      fields.push({key: "Total", value: amount});
    } else if (context.toLowerCase().includes("due")) {
      fields.push({key: "Amount Due", value: amount});
    } else if (context.toLowerCase().includes("balance")) {
      fields.push({key: "Applied Balance", value: amount});
    }
  }

  // Extract all dates
  const dateRegex =
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    const date = match[1];
    const context = text.substring(
      Math.max(0, match.index - 30),
      match.index + 30
    );

    if (context.toLowerCase().includes("due")) {
      fields.push({key: "Due Date", value: date});
    } else if (context.toLowerCase().includes("issue")) {
      fields.push({key: "Issue Date", value: date});
    } else {
      fields.push({key: "Date", value: date});
    }
  }

  // Extract quantities and descriptions from table-like structures
  lines.forEach((line, index) => {
    // Look for lines that might be item descriptions
    if (line.length > 10 && line.length < 100) {
      const nextLine = lines[index + 1];

      // Check if this looks like a product/service description
      if (line.match(/\b(Standard|Premium|Remaining|Unused)\b/i)) {
        fields.push({key: "Service Description", value: line});
      }

      // Look for quantity patterns
      const qtyMatch = line.match(/\b(\d+)\s*(?:x\s*)?([A-Za-z\s]+)/i);
      if (qtyMatch) {
        fields.push({key: "Quantity", value: qtyMatch[1]});
        fields.push({key: "Item", value: qtyMatch[2].trim()});
      }
    }
  });

  return fields;
}

export default function FormParserInterface() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotate, setRotate] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"keyvalue">("keyvalue");
  const [filterText, setFilterText] = useState<string>("");

  // Processing states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<
    "upload" | "processing" | "complete"
  >("upload");

  // Data states
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const pdfViewerRef = useRef<HTMLDivElement>(null);

  const filteredFields = extractedFields.filter(
    (field) =>
      field.key.toLowerCase().includes(filterText.toLowerCase()) ||
      field.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      field.value.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      return;
    }

    // Validate file size (e.g., max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setPdfUrl(URL.createObjectURL(selectedFile));
    setError(null);
    setDetectedRegions([]);
    setExtractedFields([]);
    setProcessingTime(null);
    setApiResponse(null);
    setProcessingStep("processing");

    await processDocument(selectedFile);
  };

  const processDocument = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const result: any = await processDocumentAPI(file);
      const endTime = Date.now();

      if (result.success !== false && (result.text || result.pages)) {
        // Store raw API response for debugging
        setApiResponse(result);

        // Parse the response to extract regions and fields
        const {regions, fields} = parseAPIResponse(result);

        setDetectedRegions(regions);
        setExtractedFields(fields);
        setProcessingTime((endTime - startTime) / 1000);

        // Set number of pages if provided by API
        if (result.pages && Array.isArray(result.pages)) {
          setNumPages(result.pages.length);
        }

        setProcessingStep("complete");
      } else {
        setError("Failed to process document - no text or pages data received");
        setProcessingStep("upload");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setProcessingStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryProcessing = () => {
    if (file) {
      processDocument(file);
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const actualIndex = extractedFields.findIndex(
      (field, idx) => filteredFields[index] === field
    );
    setExtractedFields((prev) =>
      prev.map((field, idx) =>
        idx === actualIndex ? {...field, value} : field
      )
    );
  };

  const removeField = (index: number) => {
    const fieldToRemove = filteredFields[index];
    setExtractedFields((prev) =>
      prev.filter((field) => field !== fieldToRemove)
    );
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleRotateLeft = () => setRotate((r) => (r - 90 + 360) % 360);
  const handleRotateRight = () => setRotate((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1.2);
    setRotate(0);
    setPageNumber(1);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const getFieldsForCurrentPage = () => {
    return filteredFields.filter((field) => field.pageNumber === pageNumber);
  };

  const getCurrentPageFields = getFieldsForCurrentPage();

  const getProcessingStatus = () => {
    switch (processingStep) {
      case "upload":
        return {text: "Ready to upload", color: "#6b7280"};
      case "processing":
        return {text: "Processing document...", color: "#f59e0b"};
      case "complete":
        return {text: "Processing complete", color: "#10b981"};
      default:
        return {text: "Ready", color: "#6b7280"};
    }
  };

  const status = getProcessingStatus();

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Header />
      </div>

      <div style={{display: "flex", height: "calc(100vh - 60px)"}}>
        {/* Left Panel - Form Fields */}
        <div
          style={{
            width: "400px",
            backgroundColor: "white",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#f8fafc",
            }}
          >
            {[{key: "keyvalue", label: "KEY VALUE PAIR"}].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: "12px 16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: activeTab === tab.key ? "#3b82f6" : "#6b7280",
                  backgroundColor:
                    activeTab === tab.key ? "white" : "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key ? "2px solid #3b82f6" : "none",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter and Controls */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Filter size={16} style={{color: "#6b7280"}} />
              <span
                style={{fontSize: "14px", fontWeight: "500", color: "#374151"}}
              >
                Filter
              </span>
              <span style={{fontSize: "12px", color: "#6b7280"}}>
                Type to filter
              </span>
            </div>

            <div style={{position: "relative"}}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                placeholder="Search fields..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <span style={{fontSize: "12px", color: "#6b7280"}}>
                {filteredFields.length} total fields •{" "}
                {getCurrentPageFields.length} on page {pageNumber}
              </span>
            </div>
          </div>

          {/* Fields List */}
          <div style={{flex: 1, overflowY: "auto", padding: "16px"}}>
            {loading ? (
              <div style={{textAlign: "center", padding: "40px 0"}}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }}
                />
                <p style={{color: "#6b7280", fontSize: "14px"}}>
                  Processing document with your API...
                </p>
                <p style={{color: "#9ca3af", fontSize: "12px"}}>
                  Extracting coordinates and key-value pairs
                </p>
              </div>
            ) : error ? (
              <div style={{textAlign: "center", padding: "40px 0"}}>
                <AlertCircle
                  size={48}
                  style={{color: "#ef4444", marginBottom: "16px"}}
                />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#ef4444",
                    margin: "0 0 8px 0",
                  }}
                >
                  API Processing Error
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "0 0 20px 0",
                  }}
                >
                  {error}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={handleRetryProcessing}
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Zap size={14} />
                    Retry API Call
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      setFile(null);
                      setPdfUrl(null);
                      setExtractedFields([]);
                      setDetectedRegions([]);
                      setProcessingStep("upload");
                    }}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Start Over
                  </button>
                </div>
              </div>
            ) : extractedFields.length === 0 ? (
              <div style={{textAlign: "center", padding: "40px 0"}}>
                <FileText
                  size={48}
                  style={{color: "#9ca3af", marginBottom: "16px"}}
                />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#374151",
                    margin: "0 0 8px 0",
                  }}
                >
                  {processingStep === "upload"
                    ? "No Document Uploaded"
                    : "No Fields Extracted"}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "0",
                  }}
                >
                  {processingStep === "upload"
                    ? "Upload a document to begin processing"
                    : `${detectedRegions.length} regions detected, but no key-value pairs extracted`}
                </p>
              </div>
            ) : (
              <div
                style={{display: "flex", flexDirection: "column", gap: "12px"}}
              >
                {filteredFields.map((field, index) => (
                  <div
                    key={`${field.id}-${index}`}
                    style={{
                      padding: "12px",
                      backgroundColor: "white",
                      border: "2px solid #e5e7eb",
                      borderRadius: "6px",
                      transition: "all 0.2s ease",
                      position: "relative",
                      transform: "translateY(0)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            {field.displayName}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#9ca3af",
                              fontFamily: "monospace",
                            }}
                          >
                            {field.key}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#9ca3af",
                            backgroundColor: "#f3f4f6",
                            padding: "1px 4px",
                            borderRadius: "3px",
                          }}
                        >
                          P{field.pageNumber}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            backgroundColor: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {Math.round(field.confidence * 100)}%
                        </span>
                        <button
                          onClick={() => removeField(index)}
                          style={{
                            padding: "4px",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            borderRadius: "3px",
                            transition: "all 0.2s ease",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Remove field"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, e.target.value)}
                      placeholder="Enter value..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - PDF Viewer */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* PDF Controls */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "white",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Zoom and Rotate Controls */}
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <button
                onClick={handleZoomOut}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={handleZoomIn}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <span
                style={{fontSize: "14px", color: "#6b7280", margin: "0 8px"}}
              >
                {Math.round(scale * 100)}%
              </span>

              <div
                style={{
                  width: "1px",
                  height: "20px",
                  backgroundColor: "#d1d5db",
                  margin: "0 4px",
                }}
              />

              <button
                onClick={handleRotateLeft}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Rotate Left"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleRotateRight}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Rotate Right"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                }}
                title="Reset View"
              >
                <RefreshCw size={14} />
                Reset
              </button>
            </div>

            {/* Page Navigation */}
            {numPages > 1 && (
              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber === 1}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: pageNumber === 1 ? "#f3f4f6" : "white",
                    color: pageNumber === 1 ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: pageNumber === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span
                  style={{fontSize: "14px", color: "#6b7280", padding: "0 8px"}}
                >
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={pageNumber === numPages}
                  style={{
                    padding: "6px 12px",
                    backgroundColor:
                      pageNumber === numPages ? "#f3f4f6" : "white",
                    color: pageNumber === numPages ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: pageNumber === numPages ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <button
                onClick={() => document.getElementById("file-input")?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                <Upload size={16} />
                NEW DOCUMENT
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              position: "relative",
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{display: "none"}}
            />

            {pdfUrl ? (
              <div
                ref={pdfViewerRef}
                style={{
                  position: "relative",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  overflow: "visible",
                }}
              >
                <div style={{position: "relative"}}>
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({numPages}) => setNumPages(numPages)}
                    loading={
                      <div style={{padding: "40px", textAlign: "center"}}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            border: "3px solid #f3f4f6",
                            borderTop: "3px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                          }}
                        />
                        <p style={{color: "#6b7280", fontSize: "14px"}}>
                          Loading PDF...
                        </p>
                      </div>
                    }
                  >
                    <PDFPage
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotate}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 40px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "2px dashed #d1d5db",
                }}
              >
                <Upload
                  size={48}
                  style={{color: "#9ca3af", marginBottom: "16px"}}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#374151",
                    margin: "0 0 8px 0",
                  }}
                >
                  Upload a document to begin
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "0 0 20px 0",
                  }}
                >
                  Your API will extract coordinates and key-value pairs
                  automatically
                </p>
                <button
                  onClick={() => document.getElementById("file-input")?.click()}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Choose File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
