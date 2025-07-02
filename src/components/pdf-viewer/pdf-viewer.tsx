"use client"

import type React from "react"
import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
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
  Download,
  Settings,
  Eye,
} from "lucide-react"
import Header from "@/shared/header"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

const buttonStyles = {
  primary: {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  secondary: {
    backgroundColor: "white",
    color: "#374151",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  disabled: {
    backgroundColor: "#9ca3af",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: 0.6,
  },
}

const cardStyles = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
}

export default function PDFDataExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(1)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotate, setRotate] = useState<number>(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Enter") {
      const next = document.getElementById(`field-${idx + 1}`)
      if (next) {
        next.scrollIntoView({ behavior: "smooth", block: "center" })
        ;(next as HTMLInputElement).focus()
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPdfUrl(URL.createObjectURL(selectedFile))
    setLoading(true)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch("https://064a-182-180-99-121.ngrok-free.app/process_document", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setFormData(data.fields || {})
      setFields(Object.keys(data.fields || {}))
    } catch (err) {
      console.error("Error processing document:", err)
      setFormData({})
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5))
  const handleReset = () => {
    setScale(1)
    setPageNumber(1)
    setRotate(0)
  }

  const handleRotateLeft = () => setRotate((r) => (r - 90 + 360) % 360)
  const handleRotateRight = () => setRotate((r) => (r + 90) % 360)
  const handlePrevPage = () => setPageNumber((p) => Math.max(1, p - 1))
  const handleNextPage = () => setPageNumber((p) => Math.min(numPages, p + 1))

  const handleSendToLIMS = async () => {
    alert("Data and image would be sent to the database (not implemented)")
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "extracted-data.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Header />

      <div style={{ display: "flex", height: "calc(100vh - 140px)" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "400px",
            minWidth: "400px",
            backgroundColor: "white",
            borderRight: "1px solid #e5e7eb",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* File Upload Section */}
          <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb" }}>
            <div
              style={{
                ...cardStyles,
                border: "2px dashed #3b82f6",
                backgroundColor: "#eff6ff",
              }}
            >
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <Upload size={20} style={{ color: "#3b82f6" }} />
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1f2937",
                      margin: 0,
                    }}
                  >
                    Upload PDF Document
                  </h3>
                </div>

                <div style={{ position: "relative" }}>
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
                      zIndex: 10,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "120px",
                      padding: "24px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "2px dashed #93c5fd",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Upload size={32} style={{ color: "#3b82f6", marginBottom: "12px" }} />
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      {file ? file.name : "Click to upload PDF or drag & drop"}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                        margin: 0,
                      }}
                    >
                      PDF files only • Max 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Fields Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <Settings size={20} style={{ color: "#059669" }} />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                Extracted Data Fields
              </h3>
              {fields.length > 0 && (
                <span
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginLeft: "auto",
                  }}
                >
                  {fields.length} fields
                </span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
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
                    textAlign: "center",
                  }}
                >
                  <Loader2
                    size={40}
                    style={{
                      color: "#3b82f6",
                      marginBottom: "16px",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Processing PDF...
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Extracting data fields
                  </p>
                </div>
              )}

              {!loading && fields.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {fields.map((key, idx) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label
                        htmlFor={`field-${idx}`}
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          textTransform: "capitalize",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "50%",
                          }}
                        ></div>
                        {key.replace(/[_-]/g, " ")}
                      </label>
                      <input
                        id={`field-${idx}`}
                        type="text"
                        value={formData[key] || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, idx)}
                        placeholder={`Enter ${key.replace(/[_-]/g, " ")}`}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6"
                          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#d1d5db"
                          e.target.style.boxShadow = "none"
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {!loading && fields.length === 0 && !file && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <FileText size={32} style={{ color: "#9ca3af" }} />
                  </div>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1f2937",
                      margin: "0 0 8px 0",
                    }}
                  >
                    No Document Uploaded
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Upload a PDF to extract data fields automatically
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: "24px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleSendToLIMS}
                disabled={fields.length === 0}
                style={
                  fields.length > 0
                    ? {
                        ...buttonStyles.primary,
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        width: "100%",
                        justifyContent: "center",
                      }
                    : {
                        ...buttonStyles.disabled,
                        width: "100%",
                        justifyContent: "center",
                      }
                }
              >
                <Send size={18} />
                {fields.length > 0 ? "Send to LIMS Database" : "No Data Available"}
              </button>

              {fields.length > 0 && (
                <button
                  onClick={handleExportData}
                  style={{
                    ...buttonStyles.secondary,
                    width: "100%",
                    justifyContent: "center",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    borderColor: "#93c5fd",
                  }}
                >
                  <Download size={16} />
                  Export Data as JSON
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8fafc",
         overflow:'auto'
          }}
        >
          {/* PDF Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px",
            }}
          >
            <div
              style={{
                ...cardStyles,
                width: "100%",
                maxWidth: "1200px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "32px",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pdfUrl ? (
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "80px 0",
                          textAlign: "center",
                        }}
                      >
                        <Loader2
                          size={48}
                          style={{
                            color: "#3b82f6",
                            marginBottom: "24px",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#1f2937",
                            margin: "0 0 8px 0",
                          }}
                        >
                          Loading PDF Document
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          Please wait while we prepare your document...
                        </p>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotate}
                      width={Math.min(800, window.innerWidth - 500)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "80px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "96px",
                        height: "96px",
                        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                      }}
                    >
                      <Eye size={48} style={{ color: "#3b82f6" }} />
                    </div>
                    <h2
                      style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "#1f2937",
                        margin: "0 0 12px 0",
                      }}
                    >
                      PDF Viewer Ready
                    </h2>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#6b7280",
                        margin: "0 0 24px 0",
                        maxWidth: "400px",
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    >
                      Upload a PDF document from the sidebar to begin viewing and extracting data
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "24px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#10b981",
                            borderRadius: "50%",
                          }}
                        ></div>
                        Zoom & Rotate
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "50%",
                          }}
                        ></div>
                        Multi-page Support
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#8b5cf6",
                            borderRadius: "50%",
                          }}
                        ></div>
                        Data Extraction
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Controls - Bottom */}
            {pdfUrl && (
              <div
                style={{
                  ...cardStyles,
                  width: "100%",
                  maxWidth: "1200px",
                  marginTop: "24px",
                }}
              >
                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Page Navigation */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {numPages > 1 && (
                        <>
                          <button
                            onClick={handlePrevPage}
                            disabled={pageNumber === 1}
                            style={{
                              ...buttonStyles.secondary,
                              opacity: pageNumber === 1 ? 0.5 : 1,
                              cursor: pageNumber === 1 ? "not-allowed" : "pointer",
                            }}
                          >
                            <ChevronLeft size={16} />
                            Previous
                          </button>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 16px",
                              backgroundColor: "#f3f4f6",
                              borderRadius: "8px",
                            }}
                          >
                            <span style={{ fontSize: "14px", color: "#6b7280" }}>Page</span>
                            <span
                              style={{
                                backgroundColor: "white",
                                color: "#374151",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontWeight: "600",
                                border: "1px solid #d1d5db",
                              }}
                            >
                              {pageNumber}
                            </span>
                            <span style={{ fontSize: "14px", color: "#6b7280" }}>of</span>
                            <span
                              style={{
                                backgroundColor: "white",
                                color: "#374151",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontWeight: "600",
                                border: "1px solid #d1d5db",
                              }}
                            >
                              {numPages}
                            </span>
                          </div>

                          <button
                            onClick={handleNextPage}
                            disabled={pageNumber === numPages}
                            style={{
                              ...buttonStyles.secondary,
                              opacity: pageNumber === numPages ? 0.5 : 1,
                              cursor: pageNumber === numPages ? "not-allowed" : "pointer",
                            }}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Scale Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Scale: {Math.round(scale * 100)}%
                      </span>
                      {rotate !== 0 && (
                        <span
                          style={{
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          Rotated: {rotate}°
                        </span>
                      )}
                    </div>

                    {/* Controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "8px",
                        padding: "4px",
                      }}
                    >
                      <button
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        style={{
                          ...buttonStyles.secondary,
                          padding: "8px",
                          border: "none",
                          backgroundColor: "transparent",
                        }}
                      >
                        <ZoomOut size={16} />
                      </button>
                      <button
                        onClick={handleZoomIn}
                        title="Zoom In"
                        style={{
                          ...buttonStyles.secondary,
                          padding: "8px",
                          border: "none",
                          backgroundColor: "transparent",
                        }}
                      >
                        <ZoomIn size={16} />
                      </button>
                      <div
                        style={{
                          width: "1px",
                          height: "24px",
                          backgroundColor: "#d1d5db",
                          margin: "0 4px",
                        }}
                      ></div>
                      <button
                        onClick={handleRotateLeft}
                        title="Rotate Left"
                        style={{
                          ...buttonStyles.secondary,
                          padding: "8px",
                          border: "none",
                          backgroundColor: "transparent",
                        }}
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={handleRotateRight}
                        title="Rotate Right"
                        style={{
                          ...buttonStyles.secondary,
                          padding: "8px",
                          border: "none",
                          backgroundColor: "transparent",
                        }}
                      >
                        <RotateCw size={16} />
                      </button>
                      <div
                        style={{
                          width: "1px",
                          height: "24px",
                          backgroundColor: "#d1d5db",
                          margin: "0 4px",
                        }}
                      ></div>
                      <button
                        onClick={handleReset}
                        title="Reset View"
                        style={{
                          ...buttonStyles.secondary,
                          padding: "8px",
                          border: "none",
                          backgroundColor: "transparent",
                        }}
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
