"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Document, Page as PDFPage, pdfjs } from "react-pdf";
import {
  Upload,
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
  Import,
} from "lucide-react";
import Header from "@/shared/header";
import {
  categorizeText,
  extractKeyValuePairsFromText,
  processDocumentAPI,
  toDatabaseKey,
  formatEntityTypeToDisplayName,
  categorizeEntitiesIntoSections,
  exportToExcel,
} from "@/lib/utils";
import { BoundingBox, DetectedRegion, ExtractedField } from "@/lib/types";
import { dateRegex, qtyMatchRegex } from "@/lib/constant";
import { ShowToast } from "@/shared/showToast";
import EditableTable, { SpreadsheetView } from "../table";
import ConfirmationModal from "@/shared/DataConfirmationModal";
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Main API function to process document and extract coordinates + key-value pairs

// Function to parse API response and extract regions and fields from OCR data
function parseAPIResponse(apiData: any): {
  regions: DetectedRegion[];
  fields: ExtractedField[];
  sections?: {
    companyLocationInfo: any[];
    contactProjectInfo: any[];
    dataDeliverables: any[];
    containerInfo: any[];
    collectedSampleDataInfo: any[];
  };
} {
  const regions: DetectedRegion[] = [];
  const fields: ExtractedField[] = [];
  let sections = undefined;

  try {
    // Handle OCR-style API response with pages and tokens
    if (apiData.pages && Array.isArray(apiData.pages)) {
      apiData.pages.forEach((page: any, pageIndex: number) => {
        const pageNumber = page.page_number || pageIndex + 1;
        const pageDimensions = page.dimensions || { width: 1, height: 1 };

        if (page.tokens && Array.isArray(page.tokens)) {
          page.tokens.forEach((token: any, tokenIndex: number) => {
            // Process tokens with non-empty text
            if (token.text && token.text.trim() !== "") {
              // Convert bounding box format
              let coordinates: BoundingBox = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
              };

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

    // Extract key-value pairs from the entities (primary source)
    if (apiData.entities && Array.isArray(apiData.entities)) {
      // Categorize entities into sections for spreadsheet view
      sections = categorizeEntitiesIntoSections(apiData.entities);

      apiData.entities.forEach((entity: any, index: number) => {
        if (entity.type && entity.value) {
          // Convert entity type to display name using helper function
          const displayName = formatEntityTypeToDisplayName(entity.type);

          const fieldId = `entity_${index}`;
          fields.push({
            id: fieldId,
            key: toDatabaseKey(displayName),
            displayName: displayName,
            value: entity.value,
            confidence: entity.confidence || 0.9, // Use entity confidence or default to 0.9
            coordinates: { x: 0, y: 0, width: 0, height: 0 }, // No specific coordinates for entity extraction
            category: categorizeText(displayName),
            pageNumber: 1,
            regionId: `region_entity_${index}`,
          });
        }
      });
    } else {
      // As Fallback: Extract key-value pairs from the full text (when entities are not available)
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
            coordinates: { x: 0, y: 0, width: 0, height: 0 }, // No specific coordinates for text extraction
            category: categorizeText(pair.key),
            pageNumber: 1,
            regionId: `region_text_${index}`,
          });
        });
      }
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
          coordinates: { x: 0, y: 0, width: 0, height: 0 },
          category: categorizeText(field.key),
          pageNumber: 1,
          regionId: `region_structured_${index}`,
        });
      });
    }
  } catch (error) {
    console.error("Error parsing OCR API response:", error);
  }

  return { regions, fields, sections };
}

