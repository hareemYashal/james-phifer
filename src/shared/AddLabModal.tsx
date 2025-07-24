import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShowToast } from "./showToast";
import { X } from "lucide-react";

interface AddLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabAdded: () => void;
}

const AddLabModal: React.FC<AddLabModalProps> = ({
  isOpen,
  onClose,
  onLabAdded,
}) => {
  const [labName, setLabName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAddLab = async () => {
    if (!labName) {
      alert("Please enter a lab name.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("labs").insert([{ name: labName }]);
      if (error) {
        console.error("Error adding lab:", error);
        ShowToast("Error adding lab. Please try again.");
      } else {
        ShowToast("Lab added successfully!");
        setLabName("");
        onLabAdded();
        onClose();
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLabName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: 0 }}>Add Lab</h3>
          <X onClick={handleClose} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Lab Name
          </label>
          <input
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            style={{
              width: "95%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={handleAddLab}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLabModal;
