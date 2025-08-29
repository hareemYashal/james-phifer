"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from "react-pdf";
import {
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    RotateCw,
    RefreshCw,
    FileText,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Import,
    Send,
} from "lucide-react";
import { CompanyContactGrid } from "@/components/grid-tables/company-contact-grid/company-contact-grid";
import { SampleDataGrid } from "@/components/grid-tables/sample-data-grid/sample-data-grid";
import { ShowToast } from "@/shared/showToast";
import ConfirmationModal from "@/shared/DataConfirmationModal";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface DocumentData {
    id: string;
    companyContactData: any[];
    sampleData: any[];
    nonSampleData: any[];
    originalExtractedFields: any[];
    categorizedSections: {
        companyLocationInfo: any[];
        contactProjectInfo: any[];
        dataDeliverables: any[];
        containerInfo: any[];
        collectedSampleDataInfo: any[];
    };
    url: string;
    created_at: string;
}

export default function DocumentViewerPage() {
    const params = useParams();
    const router = useRouter();
    const [documentData, setDocumentData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // PDF viewer states (copied from original)
    const [numPages, setNumPages] = useState<number>(1);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.2);
    const [rotate, setRotate] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<"keyvalue">("keyvalue");
    const [isDragging, setIsDragging] = useState(false);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

    // Resizer states (copied from original)
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
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

    // Refs to trigger export from grids
    const companyContactGridRef = useRef<{ handleExportData: () => void; getCurrentData: () => any[] }>(null);
    const sampleDataGridRef = useRef<{ handleExportData: () => void; getCurrentData: () => { sampleData: any[]; nonSampleData: any[] } }>(null);

    // State for send functionality
    const [sending, setSending] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const documentId = params.id as string;

    // Fetch document data
    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("access_token");

                if (!token) {
                    setError("Access token not found");
                    return;
                }

                const response = await fetch(`/api/documents/${documentId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to fetch document");
                    return;
                }

                const data = await response.json();
                setDocumentData(data.document);
            } catch (error) {
                console.error("Error fetching document:", error);
                setError("Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        if (documentId) {
            fetchDocument();
        }
    }, [documentId]);

    // Mouse handlers for PDF dragging (copied from original)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!pdfViewerRef.current) return;
        setIsDragging(true);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            scrollLeft: pdfViewerRef.current.scrollLeft,
            scrollTop: pdfViewerRef.current.scrollTop,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart || !pdfViewerRef.current) return;
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        pdfViewerRef.current.scrollLeft = dragStart.scrollLeft - deltaX;
        pdfViewerRef.current.scrollTop = dragStart.scrollTop - deltaY;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    // Resizer handlers (copied from original)
    const handleResizerMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStartX(e.clientX);
        setResizeStartWidth(leftPanelWidth);

        const handleMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            const deltaX = moveEvent.clientX - e.clientX;
            const containerWidth = window.innerWidth;
            const deltaPercentage = (deltaX / containerWidth) * 100;
            let newWidth = leftPanelWidth + deltaPercentage;
            newWidth = Math.max(15, Math.min(60, newWidth));
            setLeftPanelWidth(newWidth);
        };

        const handleUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseup", handleUp);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleUp);
    };

    // PDF controls (copied from original)
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

    const handleGoBack = () => {
        router.push("/pdf-viewer");
    };

    // Export functionality
    const handleExport = () => {
        let companyData: any[] = [];
        let sampleData: any[] = [];
        let nonSampleData: any[] = [];

        // Get data DIRECTLY from grids without any async delays
        if (companyContactGridRef.current?.getCurrentData) {
            companyData = companyContactGridRef.current.getCurrentData();
        }

        if (sampleDataGridRef.current?.getCurrentData) {
            const sampleGridData = sampleDataGridRef.current.getCurrentData();
            sampleData = sampleGridData.sampleData;
            nonSampleData = sampleGridData.nonSampleData;
        }

        // Export IMMEDIATELY - LIGHTYEAR SPEED!
        if (companyData.length > 0 || sampleData.length > 0 || nonSampleData.length > 0) {
            exportGridDataToCSV(companyData, sampleData, nonSampleData);
            ShowToast("Grid data exported to CSV successfully!", "success");
        } else {
            ShowToast("No data available to export", "error");
        }
    };

    // Function to export current grid data to CSV
    const exportGridDataToCSV = (companyContactData: any[], sampleData: any[], nonSampleData: any[]) => {
        let csvContent = '';

        // Export Company Contact Grid Data (all 4 sections combined)
        if (companyContactData.length > 0) {
            csvContent += 'COMPANY & CONTACT DETAILS WITH DATA DELIVERABLES AND CONTAINER INFORMATION\n';
            csvContent += 'Field Name,Value,Confidence,Section\n';

            companyContactData.forEach((item: any) => {
                const confidence = item.confidence ? Math.round(item.confidence * 100) + '%' : '';
                csvContent += `"${item.fieldName}","${item.value}","${confidence}","${item.section}"\n`;
            });
            csvContent += '\n';
        }

        // Export Non-Sample Fields (General Information)
        if (nonSampleData.length > 0) {
            csvContent += 'GENERAL INFORMATION\n';
            csvContent += 'Field Name,Value,Confidence\n';

            nonSampleData.forEach((item: any) => {
                const confidence = item.confidence ? Math.round(item.confidence * 100) + '%' : '';
                csvContent += `"${item.fieldName}","${item.value}","${confidence}"\n`;
            });
            csvContent += '\n';
        }

        // Export Sample Data Grid
        if (sampleData.length > 0) {
            csvContent += 'SAMPLE DATA INFORMATION\n';
            csvContent += 'Customer Sample ID,Matrix,Grab,Composite Start Date,Composite Start Time,Method\n';

            sampleData.forEach((item: any) => {
                csvContent += `"${item.customerSampleId || ''}","${item.matrix || ''}","${item.grab || ''}","${item.compositeStartDate || ''}","${item.compositeStartTime || ''}","${item.method || ''}"\n`;
            });
        }

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `document_${documentId}_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Send functionality
    const handleSend = () => {
        setShowConfirmationModal(true);
    };

    const handleCancelSend = () => {
        setShowConfirmationModal(false);
    };

    const handleConfirmSend = async () => {
        setSending(true);
        try {
            const token = localStorage.getItem("access_token");

            // Collect latest data from both AG grids
            let companyContactData: any[] = [];
            let sampleData: any[] = [];
            let nonSampleData: any[] = [];

            // Get current data from Company Contact Grid
            if (companyContactGridRef.current?.getCurrentData) {
                companyContactData = companyContactGridRef.current.getCurrentData();
            }

            // Get current data from Sample Data Grid
            if (sampleDataGridRef.current?.getCurrentData) {
                const sampleGridData = sampleDataGridRef.current.getCurrentData();
                sampleData = sampleGridData.sampleData;
                nonSampleData = sampleGridData.nonSampleData;
            }

            // Prepare the data payload with latest grid data
            const gridData = {
                companyContactData,
                sampleData,
                nonSampleData,
                originalExtractedFields: documentData?.originalExtractedFields || [],
                categorizedSections: documentData?.categorizedSections || {},
            };

            const formData = new FormData();
            formData.append("fields", JSON.stringify(gridData));

            const res = await fetch(`/api/documents/${documentId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await res.json();
            if (result.success) {
                ShowToast("Document updated successfully!", "success");
                setShowConfirmationModal(false);

                // Refresh document data
                const response = await fetch(`/api/documents/${documentId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setDocumentData(data.document);
                }
            } else {
                ShowToast("Error: " + result.error, "error");
            }
        } catch (err) {
            ShowToast(`${err || "Error occurred while updating document"}`, "error");
        } finally {
            setSending(false);
        }
    };

    // Clean up event listeners on component unmount (copied from original)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error || !documentData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Document Not Found
                    </h1>
                    <p className="text-gray-600 mb-6">{error || "The document could not be loaded."}</p>
                    <button
                        onClick={handleGoBack}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 inline" />
                        Back to PDF Viewer
                    </button>
                </div>
            </div>
        );
    }

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
                            }}
                        >
                            {[{ key: "keyvalue", label: `COC Document - ${documentData.id}` }].map((tab) => (
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
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <button
                                onClick={handleGoBack}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                }}
                            >
                                <ArrowLeft size={14} />
                                Back to PDF Viewer
                            </button>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                                >
                                    <Import size={16} />
                                    Export to Excel
                                </button>
                            </div>
                        </div>

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
                            {documentData.categorizedSections ? (
                                <div className="space-y-6">
                                    <CompanyContactGrid
                                        ref={companyContactGridRef}
                                        categorizedSections={{
                                            companyLocationInfo: documentData.categorizedSections.companyLocationInfo,
                                            contactProjectInfo: documentData.categorizedSections.contactProjectInfo,
                                            dataDeliverables: documentData.categorizedSections.dataDeliverables,
                                            containerInfo: documentData.categorizedSections.containerInfo,
                                        }}
                                    // Read-only mode - no change handlers
                                    />
                                    <SampleDataGrid
                                        ref={sampleDataGridRef}
                                        categorizedSections={{
                                            collectedSampleDataInfo: documentData.categorizedSections.collectedSampleDataInfo,
                                        }}
                                    // Read-only mode - no change handlers
                                    />
                                </div>
                            ) : (
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
                                        No Document Data
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: "0",
                                        }}
                                    >
                                        No structured data available for this document
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            style={{
                                width: "100%",
                                height: "48px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                marginTop: "16px",
                            }}
                            disabled={sending}
                        >
                            {sending ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    Updating...
                                </span>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Update Document
                                </>
                            )}
                        </button>
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
                                pointerEvents: "none",
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
                        width: isPanelCollapsed ? "100%" : `${100 - leftPanelWidth - 0.6}%`,
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {/* Zoom and Rotate Controls */}
                        {documentData.url ? (
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

                                {/* Page Navigation */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={pageNumber <= 1}
                                        style={{
                                            padding: "6px",
                                            backgroundColor: pageNumber <= 1 ? "#f3f4f6" : "white",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "4px",
                                            cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            color: pageNumber <= 1 ? "#9ca3af" : "#374151",
                                        }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: "0 8px",
                                        }}
                                    >
                                        {pageNumber} / {numPages}
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={pageNumber >= numPages}
                                        style={{
                                            padding: "6px",
                                            backgroundColor: pageNumber >= numPages ? "#f3f4f6" : "white",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "4px",
                                            cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            color: pageNumber >= numPages ? "#9ca3af" : "#374151",
                                        }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
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
                            overflow: "hidden",
                        }}
                    >
                        {documentData.url ? (
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
                                        cursor: isDragging ? "grabbing" : "grab",
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <PDFDocument
                                        file={documentData.url}
                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                        loading={
                                            <div style={{ padding: "40px", textAlign: "center" }}>
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
                                <FileText className="mb-4 text-gray-400" size={48} />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    No PDF Available
                                </h3>
                                <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px 0" }}>
                                    This document doesn't have an associated PDF file
                                </p>
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
      `}</style>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmationModal}
                fields={documentData?.originalExtractedFields || []}
                onFieldChange={() => { }} // No-op for read-only
                onRemoveField={() => { }} // No-op for read-only
                onClose={handleCancelSend}
                onConfirm={handleConfirmSend}
                isSending={sending}
            />
        </div>
    );
}