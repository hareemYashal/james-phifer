"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from "react-pdf";
import {
  Upload,
  // Filter, // COMMENTED OUT - Not used anymore
  // Search, // COMMENTED OUT - Not used anymore
  ZoomIn,
  ZoomOut,
  // X, // COMMENTED OUT - Not used anymore
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  RefreshCw,
  FileText,
  AlertCircle,
  Zap,
  Import,
  Loader,
  List,
  // History, // COMMENTED OUT - Not used anymore
} from "lucide-react";
import Header from "@/shared/header";
import {
  categorizeText,
  extractKeyValuePairsFromText,
  processDocumentAPI,
  processFastAPI,
  toDatabaseKey,
  formatEntityTypeToDisplayName,
  categorizeEntitiesIntoSections,
  // exportToExcel,
} from "@/lib/utils";
import { BoundingBox, DetectedRegion, ExtractedField } from "@/lib/types";
import { dateRegex, qtyMatchRegex } from "@/lib/constant";
import { ShowToast } from "@/shared/showToast";
// import EditableTable, { SpreadsheetView } from "../table"; // COMMENTED OUT - Using AG Grid only now

// COMMENTED OUT - Old resizable imports not used anymore  
/*
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
*/

import ConfirmationModal from "@/shared/DataConfirmationModal";
// import { CompanyContactGrid } from "../grid-tables/company-contact-grid/company-contact-grid";
// import { SampleDataGrid } from "../grid-tables/sample-data-grid/sample-data-grid";
import { V2DataGrid } from "../grid-tables/v2-data-grid/v2-data-grid";
import { sampleExtractedFields } from "@/lib/sample-extracted-fields";
import { Button } from "../ui/button";
import { Document as DocumentType } from "@/types";
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
      // Log all entities for debugging
      console.log("🔍 All Extracted Entities:", apiData.entities);

      // Categorize entities into sections for spreadsheet view
      sections = categorizeEntitiesIntoSections(apiData.entities);
      console.log("📋 Categorized Sections:", sections);

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
  // OLD STATE VARIABLES - COMMENTED OUT - Using AG Grid only now
  // const [activeTab, setActiveTab] = useState<"keyvalue">("keyvalue");
  // const [filterText, setFilterText] = useState<string>("");
  // const [useAgGrid, setUseAgGrid] = useState<boolean>(true);

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
    collectedSampleDataInfo: [],
  });
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Refs to trigger export from grids
  // const companyContactGridRef = useRef<{ handleExportData: () => void; getCurrentData: () => any[] }>(null);
  // const sampleDataGridRef = useRef<{ handleExportData: () => void; getCurrentData: () => { sampleData: any[]; nonSampleData: any[] } }>(null);
  const v2DataGridRef = useRef<{ handleExportData: () => void; getCurrentData: () => any[] }>(null);

  // State to hold current grid data for export
  const [currentCompanyContactData, setCurrentCompanyContactData] = useState<any[]>([]);
  const [currentSampleData, setCurrentSampleData] = useState<any[]>([]);
  const [currentNonSampleData, setCurrentNonSampleData] = useState<any[]>([]);
  const [fastData, setFastData] = useState<any[]>([]);

  // Resizer states
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(50);

  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const pdfViewerRef = useRef<HTMLDivElement>(null);

  // Refs for input fields to enable Enter-to-next navigation - COMMENTED OUT
  // const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OLD FILTERED FIELDS LOGIC - COMMENTED OUT - Using AG Grid only now
  /*
  const filteredFields = extractedFields.filter(
    (field) =>
      field.key.toLowerCase().includes(filterText.toLowerCase()) ||
      field.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      field.value.toLowerCase().includes(filterText.toLowerCase())
  );
  */

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
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    // Add global event listeners
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
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
    document.removeEventListener("mousemove", handleResizerMouseMove);
    document.removeEventListener("mouseup", handleResizerMouseUp);
  };

  // Touch handlers for mobile support
  const handleResizerTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsResizing(true);
    setResizeStartX(touch.clientX);
    setResizeStartWidth(leftPanelWidth);

    // Add global touch event listeners
    document.addEventListener("touchmove", handleResizerTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleResizerTouchEnd);
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
    document.removeEventListener("touchmove", handleResizerTouchMove);
    document.removeEventListener("touchend", handleResizerTouchEnd);
  };

  // Clean up event listeners on component unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizerMouseMove);
      document.removeEventListener("mouseup", handleResizerMouseUp);
      document.removeEventListener("touchmove", handleResizerTouchMove);
      document.removeEventListener("touchend", handleResizerTouchEnd);
    };
  }, []);

  // Add global style for body when resizing to prevent text selection
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  const [sending, setSending] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Documents History states
  const [isDocumentsDropdownOpen, setIsDocumentsDropdownOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    // Reset the input value immediately to allow selecting the same file again
    e.target.value = "";

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
      collectedSampleDataInfo: [],
    });
    setProcessingTime(null);
    setApiResponse(null);
    setProcessingStep("processing");
    // await processDocument(selectedFile);
    await processDocumentWithFastAPI(selectedFile);
  };

  // I need to add a new function to process the document with the new API
  const processDocumentWithFastAPI = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await processFastAPI(file);
      console.log('FastAPI result:', result);
      console.log('FastAPI result extracted_fields:', result.extracted_fields);
      setFastData(result.extracted_fields);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to process document with FastAPI");
    } finally {
      setLoading(false);
    }
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

        // Log the complete document upload result
        console.log("📄 Document Upload Result:", result);
        console.log("📊 API Response Structure:", {
          hasText: !!result.text,
          hasPages: !!result.pages,
          hasEntities: !!result.entities,
          entitiesCount: result.entities?.length || 0,
          pagesCount: result.pages?.length || 0,
        });

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

  // OLD FIELD MANIPULATION HANDLERS - COMMENTED OUT - Using AG Grid only now
  /*
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
  */

  // Handlers for spreadsheet view sections
  // const handleSectionFieldChange = (
  //   sectionType: string,
  //   index: number,
  //   value: string
  // ) => {
  //   setCategorizedSections((prev) => ({
  //     ...prev,
  //     [sectionType]: prev[sectionType as keyof typeof prev].map((item, idx) =>
  //       idx === index ? { ...item, value } : item
  //     ),
  //   }));

  //   // Also update the extractedFields for consistency
  //   const sectionItems =
  //     categorizedSections[sectionType as keyof typeof categorizedSections];
  //   const item = sectionItems[index];
  //   if (item) {
  //     const fieldIndex = extractedFields.findIndex(
  //       (field) =>
  //         field.regionId.includes("entity") &&
  //         field.displayName === formatEntityTypeToDisplayName(item.type)
  //     );
  //     if (fieldIndex !== -1) {
  //       setExtractedFields((prev) =>
  //         prev.map((field, idx) =>
  //           idx === fieldIndex ? { ...field, value } : field
  //         )
  //       );
  //     }
  //   }
  // };

  // const handleSectionRemoveField = (sectionType: string, index: number) => {
  //   const sectionData =
  //     categorizedSections[sectionType as keyof typeof categorizedSections];

  //   // Handle out-of-bounds index gracefully (can happen when removing multiple items)
  //   if (!sectionData || index >= sectionData.length || index < 0) {
  //     return;
  //   }

  //   const itemToRemove = sectionData[index];

  //   setCategorizedSections((prev) => ({
  //     ...prev,
  //     [sectionType]: prev[sectionType as keyof typeof prev].filter(
  //       (_, idx) => idx !== index
  //     ),
  //   }));

  //   // Also remove from extractedFields
  //   if (itemToRemove) {
  //     setExtractedFields((prev) =>
  //       prev.filter(
  //         (field) =>
  //           !(
  //             field.regionId.includes("entity") &&
  //             field.displayName ===
  //             formatEntityTypeToDisplayName(itemToRemove.type)
  //           )
  //       )
  //     );
  //   }
  // };

  // Handle field change for fastData (V2DataGrid)
  const handleFastDataFieldChange = (index: number, value: string) => {
    if (fastData && fastData.length > index && index >= 0) {
      const updatedData = [...fastData];
      updatedData[index] = { ...updatedData[index], value };
      setFastData(updatedData);
    }
  };

  // Handle field removal for fastData (V2DataGrid)
  const handleFastDataRemoveField = (index: number) => {
    if (fastData && fastData.length > index && index >= 0) {
      const updatedData = [...fastData];
      updatedData.splice(index, 1);
      setFastData(updatedData);
    }
  };

  // Export handler - gets data directly from grids instantly with LIGHTYEAR SPEED
  const handleExport = () => {
    let companyData: any[] = [];
    // let sampleData: any[] = [];
    // let nonSampleData: any[] = [];

    // Get data DIRECTLY from grids without any async delays
    // if (companyContactGridRef.current?.getCurrentData) {
    //   companyData = companyContactGridRef.current.getCurrentData();
    // }

    // if (sampleDataGridRef.current?.getCurrentData) {
    //   const sampleGridData = sampleDataGridRef.current.getCurrentData();
    //   sampleData = sampleGridData.sampleData;
    //   nonSampleData = sampleGridData.nonSampleData;
    // }

    if (v2DataGridRef.current?.getCurrentData) {
      companyData = v2DataGridRef.current.getCurrentData();
    }

    // Export IMMEDIATELY - LIGHTYEAR SPEED!
    if (companyData.length > 0) {
      exportGridDataToCSV(companyData);
      ShowToast("Grid data exported to CSV successfully!", "success");
    } else {
      ShowToast("No data available to export", "error");
    }
  };

  // Function to export current grid data to CSV
  const exportGridDataToCSV = (companyContactData: any[]) => {
    let csvContent = '';

    // Export V2DataGrid Data (extracted fields)
    if (companyContactData.length > 0) {
      csvContent += 'EXTRACTED FIELDS DATA\n';
      csvContent += 'Field Name,Value,Confidence,Section\n';

      companyContactData.forEach((item: any) => {
        const confidence = item.confidence ? Math.round(item.confidence * 100) + '%' : '';
        csvContent += `"${item.fieldName}","${item.value}","${confidence}","${item.section}"\n`;
      });
      csvContent += '\n';
    } else {
      console.log("No company contact data to export");
    }

    // Export Non-Sample Fields (General Information)
    // if (nonSampleData.length > 0) {
    //   csvContent += 'GENERAL INFORMATION\n';
    //   csvContent += 'Field Name,Value,Confidence\n';

    //   nonSampleData.forEach((item: any) => {
    //     const confidence = item.confidence ? Math.round(item.confidence * 100) + '%' : '';
    //     csvContent += `"${item.fieldName}","${item.value}","${confidence}"\n`;
    //   });
    //   csvContent += '\n';
    // }

    // Export Sample Data Grid
    // if (sampleData.length > 0) {
    //   csvContent += 'SAMPLE DATA INFORMATION\n';
    //   csvContent += 'Customer Sample ID,Matrix,Grab,Composite Start Date,Composite Start Time,Method\n';

    //   sampleData.forEach((item: any) => {
    //     csvContent += `"${item.customerSampleId || ''}","${item.matrix || ''}","${item.grab || ''}","${item.compositeStartDate || ''}","${item.compositeStartTime || ''}","${item.method || ''}"\n`;
    //   });
    // }

    // Ensure we have some content to export
    if (csvContent.trim() === '') {
      csvContent = 'EXTRACTED FIELDS DATA\nField Name,Value,Confidence,Section\nNo data available\n';
      console.log("No CSV content generated, using fallback");
    }

    // Create and download file

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'extracted_fields_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // OLD PAGE FIELD FILTERING - COMMENTED OUT - Using AG Grid only now
  /*
  const getFieldsForCurrentPage = () => {
    return filteredFields.filter((field) => field.pageNumber === pageNumber);
  };

  const getCurrentPageFields = getFieldsForCurrentPage();
  */

  const handleConfirmSend: any = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("access_token");

      // Collect latest data from both AG grids
      let companyContactData: any[] = [];
      // let sampleData: any[] = [];
      // let nonSampleData: any[] = [];

      // Get current data from V2 Data Grid
      // if (companyContactGridRef.current?.getCurrentData) {
      //   companyContactData = companyContactGridRef.current.getCurrentData();
      // }

      // if (sampleDataGridRef.current?.getCurrentData) {
      //   const sampleGridData = sampleDataGridRef.current.getCurrentData();
      //   sampleData = sampleGridData.sampleData;
      //   nonSampleData = sampleGridData.nonSampleData;
      // }

      if (v2DataGridRef.current?.getCurrentData) {
        companyContactData = v2DataGridRef.current.getCurrentData();
      }

      // Prepare the data payload with latest grid data
      const gridData = {
        companyContactData,
        // sampleData,
        // nonSampleData,
        categorizedSections, // Keep categorized sections for context
      };

      const formData = new FormData();
      formData.append("fields", JSON.stringify(gridData));

      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        ShowToast("Document and data saved successfully!", "success");
        setShowConfirmationModal(false);

        if (result.fileUrl) {
          console.log("Document stored at:", result.fileUrl);
        }

        // Log the data that was sent
        console.log("Latest grid data sent:", {
          companyContactData: companyContactData.length,
          // sampleData: sampleData.length,
          // nonSampleData: nonSampleData.length,
        });
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

  // Documents History functions
  const fetchDocuments = async () => {
    try {
      setIsDocumentsLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        return;
      }

      const response = await fetch("/api/my-documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching documents:", errorData.error);
        return;
      }

      const data = await response.json();
      console.log("Documents DATA", data);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const handleDocumentsHistoryClick = () => {
    if (!isDocumentsDropdownOpen) {
      fetchDocuments();
    }
    setIsDocumentsDropdownOpen(!isDocumentsDropdownOpen);
  };

  const handleDocumentClick = (doc: DocumentType) => {
    console.log("Selected document:", doc);
    setIsDocumentsDropdownOpen(false);

    // Navigate to the specific document viewer route
    window.location.href = `/pdf-viewer/${doc.id}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDocumentsDropdownOpen && !target.closest('[data-documents-dropdown]')) {
        setIsDocumentsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDocumentsDropdownOpen]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="flex h-screen">
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
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
              }}
            >
              {/* OLD TAB NAVIGATION - COMMENTED OUT - Using AG Grid only now
              <div style={{ display: "flex" }}>
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
              */}
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#3b82f6",
                    backgroundColor: "white",
                    border: "none",
                    borderBottom: "2px solid #3b82f6",
                  }}
                >
                  COC Document
                </div>
              </div>

              {/* Documents History Dropdown */}
              <div style={{ position: "relative" }} data-documents-dropdown>
                {/* <button
                  onClick={handleDocumentsHistoryClick}
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
                    marginTop: "10px",
                  }}
                  title="Documents History"
                >
                  <List size={16} />
                  Documents History
                </button> */}

                {/* Dropdown */}
                {isDocumentsDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: "0",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      minWidth: "250px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      zIndex: 1000,
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: "#3b82f6",
                        borderRadius: "4px 4px 0 0",
                      }}
                    >
                      Documents History
                    </div>

                    {isDocumentsLoading ? (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        Loading documents...
                      </div>
                    ) : (
                      <ul style={{ listStyle: "none", padding: "16px", margin: 0 }}>
                        {documents.length === 0 ? (
                          <li
                            style={{
                              padding: "8px 12px",
                              textAlign: "center",
                              color: "#6b7280",
                              fontSize: "14px",
                            }}
                          >
                            No documents found in this lab
                          </li>
                        ) : (
                          documents.map((doc) => (
                            <li
                              key={doc.id}
                              onClick={() => handleDocumentClick(doc)}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                borderRadius: "4px",
                                marginBottom: "8px",
                                fontSize: "14px",
                                transition: "background-color 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#e2e8f0";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              COC Document - {doc.id}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* View Toggle - COMMENTED OUT - Using AG Grid only now */}
            {/* <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#f1f5f9",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                View:
              </span>
              <button
                onClick={() => setUseAgGrid(true)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: useAgGrid ? "#3b82f6" : "#6b7280",
                  backgroundColor: useAgGrid ? "#dbeafe" : "transparent",
                  border: "1px solid",
                  borderColor: useAgGrid ? "#3b82f6" : "#d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                AG Grid
              </button>
              <button
                onClick={() => setUseAgGrid(false)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: !useAgGrid ? "#3b82f6" : "#6b7280",
                  backgroundColor: !useAgGrid ? "#dbeafe" : "transparent",
                  border: "1px solid",
                  borderColor: !useAgGrid ? "#3b82f6" : "#d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Table View
              </button>
            </div> */}

            {/* Filter and Controls */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            ></div>

            {/* Fields List */}
            <div
              style={{
                padding: "16px",
                minHeight: 0,
                paddingBottom: 64,
                overflowY: "auto",
                maxHeight: "calc(100vh - 200px)",
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
                          collectedSampleDataInfo: [],
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
              ) : // Check for fastData first (new FastAPI endpoint)
                fastData && fastData.length > 0 ? (
                  <div className="space-y-6">
                    <V2DataGrid
                      ref={v2DataGridRef}
                      extractedFields={fastData}
                      onFieldChange={handleFastDataFieldChange}
                      onRemoveField={handleFastDataRemoveField}
                      onExportData={setCurrentCompanyContactData}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                      <FileText
                        size={48}
                        style={{ color: "#9ca3af" }}
                      />
                    </div>
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
                        : "No Data Available"}
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
                        : "No extracted data to display"}
                    </p>
                  </div>
                )}

              {/* LEGACY CODE - COMMENTED OUT 
              extractedFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
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
              ) : // ALWAYS use AG Grid tables now for legacy categorized data - old table view commented out
                categorizedSections.companyLocationInfo.length > 0 ||
                  categorizedSections.contactProjectInfo.length > 0 ||
                  categorizedSections.dataDeliverables.length > 0 ||
                  categorizedSections.containerInfo.length > 0 ||
                  categorizedSections.collectedSampleDataInfo.length > 0 ? (
                  <div className="space-y-6">
                    <CompanyContactGrid
                      ref={companyContactGridRef}
                      categorizedSections={{
                        companyLocationInfo:
                          categorizedSections.companyLocationInfo,
                        contactProjectInfo:
                          categorizedSections.contactProjectInfo,
                        dataDeliverables:
                          categorizedSections.dataDeliverables,
                        containerInfo:
                          categorizedSections.containerInfo,
                      }}
                      onFieldChange={handleSectionFieldChange}
                      onRemoveField={handleSectionRemoveField}
                      onExportData={setCurrentCompanyContactData}
                    />
                    <SampleDataGrid
                      ref={sampleDataGridRef}
                      categorizedSections={{
                        collectedSampleDataInfo:
                          categorizedSections.collectedSampleDataInfo,
                      }}
                      onFieldChange={handleSectionFieldChange}
                      onRemoveField={handleSectionRemoveField}
                      onExportData={(sampleData, nonSampleData) => {
                        setCurrentSampleData(sampleData);
                        setCurrentNonSampleData(nonSampleData);
                      }}
                    />
                  </div>
                ) : (
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
                      No categorized data available
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        margin: "0",
                      }}
                    >
                      Upload a document to see extracted data
                    </p>
                  </div>
                )}
              */}

              {/* OLD TABLE VIEW METHODS - COMMENTED OUT 
                useAgGrid ? (
                  categorizedSections.companyLocationInfo.length > 0 ||
                    categorizedSections.contactProjectInfo.length > 0 ||
                    categorizedSections.dataDeliverables.length > 0 ||
                    categorizedSections.containerInfo.length > 0 ||
                    categorizedSections.collectedSampleDataInfo.length > 0 ? (
                    <div className="space-y-6">
                      <CompanyContactGrid
                        ref={companyContactGridRef}
                        categorizedSections={{
                          companyLocationInfo:
                            categorizedSections.companyLocationInfo,
                          contactProjectInfo:
                            categorizedSections.contactProjectInfo,
                          dataDeliverables:
                            categorizedSections.dataDeliverables,
                          containerInfo:
                            categorizedSections.containerInfo,
                        }}
                        onFieldChange={handleSectionFieldChange}
                        onRemoveField={handleSectionRemoveField}
                        onExportData={setCurrentCompanyContactData}
                      />
                      <SampleDataGrid
                        ref={sampleDataGridRef}
                        categorizedSections={{
                          collectedSampleDataInfo:
                            categorizedSections.collectedSampleDataInfo,
                        }}
                        onFieldChange={handleSectionFieldChange}
                        onRemoveField={handleSectionRemoveField}
                        onExportData={(sampleData, nonSampleData) => {
                          setCurrentSampleData(sampleData);
                          setCurrentNonSampleData(nonSampleData);
                        }}
                      />
                    </div>
                  ) : (
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
                        No categorized data available
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          margin: "0",
                        }}
                      >
                        Switch to Table View to see extracted fields
                      </p>
                    </div>
                  )
                ) : // Use SpreadsheetView if we have categorized sections, otherwise use EditableTable
                  categorizedSections.companyLocationInfo.length > 0 ||
                    categorizedSections.contactProjectInfo.length > 0 ||
                    categorizedSections.dataDeliverables.length > 0 ||
                    categorizedSections.containerInfo.length > 0 ||
                    categorizedSections.collectedSampleDataInfo.length > 0 ? (
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
              */}
            </div>

            <Button
              onClick={handleSend}
              disabled={extractedFields.length === 0 || sending}
              className="w-full h-12  justify-center items-center bg-[#3b82f6] text-white"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Loader className="mr-2 h-4 w-4 animate-spin text-white " />
                  Sending...
                </span>
              ) : (
                "Send"
              )}
            </Button>
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
              boxShadow: isResizing
                ? "0 0 8px rgba(59, 130, 246, 0.4)"
                : "none",
              borderLeft: "1px solid #e5e7eb",
              borderRight: "1px solid #e5e7eb",
              userSelect: "none",
              height: "100%",
            }}
            onMouseDown={handleResizerMouseDown}
            onTouchStart={handleResizerTouchStart}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isResizing
                ? "#3b82f6"
                : "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isResizing
                ? "#3b82f6"
                : "#d1d5db";
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

                  {/* Documents History button with dropdown */}

                </div>
                {/* Show NEW DOCUMENT button only when pdfUrl is set */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "file-input"
                      ) as HTMLInputElement;
                      if (fileInput) {
                        fileInput.value = "";
                        fileInput.click();
                      }
                    }}
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
                      disabled={fastData.length === 0}
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
                  <PDFDocument
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
                  </PDFDocument>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Upload className="mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
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
                  onClick={() => {
                    const fileInput = document.getElementById(
                      "file-input"
                    ) as HTMLInputElement;
                    if (fileInput) {
                      fileInput.value = "";
                      fileInput.click();
                    }
                  }}
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

      {/* OLD RESIZABLE PANEL GROUP - COMMENTED OUT - Using custom resizer now
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[200px] max-w-full rounded-lg border md:min-w-[450px]"
      >
        <ResizablePanel defaultSize={50} maxSize={60}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} maxSize={60}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup> */}

      <ConfirmationModal
        isOpen={showConfirmationModal}
        fields={extractedFields}
        onFieldChange={() => { }} // Dummy handler - old functionality commented out
        onRemoveField={() => { }} // Dummy handler - old functionality commented out
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
    </div>
  );
}
