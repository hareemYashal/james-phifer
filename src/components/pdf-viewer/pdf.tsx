"use client";

import PDFViewer from "./pdf-viewer";
import { useEffect, useState } from "react";
import { fetchUserDetails } from "@/lib/actions/auth";
import Header from "@/shared/header";
import Loader from "../ui/loader";
import DocumentsViewer from "./documents-viewer";
import { Document } from "@/types";
import { useUserContext } from "@/context/user-context";
import { useRouter } from "next/navigation";
import UserManagement from "../user-management";
import LabManagement from "../lab-management";

interface User {
  name: string;
  avatar_url: string;
}

export default function PdfViewerClient() {
  const { role } = useUserContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActive] = useState<string>("pdfViewer");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await fetchUserDetails();
        if (!user) {
          console.error("User not authenticated");
          return;
        }
        setUser(user);
      } catch (error) {
        console.log("Error fetching user details:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
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

    if (user && activeTab === "documents") {
      fetchDocuments();
    }
  }, [user, activeTab]);

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {loading ? (
        <Loader />
      ) : (
        <>
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
            <Header
              username={user?.name || "Guest"}
              profile_image_uri={user?.avatar_url || ""}
              handleMyDocuments={() => setActive("documents")}
              showLabDocumentsButton={role === "admin" || role === "Admin"}
              handlePDFViewer={() => setActive("pdfViewer")}
              handleUserManagement={() => setActive("userManagement")}
              showUserManagementButton={role === "admin" || role === "Admin"}
              handleLabManagement={() => setActive("labManagement")}
              showLabManagementButton={role === "admin" || role === "Admin"}
              activeTab={activeTab}
            />
          </div>
          {activeTab === "documents" ? (
            <DocumentsViewer
              documents={documents}
              loading={isDocumentsLoading}
            />
          ) : activeTab === "userManagement" ? (
            <UserManagement />
          ) : activeTab === "labManagement" ? (
            <LabManagement />
          ) : (
            <PDFViewer />
          )}
        </>
      )}
    </div>
  );
}
