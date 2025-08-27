import EditableTable from "@/components/table";
import { X } from "lucide-react";
import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  fields: any[];
  onFieldChange: (index: number, value: string) => void;
  onRemoveField: (index: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  fields,
  onFieldChange,
  onRemoveField,
  onClose,
  onConfirm,
  isSending,
}) => {
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
          borderRadius: "8px",
          padding: "20px",
          width: "80%",
          maxWidth: "600px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
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
          <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
            Confirm Data Submission and Document Upload
          </h3>
          <X onClick={onClose} />
        </div>
        {/* <p style={{ marginBottom: "16px", fontSize: "14px", color: "#6b7280" }}>
          Please review the data below before submitting it to the database.
        </p>

        <EditableTable
          fields={fields}
          onFieldChange={onFieldChange}
          onRemoveField={onRemoveField}
        /> */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#d1d5db",
              color: "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isSending ? "not-allowed" : "pointer",
            }}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
