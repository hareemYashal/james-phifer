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
  // console.log("H-> All Items 🎍🎍🎍", items);

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
    } else if (type.match(/^Sample\d{2}_analysis\d{1,2}$/)) {
      // Handle Sample01_analysis01, Sample02_analysis02, etc.
      const match = type.match(/^Sample(\d{2})_analysis\d{1,2}$/);
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
      marginBottom: "15vh",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {nonSampleFields.map((field, index) => (
              <div key={field.type} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "36px"
              }}>
                <label style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  minWidth: "120px",
                  color: "#374151",
                  maxWidth: "160px",
                  width: "25%",
                }}>
                  {formatEntityTypeToDisplayName(field.type)}:
                </label>
                <input
                  type="text"
                  value={field.value || ''}
                  disabled={!editable}
                  onChange={(e) => onFieldChange?.('collectedSampleDataInfo', field.originalIndex, e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "100px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: field.confidence >= 0.9 ? "#059669" : field.confidence >= 0.7 ? "#d97706" : "#dc2626",
                  minWidth: "60px",
                  padding: "4px 8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  backgroundColor: "#f9fafb"
                }}>
                  {Math.round(field.confidence * 100)}%
                </div>
                {editable && (
                  <button
                    onClick={() => onRemoveField?.('collectedSampleDataInfo', field.originalIndex)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "4px 6px",
                      borderRadius: "3px",
                      border: "none",
                      fontSize: "11px",
                      cursor: "pointer",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
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
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Customer Sample ID</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Matrix</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Comp/<br></br> Grab</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Composite Start(Date)</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Composite Start(Time)</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "180px" }}>Collected or Composite End(Date)</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "180px" }}>Collected or Composite End(Time)</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}># Cont</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "100px" }}>Analysis Request</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Confidence</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-1</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-2</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-3</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-4</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-5</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-6</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-7</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-8</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-9</th>
              <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "80px" }}>Checkbox Column-10</th>
              {editable && <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sampleNumbers.map(sampleNum => {
              const sample = groupedSamples[sampleNum];
              const sampleId = sample[`customer_sample_id_${sampleNum}`];
              const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];

              // Debug log for this sample
              // console.log(`Sample ${sampleNum}:`, {
              //   sampleId: sampleId?.value,
              //   matrix: matrix?.value,
              //   allFields: Object.keys(sample)
              // });

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
                    {sampleId && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: sampleId.confidence >= 0.9 ? "#059669" : sampleId.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(sampleId.confidence * 100)}%
                      </div>
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
                    {matrix && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: matrix.confidence >= 0.9 ? "#059669" : matrix.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(matrix.confidence * 100)}%
                      </div>
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
                    {comp && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: comp.confidence >= 0.9 ? "#059669" : comp.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(comp.confidence * 100)}%
                      </div>
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
                    {startDate && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: startDate.confidence >= 0.9 ? "#059669" : startDate.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(startDate.confidence * 100)}%
                      </div>
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
                    {startTime && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: startTime.confidence >= 0.9 ? "#059669" : startTime.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(startTime.confidence * 100)}%
                      </div>
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
                    {endDate && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: endDate.confidence >= 0.9 ? "#059669" : endDate.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(endDate.confidence * 100)}%
                      </div>
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
                    {endTime && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: endTime.confidence >= 0.9 ? "#059669" : endTime.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(endTime.confidence * 100)}%
                      </div>
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
                    {containers && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: containers.confidence >= 0.9 ? "#059669" : containers.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(containers.confidence * 100)}%
                      </div>
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
                  <td style={cellStyle}>
                    {analysis && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: analysis.confidence >= 0.9 ? "#059669" : analysis.confidence >= 0.7 ? "#d97706" : "#dc2626"
                      }}>
                        {Math.round(analysis.confidence * 100)}%
                      </div>
                    )}
                  </td>
                  {/* Analysis Checkboxes 01-10 */}
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].map(analysisNum => {
                    const fieldType = `Sample${sampleNum.padStart(2, '0')}_analysis${analysisNum}`;
                    // First try the current sample, then try the padded version
                    let analysisField = sample[fieldType];
                    if (!analysisField && groupedSamples[sampleNum.padStart(2, '0')]) {
                      analysisField = groupedSamples[sampleNum.padStart(2, '0')][fieldType];
                    }
                    const isChecked = analysisField && analysisField.value;

                    return (
                      <td key={`${sampleNum}-analysis-${analysisNum}`} style={cellStyle}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!editable}
                            onChange={(e) => {
                              if (e.target.checked && !analysisField) {
                                // Create new field - use a special value format that parent can handle
                                onFieldChange?.('collectedSampleDataInfo', -1, `${fieldType}:checked`);
                              } else if (!e.target.checked && analysisField) {
                                // Remove existing field
                                onRemoveField?.('collectedSampleDataInfo', analysisField.originalIndex);
                              } else if (e.target.checked && analysisField) {
                                // Update existing field
                                onFieldChange?.('collectedSampleDataInfo', analysisField.originalIndex, 'checked');
                              }
                            }}
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: editable ? "pointer" : "default",
                              accentColor: "#3b82f6"
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
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
                  <td colSpan={editable ? 29 : 28} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
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

const additionalheaderStyle: React.CSSProperties = {
  textAlign: "center",
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

// Generic Spreadsheet Table Component for all sections
const SpreadsheetTable: React.FC<{
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

      {/* Table Content */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={headerStyle}>Field Name</th>
              <th style={headerStyle}>Value</th>
              <th style={headerStyle}>Confidence</th>
              {editable && <th style={headerStyle}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${sectionType}-${index}`}>
                <td style={cellStyle}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    wordWrap: "break-word",
                    lineHeight: "1.3"
                  }}>
                    {formatEntityTypeToDisplayName(item.type)}
                  </div>
                </td>
                <td style={cellStyle}>
                  <input
                    type="text"
                    value={item.value || ''}
                    disabled={!editable}
                    onChange={(e) => onFieldChange?.(sectionType, index, e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={cellStyle}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: item.confidence >= 0.9 ? "#059669" : item.confidence >= 0.7 ? "#d97706" : "#dc2626"
                  }}>
                    {Math.round(item.confidence * 100)}%
                  </div>
                </td>
                {editable && (
                  <td style={cellStyle}>
                    <button
                      onClick={() => onRemoveField?.(sectionType, index)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        border: "none",
                        fontSize: "11px",
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
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
  const testSampleData = [

    {
      "type": "Sample01_analysis01",
      "value": "true",
      "confidence": 0.9881,
      "normalized_value": null
    },

    {
      "type": "Sample01_analysis02",
      "value": "true",
      "confidence": 0.9881,
      "normalized_value": null
    },

    {
      "type": "Sample01_analysis06",
      "value": "true",
      "confidence": 0.9881,
      "normalized_value": null
    },

    {
      "type": "Sample02_analysis06",
      "value": "true",
      "confidence": 0.9881,
      "normalized_value": null
    },

    {
      "type": "Sample02_analysis09",
      "value": "true",
      "confidence": 0.9881,
      "normalized_value": null
    },

    {
      "type": "collected_name",
      "value": "Ted Jeffcoat",
      "confidence": 0.9881,
      "normalized_value": null
    },
    {
      "type": "collector_signature",
      "value": "Tel Jeffcuet",
      "confidence": 0.9425,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_1",
      "value": "MW-01",
      "confidence": 0.9999,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_2",
      "value": "MW-02",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_3",
      "value": "MW\n-\n22",
      "confidence": 0.7072,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_4",
      "value": "Sw\n-\n12",
      "confidence": 0.999,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_5",
      "value": "Sw\n-\n32",
      "confidence": 0.9993,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_6",
      "value": "SS-01",
      "confidence": 0.9997,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_1_comp",
      "value": "GW G",
      "confidence": 0.4441,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_2_comp",
      "value": "GWG",
      "confidence": 0.9998,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_3_comp",
      "value": "GWG",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_4_comp",
      "value": "SWG",
      "confidence": 0.9999,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_5_comp",
      "value": "SWG",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_6_comp",
      "value": "SSC",
      "confidence": 0.9982,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_1_end_date",
      "value": "4-6-24",
      "confidence": 0.9989,
      "normalized_value": "2024-04-06"
    },
    {
      "type": "customer_sample_id_2_end_date",
      "value": "4-6-24",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_3_end_date",
      "value": "4-6-24",
      "confidence": 0.6044,
      "normalized_value": "2024-04-06"
    },
    {
      "type": "customer_sample_id_4_end_date",
      "value": "4-6-24",
      "confidence": 1,
      "normalized_value": "2024-04-06"
    },
    {
      "type": "customer_sample_id_5_end_date",
      "value": "4-6-24",
      "confidence": 1,
      "normalized_value": "2024-04-06"
    },
    {
      "type": "customer_sample_id_6_end_date",
      "value": "4-7-24",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_1_end_time",
      "value": "8:00",
      "confidence": 0.9999,
      "normalized_value": ""
    },
    {
      "type": "customer_sample_id_2_end_time",
      "value": "8:15",
      "confidence": 1,
      "normalized_value": ""
    },
    {
      "type": "customer_sample_id_3_end_time",
      "value": "8:30",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_4_end_time",
      "value": "9:00",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_5_end_time",
      "value": "9:30",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "customer_sample_id_6_end_time",
      "value": "11:00",
      "confidence": 1,
      "normalized_value": null
    },
    {
      "type": "analysis_request_1",
      "value": "TCL 8260",
      "confidence": 0.9921,
      "normalized_value": null
    },
    {
      "type": "analysis_request_2",
      "value": "TCL 8270",
      "confidence": 0.9994,
      "normalized_value": null
    },
    {
      "type": "analysis_request_3",
      "value": "TAL 6020",
      "confidence": 0.9708,
      "normalized_value": null
    },
    {
      "type": "analysis_request_4",
      "value": "8015",
      "confidence": 0.9997,
      "normalized_value": null
    }
  ]
  return (
    <div style={{
      padding: "16px",
      maxHeight: "65vh",
      overflowY: "auto",
      backgroundColor: "#f8fafc"
    }}>
      <SpreadsheetTable
        title="Company & Location Information"
        items={sections.companyLocationInfo}
        sectionType="companyLocationInfo"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SpreadsheetTable
        title="Contact & Project Information"
        items={sections.contactProjectInfo}
        sectionType="contactProjectInfo"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SpreadsheetTable
        title="Data Deliverables"
        items={sections.dataDeliverables}
        sectionType="dataDeliverables"
        onFieldChange={onFieldChange}
        onRemoveField={onRemoveField}
        editable={editable}
      />

      <SpreadsheetTable
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
