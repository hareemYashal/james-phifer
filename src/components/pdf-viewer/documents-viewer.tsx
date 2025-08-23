import { Document, Field } from "@/types";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import React, { useState } from "react";
import EditableTable from "../table";
import Loader from "../ui/loader";

function DocumentsViewer({
  documents,
  loading,
}: {
  documents: Document[];
  loading?: boolean;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  console.log(documents);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
  };

  return (
    <div style={{ display: "flex", height: "80vh", backgroundColor: "#fff" }}>
      <div
        style={{
          width: isSidebarOpen ? "30%" : "0",
          transition: "width 0.3s ease",
          overflow: "hidden",
          backgroundColor: "#f8fafc",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {loading ? (
          <div
            style={{
              maxHeight: "80vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Loader />
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "12px 16px",
                fontSize: "12px",
                fontWeight: "600",
                color: "white",
                backgroundColor: "#3b82f6",
              }}
            >
              <h3 style={{ textAlign: "center", margin: 0 }}>Documents</h3>
            </div>
            <button
              onClick={toggleSidebar}
              style={{
                position: "absolute",
                left: !isSidebarOpen ? "20px" : "29.5%",
                zIndex: 10,
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "5px 7px",
                borderRadius: "100%",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "left 0.3s",
              }}
            >
              {!isSidebarOpen ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>

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
                      backgroundColor:
                        selectedDocument?.id === doc.id
                          ? "#e2e8f0"
                          : "transparent",
                      borderRadius: "4px",
                      marginBottom: "8px",
                    }}
                  >
                    COC Document - {doc.id}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>

      <div
        style={{
          flex: 1,
          width: isSidebarOpen ? "70%" : "100%",
          padding: "16px",
          backgroundColor: "white",
          justifyContent: selectedDocument ? "flex-start" : "center",
          alignItems: "center",
          display: selectedDocument ? "inline" : "flex",
          flexDirection: "column",
          marginLeft: "2%",
        }}
      >
        {selectedDocument ? (
          <div>
            <h2>{selectedDocument.id}</h2>
            <EditableTable
              fields={selectedDocument.data as Field[]}
              editable={false}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
            }}
          >
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
              No Document Selected
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0",
              }}
            >
              Please select a document from the sidebar to view its details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsViewer;
