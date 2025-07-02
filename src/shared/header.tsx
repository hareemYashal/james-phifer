import {FileText} from "lucide-react";
import React from "react";

const Header = () => {
  return (
    <div
      style={{
        padding: "24px",
        borderBottom: "1px solid #e2e8f0",
        background: "linear-gradient(to right, #2563eb, #1d4ed8)",
        color: "white",
        flexShrink: 0,
      }}
    >
      <div style={{display: "flex", alignItems: "center"}}>
        <div
          style={{
            padding: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            marginRight: "12px",
          }}
        >
          <FileText size={24} />
        </div>
        <div>
          <h1 style={{fontSize: "20px", fontWeight: "bold", margin: 0}}>
            Document Processor
          </h1>
          <p style={{color: "#bfdbfe", fontSize: "14px", margin: "4px 0 0 0"}}>
            PDF Data Entry System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
