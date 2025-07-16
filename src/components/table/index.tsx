import { Field } from "@/types";
import React from "react";

interface EditableTableProps {
  fields: Field[];
  onFieldChange?: (index: number, value: string) => void;
  onRemoveField?: (index: number) => void;
  editable?: boolean;
}

const EditableTable: React.FC<EditableTableProps> = ({
  fields,
  onFieldChange,
  onRemoveField,
  editable = true,
}) => {
  return (
    <div
      style={{
        overflowX: "auto",
        marginTop: "16px",
        maxHeight: "55vh",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "12px",
                borderBottom: "2px solid #e5e7eb",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                backgroundColor: "#f3f4f6",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Key
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "12px",
                borderBottom: "2px solid #e5e7eb",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                backgroundColor: "#f3f4f6",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Value
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "12px",
                borderBottom: "2px solid #e5e7eb",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                backgroundColor: "#f3f4f6",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Confidence
            </th>
            {editable && (
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderBottom: "2px solid #e5e7eb",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  backgroundColor: "#f3f4f6",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id}>
              <td
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                {field.displayName || field.key}
              </td>
              <td
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="text"
                  value={field.value}
                  disabled={!editable}
                  onChange={(e) => onFieldChange?.(index, e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "6px",
                    fontSize: "14px",
                    outline: "none",
                    minWidth: editable ? "200px" : "300px",
                  }}
                />
              </td>
              <td
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                {Math.round(field.confidence * 100)}%
              </td>
              {editable && (
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#ef4444",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => onRemoveField?.(index)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#dc2626")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ef4444")
                    }
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
