"use client";

import type React from "react";

import {useState} from "react";
import {Document, Page, pdfjs} from "react-pdf";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  FileText,
  Loader2,
} from "lucide-react";
import Header from "@/shared/header";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function DataEntryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotate, setRotate] = useState<number>(0);
  const [formData, setFormData] = useState<any>({});
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFieldKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Enter") {
      const next = document.getElementById(`field-${idx + 1}`);
      if (next) {
        next.scrollIntoView({behavior: "smooth", block: "center"});
        (next as HTMLInputElement).focus();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setPdfUrl(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        "https://064a-182-180-99-121.ngrok-free.app/process_document",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      setFormData(data.fields || {});
      setFields(Object.keys(data.fields || {}));
    } catch (err) {
      setFormData({});
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev: any) => ({...prev, [key]: value}));
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setPageNumber(1);
    setRotate(0);
  };
  const handleRotateLeft = () => setRotate((r) => (r - 90 + 360) % 360);
  const handleRotateRight = () => setRotate((r) => (r + 90) % 360);
  const handlePrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));

  const handleSendToLIMS = async () => {
    alert("Data and image would be sent to the database (not implemented)");
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "384px",
          minWidth: "384px",
          backgroundColor: "white",
          borderRight: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <Header />

        {/* File Upload */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
          }}
        >
          <label style={{display: "block"}}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "12px",
                display: "block",
              }}
            >
              Upload PDF Document
            </span>
            <div style={{position: "relative"}}>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "128px",
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                  transition: "all 0.2s",
                }}
              >
                <div style={{textAlign: "center"}}>
                  <Upload
                    size={32}
                    style={{color: "#9ca3af", margin: "0 auto 8px"}}
                  />
                  <p style={{fontSize: "14px", color: "#6b7280", margin: 0}}>
                    {file ? file.name : "Click to upload PDF"}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      margin: "4px 0 0 0",
                    }}
                  >
                    PDF files only
                  </p>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Data Fields */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <div style={{padding: "24px 24px 16px", flexShrink: 0}}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                margin: 0,
              }}
            >
              Extracted Data Fields
            </h2>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 24px",
              minHeight: 0,
            }}
          >
            {loading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 0",
                  color: "#6b7280",
                }}
              >
                <Loader2
                  size={32}
                  style={{
                    marginBottom: "12px",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{fontSize: "14px", margin: 0}}>Processing PDF...</p>
              </div>
            )}

            {!loading && fields.length > 0 && (
              <form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  paddingBottom: "24px",
                }}
              >
                {fields.map((key, idx) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        textTransform: "capitalize",
                      }}
                    >
                      {key.replace(/[_-]/g, " ")}
                    </label>
                    <input
                      id={`field-${idx}`}
                      type="text"
                      value={formData[key] || ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      onKeyDown={(e) => handleFieldKeyDown(e, idx)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                      }}
                      placeholder={`Enter ${key.replace(/[_-]/g, " ")}`}
                    />
                  </div>
                ))}
              </form>
            )}

            {!loading && fields.length === 0 && !file && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#9ca3af",
                }}
              >
                <FileText
                  size={48}
                  style={{margin: "0 auto 12px", opacity: 0.5}}
                />
                <p style={{fontSize: "14px", margin: 0}}>
                  Upload a PDF to extract data fields
                </p>
              </div>
            )}

            {!loading && fields.length === 0 && file && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#9ca3af",
                }}
              >
                <p style={{fontSize: "14px", margin: 0}}>
                  No extractable fields found in this PDF
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Send Button Section */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            flexShrink: 0,
          }}
        >
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            <button
              onClick={handleSendToLIMS}
              disabled={fields.length === 0}
              style={{
                width: "100%",
                background:
                  fields.length > 0
                    ? "linear-gradient(to right, #059669, #047857)"
                    : "linear-gradient(to right, #9ca3af, #6b7280)",
                color: "white",
                fontWeight: "600",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: fields.length > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                transition: "all 0.2s",
                fontSize: "16px",
              }}
            >
              <Send size={18} />
              <span>
                {fields.length > 0 ? "Send to LIMS" : "No Data Available"}
              </span>
            </button>

            {fields.length > 0 && (
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(formData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "extracted-data.json";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                  color: "white",
                  fontWeight: "500",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.1)",
                  transition: "all 0.2s",
                  fontSize: "14px",
                }}
              >
                <FileText size={16} />
                <span>Export Data</span>
              </button>
            )}

            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textAlign: "center",
                marginTop: "8px",
              }}
            >
              {fields.length > 0
                ? `${fields.length} fields extracted`
                : "Upload PDF to extract data"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f1f5f9",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid #e2e8f0",
            padding: "16px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "1024px",
              margin: "0 auto",
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                PDF Viewer
              </h2>
              {pdfUrl && (
                <div style={{fontSize: "14px", color: "#6b7280"}}>
                  Scale: {Math.round(scale * 100)}%
                </div>
              )}
            </div>

            {pdfUrl && (
              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "8px",
                    padding: "4px",
                  }}
                >
                  <button
                    onClick={handleZoomOut}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} color="#4b5563" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} color="#4b5563" />
                  </button>
                  <div
                    style={{
                      width: "1px",
                      height: "24px",
                      backgroundColor: "#d1d5db",
                      margin: "0 4px",
                    }}
                  />
                  <button
                    onClick={handleRotateLeft}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    title="Rotate Left"
                  >
                    <RotateCcw size={16} color="#4b5563" />
                  </button>
                  <button
                    onClick={handleRotateRight}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    title="Rotate Right"
                  >
                    <RotateCw size={16} color="#4b5563" />
                  </button>
                  <div
                    style={{
                      width: "1px",
                      height: "24px",
                      backgroundColor: "#d1d5db",
                      margin: "0 4px",
                    }}
                  />
                  <button
                    onClick={handleReset}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    title="Reset View"
                  >
                    <RefreshCw size={16} color="#4b5563" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PDF Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            minHeight: 0,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              border: "1px solid #e2e8f0",
              overflow: "auto",
              maxWidth: "1024px",
              width: "100%",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: pdfUrl && numPages > 1 ? "24px" : "0",
            }}
          >
            {pdfUrl ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  padding: "16px",
                }}
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({numPages}) => setNumPages(numPages)}
                  loading={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "80px 0",
                        color: "#6b7280",
                      }}
                    >
                      <Loader2
                        size={32}
                        style={{
                          marginBottom: "12px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <p style={{fontSize: "14px", margin: 0}}>
                        Loading PDF...
                      </p>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotate}
                      width={600}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                </Document>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  color: "#9ca3af",
                }}
              >
                <FileText
                  size={64}
                  style={{margin: "0 auto 16px", opacity: 0.5}}
                />
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    margin: "0 0 8px 0",
                  }}
                >
                  No PDF Selected
                </p>
                <p style={{fontSize: "14px", margin: 0}}>
                  Upload a PDF document to begin viewing
                </p>
              </div>
            )}
          </div>

          {/* Page Navigation - Fixed Position */}
          {pdfUrl && numPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                border: "1px solid #e2e8f0",
                padding: "12px 16px",
                maxWidth: "1024px",
                width: "100%",
                flexShrink: 0,
              }}
            >
              <button
                onClick={handlePrevPage}
                disabled={pageNumber === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: pageNumber === 1 ? "not-allowed" : "pointer",
                  opacity: pageNumber === 1 ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                <span>Page</span>
                <span style={{fontWeight: "600", color: "#1f2937"}}>
                  {pageNumber}
                </span>
                <span>of</span>
                <span style={{fontWeight: "600", color: "#1f2937"}}>
                  {numPages}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={pageNumber === numPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: pageNumber === numPages ? "not-allowed" : "pointer",
                  opacity: pageNumber === numPages ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
