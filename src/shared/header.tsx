import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ShowToast } from "./showToast";

interface HeaderProps {
  username: string;
  profile_image_uri?: string;
  handleMyDocuments?: () => void;
  myDocumentsButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({
  username,
  profile_image_uri,
  handleMyDocuments,
  myDocumentsButtonText,
}) => {
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
        // padding: "24px 32px",
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

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
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
                backgroundColor: "white",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                overflow: "hidden",
                zIndex: 10,
                minWidth: "160px",
              }}
            >
              <button
                onClick={handleMyDocuments}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  backgroundColor: "white",
                  border: "none",
                  fontSize: "14px",
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
                {myDocumentsButtonText || "Lab Documents"}
              </button>
              <button
                onClick={handleLogout}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  backgroundColor: "white",
                  border: "none",
                  fontSize: "14px",
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
