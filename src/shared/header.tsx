import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ShowToast } from "./showToast";

interface HeaderProps {
  username: string;
  profile_image_uri?: string;
  handleMyDocuments?: () => void;
  showLabDocumentsButton?: boolean;
  showUserManagementButton?: boolean;
  handleUserManagement?: () => void;
  handleLabManagement?: () => void;
  showLabManagementButton?: boolean;
  handlePDFViewer?: () => void;
  activeTab?: string;
}

const Header: React.FC<HeaderProps> = ({
  username,
  profile_image_uri,
  handleMyDocuments,
  showLabDocumentsButton = false,
  handleUserManagement,
  showUserManagementButton = false,
  handleLabManagement,
  showLabManagementButton = false,
  handlePDFViewer,
  activeTab,
}) => {
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };

    if (dropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("access_token");
      router.replace("/login");
      await supabase.auth.signOut();
    } catch (error) {
      ShowToast("Error during logout. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <Image
            src="/logo1.jpg"
            alt="Phifer Consulting Logo"
            width={200}
            height={100}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>

      {/* Desktop Navigation */}
      {!isMobile && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          flex: 1,
          justifyContent: "center"
        }}>
          <button
            onClick={handlePDFViewer}
            style={{
              padding: "8px 16px",
              border: "none",
              backgroundColor: activeTab === "pdfViewer" ? "#e5e7eb" : "transparent",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              cursor: "pointer",
              borderRadius: "6px",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = activeTab === "pdfViewer" ? "#e5e7eb" : "#f3f4f6")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = activeTab === "pdfViewer" ? "#e5e7eb" : "transparent")
            }
          >
            PDF Viewer
          </button>

          {showLabDocumentsButton && (
            <button
              onClick={handleMyDocuments}
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: activeTab === "documents" ? "#e5e7eb" : "transparent",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                borderRadius: "6px",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "documents" ? "#e5e7eb" : "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "documents" ? "#e5e7eb" : "transparent")
              }
            >
              Lab Documents
            </button>
          )}

          {showLabManagementButton && (
            <button
              onClick={handleLabManagement}
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: activeTab === "labManagement" ? "#e5e7eb" : "transparent",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                borderRadius: "6px",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "labManagement" ? "#e5e7eb" : "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "labManagement" ? "#e5e7eb" : "transparent")
              }
            >
              Lab Management
            </button>
          )}

          {showUserManagementButton && (
            <button
              onClick={handleUserManagement}
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: activeTab === "userManagement" ? "#e5e7eb" : "transparent",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                borderRadius: "6px",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "userManagement" ? "#e5e7eb" : "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = activeTab === "userManagement" ? "#e5e7eb" : "transparent")
              }
            >
              User Management
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          ref={dropdownRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            position: "relative",
          }}
          onClick={toggleDropdown}
        >
          <Image
            src={profile_image_uri || "/user.png"}
            alt="User Icon"
            width={40}
            height={40}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #e5e7eb",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            {username}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: "#6b7280",
              transition: "transform 0.2s ease",
              transform: dropdownVisible ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />

          {/* Dropdown Menu */}
          {dropdownVisible && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                backgroundColor: "white",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                borderRadius: "8px",
                overflow: "hidden",
                zIndex: 10,
                minWidth: "160px",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Mobile: Show all navigation items */}
              {isMobile && (
                <>
                  <button
                    onClick={handlePDFViewer}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                      backgroundColor:
                        activeTab === "pdfViewer" ? "#e5e7eb" : "white",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      activeTab === "pdfViewer" ? "#e5e7eb" : "white")
                    }
                  >
                    PDF Viewer
                  </button>

                  {showLabDocumentsButton && (
                    <button
                      onClick={handleMyDocuments}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        backgroundColor:
                          activeTab === "documents" ? "#e5e7eb" : "white",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f3f4f6")
                      }
                      onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        activeTab === "documents" ? "#e5e7eb" : "white")
                      }
                    >
                      Lab Documents
                    </button>
                  )}

                  {showLabManagementButton && (
                    <button
                      onClick={handleLabManagement}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        backgroundColor:
                          activeTab === "labManagement" ? "#e5e7eb" : "white",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f3f4f6")
                      }
                      onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        activeTab === "labManagement" ? "#e5e7eb" : "white")
                      }
                    >
                      Lab Management
                    </button>
                  )}

                  {showUserManagementButton && (
                    <button
                      onClick={handleUserManagement}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        backgroundColor:
                          activeTab === "userManagement" ? "#e5e7eb" : "white",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f3f4f6")
                      }
                      onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        activeTab === "userManagement" ? "#e5e7eb" : "white")
                      }
                    >
                      User Management
                    </button>
                  )}

                  {/* Separator for mobile */}
                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "#e5e7eb",
                      margin: "4px 0",
                    }}
                  />
                </>
              )}

              {/* Logout button (always shown) */}
              <button
                onClick={handleLogout}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  backgroundColor: "white",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