// Additional function to extract structured data from invoice-like documents
function extractStructuredData(
  text: string
): Array<{ key: string; value: string }> {
  const fields: Array<{ key: string; value: string }> = [];
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
      fields.push({ key: "Company Name", value: line });
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
      fields.push({ key: "Subtotal", value: amount });
    } else if (
      context.toLowerCase().includes("total") &&
      !context.toLowerCase().includes("subtotal")
    ) {
      fields.push({ key: "Total", value: amount });
    } else if (context.toLowerCase().includes("due")) {
      fields.push({ key: "Amount Due", value: amount });
    } else if (context.toLowerCase().includes("balance")) {
      fields.push({ key: "Applied Balance", value: amount });
    }
  }

  // Extract all dates

  while ((match = dateRegex.exec(text)) !== null) {
    const date = match[1];
    const context = text.substring(
      Math.max(0, match.index - 30),
      match.index + 30
    );

    if (context.toLowerCase().includes("due")) {
      fields.push({ key: "Due Date", value: date });
    } else if (context.toLowerCase().includes("issue")) {
      fields.push({ key: "Issue Date", value: date });
    } else {
      fields.push({ key: "Date", value: date });
    }
  }

  // Extract quantities and descriptions from table-like structures
  lines.forEach((line, index) => {
    // Look for lines that might be item descriptions
    if (line.length > 10 && line.length < 100) {
      const nextLine = lines[index + 1];

      // Check if this looks like a product/service description
      if (line.match(/\b(Standard|Premium|Remaining|Unused)\b/i)) {
        fields.push({ key: "Service Description", value: line });
      }

      // Look for quantity patterns
      const qtyMatch = line.match(qtyMatchRegex);
      if (qtyMatch) {
        fields.push({ key: "Quantity", value: qtyMatch[1] });
        fields.push({ key: "Item", value: qtyMatch[2].trim() });
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
  const [categorizedSections, setCategorizedSections] = useState<{
    companyLocationInfo: any[];
    contactProjectInfo: any[];
    dataDeliverables: any[];
    containerInfo: any[];
    collectedSampleDataInfo: any[];
  }>({
    companyLocationInfo: [],
    contactProjectInfo: [],
    dataDeliverables: [],
    containerInfo: [],
    collectedSampleDataInfo: []
  });
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Resizer states
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(30);

  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const pdfViewerRef = useRef<HTMLDivElement>(null);

  // Refs for input fields to enable Enter-to-next navigation
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const filteredFields = extractedFields.filter(
    (field) =>
      field.key.toLowerCase().includes(filterText.toLowerCase()) ||
      field.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      field.value.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pdfViewerRef.current) return;

    // Enable dragging
    setIsDragging(true);

    // Store the initial mouse position and scroll position
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: pdfViewerRef.current.scrollLeft,
      scrollTop: pdfViewerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !pdfViewerRef.current) return;

    // Calculate the distance moved
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Scroll the container
    pdfViewerRef.current.scrollLeft = dragStart.scrollLeft - deltaX;
    pdfViewerRef.current.scrollTop = dragStart.scrollTop - deltaY;
  };

  const handleMouseUp = () => {
    // Disable dragging
    setIsDragging(false);
    setDragStart(null);
  };

  // Resizer handlers
  const handleResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(leftPanelWidth);

    // Create the move and up handlers with current values
    const handleMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - e.clientX;
      const containerWidth = window.innerWidth;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      // Calculate new width with constraints
      let newWidth = leftPanelWidth + deltaPercentage;
      newWidth = Math.max(15, Math.min(60, newWidth)); // Min 15%, Max 60%

      setLeftPanelWidth(newWidth);
    };

    const handleUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleResizerMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartX;
    const containerWidth = window.innerWidth;
    const deltaPercentage = (deltaX / containerWidth) * 100;

    // Calculate new width with constraints
    let newWidth = resizeStartWidth + deltaPercentage;
    newWidth = Math.max(15, Math.min(60, newWidth)); // Min 15%, Max 60%

    setLeftPanelWidth(newWidth);
  };

  const handleResizerMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizerMouseMove);
    document.removeEventListener('mouseup', handleResizerMouseUp);
  };

  // Touch handlers for mobile support
  const handleResizerTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsResizing(true);
    setResizeStartX(touch.clientX);
    setResizeStartWidth(leftPanelWidth);

    // Add global touch event listeners
    document.addEventListener('touchmove', handleResizerTouchMove, { passive: false });
    document.addEventListener('touchend', handleResizerTouchEnd);
  };

  const handleResizerTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isResizing) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - resizeStartX;
    const containerWidth = window.innerWidth;
    const deltaPercentage = (deltaX / containerWidth) * 100;

    // Calculate new width with constraints
    let newWidth = resizeStartWidth + deltaPercentage;
    newWidth = Math.max(15, Math.min(60, newWidth)); // Min 15%, Max 60%

    setLeftPanelWidth(newWidth);
  };

  const handleResizerTouchEnd = () => {
    setIsResizing(false);
    document.removeEventListener('touchmove', handleResizerTouchMove);
    document.removeEventListener('touchend', handleResizerTouchEnd);
  };

  // Clean up event listeners on component unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizerMouseMove);
      document.removeEventListener('mouseup', handleResizerMouseUp);
      document.removeEventListener('touchmove', handleResizerTouchMove);
      document.removeEventListener('touchend', handleResizerTouchEnd);
    };
  }, []);

  // Add global style for body when resizing to prevent text selection
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const [sending, setSending] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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
    setCategorizedSections({
      companyLocationInfo: [],
      contactProjectInfo: [],
      dataDeliverables: [],
      containerInfo: [],
      collectedSampleDataInfo: []
    });
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
        const { regions, fields, sections } = parseAPIResponse(result);

        setDetectedRegions(regions);
        setExtractedFields(fields);

        // Set categorized sections if available
        if (sections) {
          setCategorizedSections(sections);
        }
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
        idx === actualIndex ? { ...field, value } : field
      )
    );
  };

  const removeField = (index: number) => {
    const fieldToRemove = filteredFields[index];
    setExtractedFields((prev) =>
      prev.filter((field) => field !== fieldToRemove)
    );
  };

  // Handlers for spreadsheet view sections
  const handleSectionFieldChange = (sectionType: string, index: number, value: string) => {
    setCategorizedSections(prev => ({
      ...prev,
      [sectionType]: prev[sectionType as keyof typeof prev].map((item, idx) =>
        idx === index ? { ...item, value } : item
      )
    }));

    // Also update the extractedFields for consistency
    const sectionItems = categorizedSections[sectionType as keyof typeof categorizedSections];
    const item = sectionItems[index];
    if (item) {
      const fieldIndex = extractedFields.findIndex(field =>
        field.regionId.includes('entity') && field.displayName === formatEntityTypeToDisplayName(item.type)
      );
      if (fieldIndex !== -1) {
        setExtractedFields(prev =>
          prev.map((field, idx) =>
            idx === fieldIndex ? { ...field, value } : field
          )
        );
      }
    }
  };

  const handleSectionRemoveField = (sectionType: string, index: number) => {
    const itemToRemove = categorizedSections[sectionType as keyof typeof categorizedSections][index];

    setCategorizedSections(prev => ({
      ...prev,
      [sectionType]: prev[sectionType as keyof typeof prev].filter((_, idx) => idx !== index)
    }));

    // Also remove from extractedFields
    if (itemToRemove) {
      setExtractedFields(prev =>
        prev.filter(field =>
          !(field.regionId.includes('entity') && field.displayName === formatEntityTypeToDisplayName(itemToRemove.type))
        )
      );
    }
  };

  // Export handler
  const handleExport = () => {
    if (categorizedSections.companyLocationInfo.length > 0 || categorizedSections.contactProjectInfo.length > 0 ||
      categorizedSections.dataDeliverables.length > 0 || categorizedSections.containerInfo.length > 0 ||
      categorizedSections.collectedSampleDataInfo.length > 0) {
      exportToExcel(categorizedSections, 'extracted_document_data');
      ShowToast("Data exported to CSV successfully!", "success");
    } else {
      ShowToast("No data available to export", "error");
    }
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

  const handleConfirmSend: any = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields: extractedFields }),
      });
      const result = await res.json();
      if (result.success) {
        ShowToast("Data saved successfully!", "success");
        setShowConfirmationModal(false);
      } else {
        ShowToast("Error: " + result.error, "error");
      }
    } catch (err) {
      ShowToast(`${err || "Error occurred while saving document"}`, "error");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    setShowConfirmationModal(true);
  };

  const handleCancelSend = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div
      style={{
        height: "85vh",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "calc(90vh - 60px)",
        }}
      >
        {/* Left Panel - Form Fields */}
        {!isPanelCollapsed && (
          <div
            style={{
              width: `${leftPanelWidth}%`,
              backgroundColor: "white",
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              transition: isResizing ? "none" : "width 0.2s ease",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#f8fafc",
              }}
            >
              {[{ key: "keyvalue", label: "COC Document" }].map((tab) => (
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
              {/* <div style={{ position: "relative" }}> */}
              {/* <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                /> */}
              {/* <input
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
                /> */}
              {/* </div> */}

              {/* <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  {filteredFields.length} total fields •{" "}
                  {getCurrentPageFields.length} on page {pageNumber}
                </span>
              </div> */}
            </div>

            {/* Fields List */}
            <div
              style={{
                padding: "16px",
                minHeight: 0,
                paddingBottom: 64,
              }}
            >
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
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
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>
                    Processing document with your API...
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "12px" }}>
                    Extracting coordinates and key-value pairs
                  </p>
                </div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <AlertCircle
                    size={48}
                    style={{ color: "#ef4444", marginBottom: "16px" }}
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
                        setCategorizedSections({
                          companyLocationInfo: [],
                          contactProjectInfo: [],
                          dataDeliverables: [],
                          containerInfo: [],
                          collectedSampleDataInfo: []
                        });
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
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <FileText
                    size={48}
                    style={{ color: "#9ca3af", marginBottom: "16px" }}
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
                // Use SpreadsheetView if we have categorized sections, otherwise use EditableTable
                (categorizedSections.companyLocationInfo.length > 0 || categorizedSections.contactProjectInfo.length > 0 ||
                  categorizedSections.dataDeliverables.length > 0 || categorizedSections.containerInfo.length > 0 ||
                  categorizedSections.collectedSampleDataInfo.length > 0) ? (
                  <SpreadsheetView
                    sections={categorizedSections}
                    onFieldChange={handleSectionFieldChange}
                    onRemoveField={handleSectionRemoveField}
                  />
                ) : (
                  <EditableTable
                    fields={filteredFields}
                    onFieldChange={handleFieldChange}
                    onRemoveField={removeField}
                  />
                )
              )}
            </div>

            {/* Sticky Send Button - always visible at the bottom */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                left: 0,
                width: "90%",
                background: "#fff",
                padding: "16px",
                // borderTop: "1px solid #e5e7eb",
                zIndex: 2,
              }}
            >
              <button
                onClick={handleSend}
                style={{
                  width: "100%",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "12px 0",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: sending ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(59, 130, 246, 0.10)",
                  transition: "background 0.2s",
                  opacity: extractedFields.length > 0 ? 1 : 0.5,
                  pointerEvents:
                    extractedFields.length > 0 && !sending ? "auto" : "none",
                  position: "relative",
                }}
                disabled={extractedFields.length === 0 || sending}
              >
                {sending ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className="spinner"
                      style={{
                        width: 18,
                        height: 18,
                        border: "3px solid #fff",
                        borderTop: "3px solid #3b82f6",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Draggable Resizer */}
        {!isPanelCollapsed && (
          <div
            style={{
              width: "8px",
              minWidth: "8px",
              backgroundColor: isResizing ? "#3b82f6" : "#d1d5db",
              cursor: "col-resize",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: isResizing ? "none" : "background-color 0.2s ease",
              boxShadow: isResizing ? "0 0 8px rgba(59, 130, 246, 0.4)" : "none",
              borderLeft: "1px solid #e5e7eb",
              borderRight: "1px solid #e5e7eb",
              userSelect: "none",
              height: "100%",
            }}
            onMouseDown={handleResizerMouseDown}
            onTouchStart={handleResizerTouchStart}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isResizing ? "#3b82f6" : "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isResizing ? "#3b82f6" : "#d1d5db";
            }}
          >
            {/* Visual indicator dots */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                alignItems: "center",
                pointerEvents: "none", // Ensure clicks pass through to parent
              }}
            >
              <div
                style={{
                  width: "3px",
                  height: "3px",
                  backgroundColor: "#6b7280",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: "3px",
                  height: "3px",
                  backgroundColor: "#6b7280",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: "3px",
                  height: "3px",
                  backgroundColor: "#6b7280",
                  borderRadius: "50%",
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          style={{
            position: "absolute",
            left: isPanelCollapsed ? "20px" : `${leftPanelWidth}%`,
            zIndex: 10,
            marginTop: "60px",
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "5px 7px",
            borderRadius: "100%",
            border: "none",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: isResizing ? "none" : "left 0.2s ease",
          }}
        >
          {isPanelCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        {/* Right Panel - PDF Viewer */}
        <div
          style={{
            width: isPanelCollapsed ? "100%" : `${100 - leftPanelWidth - 0.6}%`, // Subtract resizer width
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            transition: isResizing ? "none" : "width 0.2s ease",
          }}
        >
          {/* PDF Controls */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "white",
              // borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Zoom and Rotate Controls */}
            {pdfUrl ? (
              <>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
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
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 8px",
                    }}
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
                {/* Show NEW DOCUMENT button only when pdfUrl is set */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
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
                  {!loading && (
                    <button
                      onClick={handleExport}
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
                      disabled={extractedFields.length === 0}
                    >
                      <Import size={16} />
                      Export to Excel
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div />
            )}
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
              overflow: "hidden", // Prevent content from overflowing
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {pdfUrl ? (
              <div
                style={{
                  position: "relative",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  width: "100%",
                  height: "100%",
                  maxWidth: "800px",
                  maxHeight: "100%",
                }}
              >
                <div
                  ref={pdfViewerRef}
                  style={{
                    position: "relative",
                    overflow: "auto",
                    width: "100%",
                    height: "100%",
                    cursor: isDragging ? "grabbing" : "grab", // Change cursor during drag
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp} // Stop dragging if the mouse leaves the container
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                      <div style={{ padding: "40px", textAlign: "center" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            border: "3px solid #f3f4f6",
                            // borderTop: "3px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                          }}
                        />
                        <p style={{ color: "#6b7280", fontSize: "14px" }}>
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
                  style={{ color: "#9ca3af", marginBottom: "16px" }}
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
                {/* <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "0 0 20px 0",
                  }}
                >
                  Your API will extract coordinates and key-value pairs
                  automatically
                </p> */}
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

      <ConfirmationModal
        isOpen={showConfirmationModal}
        fields={extractedFields}
        onFieldChange={handleFieldChange}
        onRemoveField={removeField}
        onClose={handleCancelSend}
        onConfirm={handleConfirmSend}
        isSending={sending}
      />

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
    </div >
  );
}
