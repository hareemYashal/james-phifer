import { Field } from "@/types";
import React from "react";
import { formatEntityTypeToDisplayName } from "@/lib/utils";

// Sample Data Table Component for Collected Sample Data Information
const SampleDataTable: React.FC<{
  items: any[];
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  editable?: boolean;
}> = ({ items, onFieldChange, onRemoveField, editable = true }) => {
  // Group items by sample number (1-10) and separate non-sample fields
  const groupedSamples: Record<string, any> = {};
  const nonSampleFields: any[] = [];

  items.forEach((item, index) => {
    const type = item.type;
    let sampleNumber = '';

    // Extract sample number from field type
    if (type.includes('customer_sample_id_')) {
      const match = type.match(/customer_sample_id_(\d+)(?:_.*)?/);
      if (match) {
        sampleNumber = match[1];
      }
    } else if (type.includes('sample_id_')) {
      const match = type.match(/sample_id_(\d+)_/);
      if (match) {
        sampleNumber = match[1];
      }
    } else if (type.includes('analysis_request_')) {
      const match = type.match(/analysis_request_(\d+)/);
      if (match) {
        sampleNumber = match[1];
      }
    } else {
      // Handle non-sample specific fields like collected_name, collector_signature
      nonSampleFields.push({ ...item, originalIndex: index });
    }

    if (sampleNumber) {
      if (!groupedSamples[sampleNumber]) {
        groupedSamples[sampleNumber] = {};
      }
      groupedSamples[sampleNumber][type] = { ...item, originalIndex: index };
    }
  });

  const sampleNumbers = Object.keys(groupedSamples).sort((a, b) => parseInt(a) - parseInt(b));

  // Don't render anything if there's no data at all
  if (nonSampleFields.length === 0 && sampleNumbers.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: "80px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
    }}>
      {/* Section Header */}
      <div style={{
        backgroundColor: "#f8fafc",
        padding: "12px 16px",
        borderBottom: "2px solid #e5e7eb",
        borderTopLeftRadius: "6px",
        borderTopRightRadius: "6px"
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: "600",
          color: "#1f2937",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          COLLECTED SAMPLE DATA INFORMATION AND ANALYSIS REQUEST
        </h3>
      </div>

      {/* Non-sample specific fields */}
      {nonSampleFields.length > 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {nonSampleFields.map((field, index) => (
              <div key={field.type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", minWidth: "120px" }}>
                  {formatEntityTypeToDisplayName(field.type)}:
                </label>
                <input
                  type="text"
                  value={field.value || ''}
                  disabled={!editable}
                  onChange={(e) => onFieldChange?.('collectedSampleDataInfo', field.originalIndex, e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
                {editable && (
                  <button
                    onClick={() => onRemoveField?.('collectedSampleDataInfo', field.originalIndex)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      border: "none",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={headerStyle}>Customer Sample ID</th>
              <th style={headerStyle}>Matrix</th>
              <th style={headerStyle}>Comp/Grab</th>
              <th style={headerStyle}>Composite Start Date</th>
              <th style={headerStyle}>Composite Start Time</th>
              <th style={headerStyle}>Collected End Date</th>
              <th style={headerStyle}>Collected End Time</th>
              <th style={headerStyle}># Cont</th>
              <th style={headerStyle}>Analysis Request</th>
              {editable && <th style={headerStyle}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sampleNumbers.map(sampleNum => {
              const sample = groupedSamples[sampleNum];
              const sampleId = sample[`customer_sample_id_${sampleNum}`];
              const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];
              const comp = sample[`customer_sample_id_${sampleNum}_comp`];
              const startDate = sample[`customer_sample_id_${sampleNum}_start_date`];
              const startTime = sample[`customer_sample_id_${sampleNum}_start_time`];
              const endDate = sample[`customer_sample_id_${sampleNum}_end_date`];
              const endTime = sample[`customer_sample_id_${sampleNum}_end_time`];
              const containers = sample[`sample_id_${sampleNum}_no_of_container`];
              const analysis = sample[`analysis_request_${sampleNum}`];

              // Only show row if at least one field exists for this sample
              const hasData = sampleId || matrix || comp || startDate || startTime || endDate || endTime || containers || analysis;
              if (!hasData) return null;

              return (
                <tr key={sampleNum}>
                  <td style={cellStyle}>
                    {sampleId && (
                      <input
                        type="text"
                        value={sampleId.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', sampleId.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {matrix && (
                      <input
                        type="text"
                        value={matrix.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', matrix.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {comp && (
                      <input
                        type="text"
                        value={comp.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', comp.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {startDate && (
                      <input
                        type="text"
                        value={startDate.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', startDate.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {startTime && (
                      <input
                        type="text"
                        value={startTime.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', startTime.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {endDate && (
                      <input
                        type="text"
                        value={endDate.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', endDate.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {endTime && (
                      <input
                        type="text"
                        value={endTime.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', endTime.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {containers && (
                      <input
                        type="text"
                        value={containers.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', containers.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    {analysis && (
                      <input
                        type="text"
                        value={analysis.value || ''}
                        disabled={!editable}
                        onChange={(e) => onFieldChange?.('collectedSampleDataInfo', analysis.originalIndex, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </td>
                  {editable && (
                    <td style={cellStyle}>
                      <button
                        onClick={() => {
                          // Remove all fields for this sample
                          Object.values(sample).forEach((field: any) => {
                            onRemoveField?.('collectedSampleDataInfo', field.originalIndex);
                          });
                        }}
                        style={{
                          backgroundColor: "#ef4444",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border: "none",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {sampleNumbers.filter(sampleNum => {
              const sample = groupedSamples[sampleNum];
              const sampleId = sample[`customer_sample_id_${sampleNum}`];
              const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];
              const comp = sample[`customer_sample_id_${sampleNum}_comp`];
              const startDate = sample[`customer_sample_id_${sampleNum}_start_date`];
              const startTime = sample[`customer_sample_id_${sampleNum}_start_time`];
              const endDate = sample[`customer_sample_id_${sampleNum}_end_date`];
              const endTime = sample[`customer_sample_id_${sampleNum}_end_time`];
              const containers = sample[`sample_id_${sampleNum}_no_of_container`];
              const analysis = sample[`analysis_request_${sampleNum}`];
              return sampleId || matrix || comp || startDate || startTime || endDate || endTime || containers || analysis;
            }).length === 0 && (
                <tr>
                  <td colSpan={editable ? 10 : 9} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
                    No sample data available
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles for the table
const headerStyle: React.CSSProperties = {
  padding: "8px 4px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  fontSize: "11px",
  fontWeight: "600",
  color: "#374151",
  textAlign: "left",
  minWidth: "80px"
};

const cellStyle: React.CSSProperties = {
  padding: "4px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  fontSize: "11px",
  minWidth: "80px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "3px",
  padding: "2px 4px",
  fontSize: "11px",
  outline: "none",
  minWidth: "70px"
};

interface EditableTableProps {
  fields: Field[];
  onFieldChange?: (index: number, value: string) => void;
  onRemoveField?: (index: number) => void;
  editable?: boolean;
}

interface SpreadsheetViewProps {
  sections: {
    companyLocationInfo: any[];
    contactProjectInfo: any[];
    dataDeliverables: any[];
    containerInfo: any[];
    collectedSampleDataInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  editable?: boolean;
}

// Section component for organized display
const SectionDisplay: React.FC<{
  title: string;
  items: any[];
  sectionType: string;
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  editable?: boolean;
}> = ({ title, items, sectionType, onFieldChange, onRemoveField, editable = true }) => {
  if (items.length === 0) return null;

  return (
    <div style={{
      marginBottom: "24px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
    }}>
      {/* Section Header */}
      <div style={{
        backgroundColor: "#f8fafc",
        padding: "12px 16px",
        borderBottom: "2px solid #e5e7eb",
        borderTopLeftRadius: "6px",
        borderTopRightRadius: "6px"
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: "600",
          color: "#1f2937",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {title}
        </h3>
      </div>

      {/* Section Content */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1px",
        backgroundColor: "#e5e7eb"
      }}>
        {items.map((item, index) => (
          <div key={`${sectionType}-${index}`} style={{
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "stretch"
          }}>
            {/* Field Label */}
            <div style={{
              padding: "12px",
              backgroundColor: "#f9fafb",
              borderRight: "1px solid #e5e7eb",
              minWidth: "140px",
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151"
            }}>
              {formatEntityTypeToDisplayName(item.type)}
            </div>

            {/* Field Value */}
            <div style={{
              flex: 1,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center"
            }}>
              <input
                type="text"
                value={item.value}
                disabled={!editable}
                onChange={(e) => onFieldChange?.(sectionType, index, e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: editable ? "#ffffff" : "#f9fafb"
                }}
              />
            </div>

            {/* Confidence Score */}
            <div style={{
              padding: "12px",
              borderLeft: "1px solid #e5e7eb",
              minWidth: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: item.confidence >= 0.9 ? "#059669" : item.confidence >= 0.7 ? "#d97706" : "#dc2626"
            }}>
              {Math.round(item.confidence * 100)}%
            </div>

            {/* Remove Button */}
            {editable && (
              <div style={{
                padding: "8px",
                borderLeft: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center"
              }}>
                <button
                  onClick={() => onRemoveField?.(sectionType, index)}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#dc2626")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ef4444")
                  }
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// New Spreadsheet View Component
export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  sections,
  onFieldChange,
  onRemoveField,
  editable = true,
}) => {
  return (
    <div style={{
      padding: "16px",
      maxHeight: "65vh",
      overflowY: "auto",
      backgroundColor: "#f8fafc"
    }}>
      <SectionDisplay
        title="Company & Location Information"
        items={sections.companyLocationInfo}
        sectionType="companyLocationInfo"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SectionDisplay
        title="Contact & Project Information"
        items={sections.contactProjectInfo}
        sectionType="contactProjectInfo"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SectionDisplay
        title="Data Deliverables"
        items={sections.dataDeliverables}
        sectionType="dataDeliverables"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SectionDisplay
        title="Container Information"
        items={sections.containerInfo}
        sectionType="containerInfo"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SampleDataTable
        items={sections.collectedSampleDataInfo}
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />
    </div>
  );
};

// Keep the original EditableTable for backward compatibility
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
