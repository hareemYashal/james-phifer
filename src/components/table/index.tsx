// import { Field } from "@/types";
// import React from "react";
// import { formatEntityTypeToDisplayName } from "@/lib/utils";

// // Sample Data Table Component for Collected Sample Data Information
// const SampleDataTable: React.FC<{
//   items: any[];
//   onFieldChange?: (sectionType: string, index: number, value: string) => void;
//   onRemoveField?: (sectionType: string, index: number) => void;
//   editable?: boolean;
// }> = ({ items, onFieldChange, onRemoveField, editable = true }) => {
//   // Group items by sample number (1-10) and separate non-sample fields
//   const groupedSamples: Record<string, any> = {};
//   const nonSampleFields: any[] = [];
//   console.log("All Items 1️⃣", items);

//   items.forEach((item, index) => {
//     //type-> collectected_name, sample_id_1_matrix, analysis_request_1 etc..
//     const type = item.type;
//     let sampleNumber = '';

//     // Extract sample number from field type
//     if (type.includes('customer_sample_id_')) {
//       const match = type.match(/customer_sample_id_(\d+)(?:_.*)?/);
//       if (match) {
//         sampleNumber = match[1]; //(\d+) (what's inside parentheses) (match[1] = "1") will give the digit.
//       }
//     } else if (type.includes('sample_id_')) {
//       const match = type.match(/sample_id_(\d+)_/);
//       if (match) {
//         sampleNumber = match[1];
//       }
//     } else if (type.includes('analysis_request_')) {
//       const match = type.match(/analysis_request_(\d+)/);
//       if (match) {
//         sampleNumber = match[1];
//       }
//     } else if (type.match(/^Sample\d{2}_analysis\d{1,2}$/)) {
//       // Handle Sample01_analysis01, Sample02_analysis02, etc.
//       const match = type.match(/^Sample(\d{2})_analysis\d{1,2}$/);
//       if (match) {
//         sampleNumber = match[1];
//       }
//     } else {
//       // Handle non-sample specific fields like collected_name, collector_signature
//       nonSampleFields.push({ ...item, originalIndex: index });
//     }
//     // console.log("sampleNumber 1️⃣", sampleNumber);
//     if (sampleNumber) {
//       // groupedSamples[sampleNumber][type] = { ...item, originalIndex: index };
//       //  1: { customer_sample_id_1: {… }, customer_sample_id_1_end_date: {… }, customer_sample_id_1_end_time: {… }, sample_id_1_no_of_container: {… }, analysis_request_1: {… } }
//       //  2: { customer_sample_id_2: {… }, customer_sample_id_2_matrix: {… }, customer_sample_id_2_end_date: {… }, customer_sample_id_2_end_time: {… }, sample_id_2_no_of_container: {… }, … }
//       if (!groupedSamples[sampleNumber]) {
//         groupedSamples[sampleNumber] = {};
//       }
//       groupedSamples[sampleNumber][type] = { ...item, originalIndex: index };
//     }
//   });

//   // console.log("Grouped Samples2️⃣", groupedSamples);

//   const sampleNumbers = Object.keys(groupedSamples).sort((a, b) => parseInt(a) - parseInt(b));
//   // console.log("Sorted Sample numbers3️⃣", sampleNumbers);
//   // Don't render anything if there's no data at all
//   if (nonSampleFields.length === 0 && sampleNumbers.length === 0) {
//     return null;
//   }

//   return (
//     <div style={{
//       marginBottom: "15vh",
//       border: "2px solid #e5e7eb",
//       borderRadius: "8px",
//       backgroundColor: "#ffffff",
//       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
//     }}>
//       {/* Section Header */}
//       <div style={{
//         backgroundColor: "#f8fafc",
//         padding: "12px 16px",
//         borderBottom: "2px solid #e5e7eb",
//         borderTopLeftRadius: "6px",
//         borderTopRightRadius: "6px"
//       }}>
//         <h3 style={{
//           margin: 0,
//           fontSize: "16px",
//           fontWeight: "600",
//           color: "#1f2937",
//           textTransform: "uppercase",
//           letterSpacing: "0.5px"
//         }}>
//           COLLECTED SAMPLE DATA INFORMATION AND ANALYSIS REQUEST
//         </h3>
//       </div>

//       {/* Non-sample specific fields */}
//       {nonSampleFields.length > 0 && (
//         <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
//           <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//             {nonSampleFields.map((field, index) => (
//               <div key={field.type} style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",
//                 minHeight: "36px"
//               }}>
//                 <label style={{
//                   fontSize: "12px",
//                   fontWeight: "500",
//                   minWidth: "120px",
//                   color: "#374151",
//                   maxWidth: "160px",
//                   width: "25%",
//                 }}>
//                   {formatEntityTypeToDisplayName(field.type)}:
//                 </label>
//                 <input
//                   type="text"
//                   value={field.value || ''}
//                   disabled={!editable}
//                   onChange={(e) => onFieldChange?.('collectedSampleDataInfo', field.originalIndex, e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                       const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                       const nextInput = inputs[currentIndex + 1];
//                       if (nextInput) {
//                         (nextInput as HTMLInputElement).focus();
//                         (nextInput as HTMLInputElement).select();
//                       }
//                     }
//                   }}
//                   style={{
//                     flex: 1,
//                     minWidth: "100px",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "4px",
//                     padding: "6px 8px",
//                     fontSize: "12px",
//                     outline: "none"
//                   }}
//                 />
//                 {editable && (
//                   <button
//                     onClick={() => onRemoveField?.('collectedSampleDataInfo', field.originalIndex)}
//                     style={{
//                       backgroundColor: "#ef4444",
//                       color: "white",
//                       padding: "4px 6px",
//                       borderRadius: "3px",
//                       border: "none",
//                       fontSize: "11px",
//                       cursor: "pointer",
//                       width: "28px",
//                       height: "28px",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center"
//                     }}
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Table Content */}
//       <div style={{ overflowX: "auto" }}>
//         {(() => {
//           // Function to separate date and time from combined values
//           const separateDateTime = (value: string) => {
//             if (!value) return { date: '', time: '' };

//             // Pattern to detect date formats: 6-25-25 or 6/25/25
//             // Look for: digit(s)-digit(s)-2digits followed by anything else
//             const datePattern = /^(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})(.*)$/;
//             const match = value.match(datePattern);

//             if (match) {
//               const date = match[1];
//               const time = match[2];
//               return { date: date, time: time };
//             }

//             return { date: '', time: value };
//           };

//           // Create an array to hold all sample rows (including duplicates for each analysis method)
//           const allSampleRows: any[] = [];
//           sampleNumbers.forEach(sampleNum => {
//             const sample = groupedSamples[sampleNum];
//             const sampleId = sample[`customer_sample_id_${sampleNum}`];
//             const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];
//             const comp = sample[`customer_sample_id_${sampleNum}_comp`];
//             const rawStartDate = sample[`customer_sample_id_${sampleNum}_start_date`];
//             const rawStartTime = sample[`customer_sample_id_${sampleNum}_start_time`];
//             const rawEndDate = sample[`customer_sample_id_${sampleNum}_end_date`];
//             const rawEndTime = sample[`customer_sample_id_${sampleNum}_end_time`];
//             const containers = sample[`sample_id_${sampleNum}_no_of_container`];
//             const analysisRequest = sample[`analysis_request_${sampleNum}`];
//             console.log("rawStartDate", rawStartDate);
//             console.log("rawStartTime", rawStartTime);
//             console.log("rawEndDate", rawEndDate);
//             console.log("rawEndTime", rawEndTime);

//             // Process startDate and startTime
//             let startDate = rawStartDate;
//             let startTime = rawStartTime;
//             if (rawStartDate?.value) {
//               const separated = separateDateTime(rawStartDate.value);
//               if (separated.date) {
//                 startDate = { ...rawStartDate, value: separated.date };
//                 if (separated.time && !rawStartTime?.value) {
//                   // Create a new independent field for the separated time
//                   startTime = {
//                     ...rawStartDate,
//                     value: separated.time,
//                     type: `customer_sample_id_${sampleNum}_start_time`,
//                     originalIndex: -1 // Mark as virtual field
//                   };
//                 }
//               }
//             }

//             // Process endDate and endTime
//             let endDate = rawEndDate;
//             let endTime = rawEndTime;
//             if (rawEndDate?.value) {
//               const separated = separateDateTime(rawEndDate.value);
//               if (separated.date) {
//                 endDate = { ...rawEndDate, value: separated.date };
//                 if (separated.time && !rawEndTime?.value) {
//                   // Create a new independent field for the separated time
//                   endTime = {
//                     ...rawEndDate,
//                     value: separated.time,
//                     type: `customer_sample_id_${sampleNum}_end_time`,
//                     originalIndex: -1 // Mark as virtual field
//                   };
//                 }
//               }
//             }

//             console.log("startDate", startDate);
//             console.log("startTime", startTime);
//             console.log("endDate", endDate);
//             console.log("endTime", endTime);
//             // Only process if at least one field exists for this sample
//             const hasData = sampleId || matrix || comp || startDate || startTime || endDate || endTime || containers || analysisRequest;
//             if (!hasData) return;
//             // console.log("one group 4️⃣", sampleId, matrix, comp, startDate, startTime, endDate, endTime, containers, analysisRequest);

//             // Find all active analysis methods for this sample
//             const activeAnalysisMethods: any[] = [];

//             // Check each analysis method (01-10)
//             for (let i = 1; i <= 10; i++) {
//               const analysisNum = i.toString().padStart(2, '0');
//               const fieldType = `Sample${sampleNum.padStart(2, '0')}_analysis${analysisNum}`;
//               let analysisField = sample[fieldType];
//               // console.log("analysisNum 7️⃣", analysisNum);
//               // console.log("fieldType 8️⃣", fieldType);
//               // console.log("analysisField 9️⃣", analysisField);

//               if (!analysisField && groupedSamples[sampleNum.padStart(2, '0')]) {
//                 analysisField = groupedSamples[sampleNum.padStart(2, '0')][fieldType];
//               }

//               if (analysisField) {
//                 // Use the Sample0X_analysis0X value directly as the method value
//                 const methodValue = analysisField.value || '';
//                 activeAnalysisMethods.push({
//                   methodValue,
//                   analysisField,
//                   analysisNum
//                 });
//               }
//             }
//             // console.log("activeAnalysisMethods *10", activeAnalysisMethods);
//             // If no active analysis methods, check for fallback analysis_request
//             if (activeAnalysisMethods.length === 0) {
//               // Use analysis_request as fallback
//               if (analysisRequest) {
//                 allSampleRows.push({
//                   sampleNum,
//                   sampleId,
//                   matrix,
//                   comp,
//                   startDate,
//                   startTime,
//                   endDate,
//                   endTime,
//                   containers,
//                   methodValue: analysisRequest.value || '', // Use analysis_request value as fallback
//                   analysisField: analysisRequest, // Use analysis_request field for confidence and editing
//                   rowKey: `${sampleNum}-analysis-request-fallback`
//                 });
//               } else {
//                 // No method data at all
//                 allSampleRows.push({
//                   sampleNum,
//                   sampleId,
//                   matrix,
//                   comp,
//                   startDate,
//                   startTime,
//                   endDate,
//                   endTime,
//                   containers,
//                   methodValue: null, // No method value
//                   analysisField: null, // No analysis field
//                   rowKey: `${sampleNum}-default`
//                 });
//               }
//             } else {
//               // Create a row for each active analysis method
//               activeAnalysisMethods.forEach((method, methodIndex) => {
//                 allSampleRows.push({
//                   sampleNum,
//                   sampleId,
//                   matrix,
//                   comp,
//                   startDate,
//                   startTime,
//                   endDate,
//                   endTime,
//                   containers,
//                   methodValue: method.methodValue,
//                   analysisField: method.analysisField,
//                   rowKey: `${sampleNum}-${method.analysisNum}-${methodIndex}`
//                 });
//               });
//             }
//           });

//           if (allSampleRows.length === 0) {
//             return (
//               <table style={{
//                 width: "100%",
//                 borderCollapse: "collapse",
//                 fontSize: "12px"
//               }}>
//                 <tbody>
//                   <tr>
//                     <td colSpan={10} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
//                       No sample data available
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             );
//           }

//           // Check which columns have data
//           const hasData = {
//             sampleId: allSampleRows.some(row => row.sampleId?.value),
//             matrix: allSampleRows.some(row => row.matrix?.value),
//             comp: allSampleRows.some(row => row.comp?.value),
//             startDate: allSampleRows.some(row => row.startDate?.value),
//             startTime: allSampleRows.some(row => row.startTime?.value),
//             endDate: allSampleRows.some(row => row.endDate?.value),
//             endTime: allSampleRows.some(row => row.endTime?.value),
//             containers: allSampleRows.some(row => row.containers?.value),
//             method: allSampleRows.some(row => row.methodValue)
//           };

//           const tableRows = allSampleRows.map((row) => (
//             <tr key={row.rowKey}>
//               {hasData.sampleId && (
//                 <td style={cellStyle}>
//                   {row.sampleId && (
//                     <input
//                       type="text"
//                       value={row.sampleId.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.sampleId.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.matrix && (
//                 <td style={cellStyle}>
//                   {row.matrix && (
//                     <input
//                       type="text"
//                       value={row.matrix.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.matrix.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.comp && (
//                 <td style={cellStyle}>
//                   {row.comp && (
//                     <input
//                       type="text"
//                       value={row.comp.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.comp.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.startDate && (
//                 <td style={cellStyle}>
//                   {row.startDate && (
//                     <input
//                       type="text"
//                       value={row.startDate.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.startDate.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.startTime && (
//                 <td style={cellStyle}>
//                   {row.startTime && (
//                     <input
//                       type="text"
//                       value={row.startTime.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => {
//                         if (row.startTime.originalIndex === -1) {
//                           // This is a virtual field created from separated date/time
//                           // Update the original startDate field with combined value
//                           const dateValue = row.startDate?.value || '';
//                           const newCombinedValue = dateValue + e.target.value;
//                           onFieldChange?.('collectedSampleDataInfo', row.startDate.originalIndex, newCombinedValue);
//                         } else {
//                           // This is a real field, update normally
//                           onFieldChange?.('collectedSampleDataInfo', row.startTime.originalIndex, e.target.value);
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.endDate && (
//                 <td style={cellStyle}>
//                   {row.endDate && (
//                     <input
//                       type="text"
//                       value={row.endDate.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.endDate.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.endTime && (
//                 <td style={cellStyle}>
//                   {row.endTime && (
//                     <input
//                       type="text"
//                       value={row.endTime.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => {
//                         if (row.endTime.originalIndex === -1) {
//                           // This is a virtual field created from separated date/time
//                           // Update the original endDate field with combined value
//                           const dateValue = row.endDate?.value || '';
//                           const newCombinedValue = dateValue + e.target.value;
//                           onFieldChange?.('collectedSampleDataInfo', row.endDate.originalIndex, newCombinedValue);
//                         } else {
//                           // This is a real field, update normally
//                           onFieldChange?.('collectedSampleDataInfo', row.endTime.originalIndex, e.target.value);
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.containers && (
//                 <td style={cellStyle}>
//                   {row.containers && (
//                     <input
//                       type="text"
//                       value={row.containers.value || ''}
//                       disabled={!editable}
//                       onChange={(e) => onFieldChange?.('collectedSampleDataInfo', row.containers.originalIndex, e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                     />
//                   )}
//                 </td>
//               )}
//               {hasData.method && (
//                 <td style={cellStyle}>
//                   {row.methodValue !== null ? (
//                     <input
//                       type="text"
//                       value={row.methodValue || ''}
//                       disabled={!editable}
//                       onChange={(e) => {
//                         if (row.analysisField) {
//                           onFieldChange?.('collectedSampleDataInfo', row.analysisField.originalIndex, e.target.value);
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           e.preventDefault();
//                           const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                           const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                           const nextInput = inputs[currentIndex + 1];
//                           if (nextInput) {
//                             (nextInput as HTMLInputElement).focus();
//                             (nextInput as HTMLInputElement).select();
//                           }
//                         }
//                       }}
//                       style={inputStyle}
//                       placeholder="Enter method code"
//                     />
//                   ) : null}
//                 </td>
//               )}
//               {editable && (
//                 <td style={cellStyle}>
//                   <button
//                     onClick={() => {
//                       // Remove all fields for this entire sample row
//                       const sampleNum = row.sampleNum;
//                       const fieldsToRemove: number[] = [];

//                       // Collect all field indices for this sample number
//                       items.forEach((item, index) => {
//                         const type = item.type;
//                         let itemSampleNumber = '';

//                         // Extract sample number using the same logic as in the grouping
//                         if (type.includes('customer_sample_id_')) {
//                           const match = type.match(/customer_sample_id_(\d+)(?:_.*)?/);
//                           if (match) {
//                             itemSampleNumber = match[1];
//                           }
//                         } else if (type.includes('sample_id_')) {
//                           const match = type.match(/sample_id_(\d+)_/);
//                           if (match) {
//                             itemSampleNumber = match[1];
//                           }
//                         } else if (type.includes('analysis_request_')) {
//                           const match = type.match(/analysis_request_(\d+)/);
//                           if (match) {
//                             itemSampleNumber = match[1];
//                           }
//                         } else if (type.match(/^Sample\d{2}_analysis\d{1,2}$/)) {
//                           const match = type.match(/^Sample(\d{2})_analysis\d{1,2}$/);
//                           if (match) {
//                             itemSampleNumber = match[1];
//                           }
//                         }

//                         // If this field belongs to the same sample, add it to removal list
//                         if (itemSampleNumber === sampleNum) {
//                           fieldsToRemove.push(index);
//                         }
//                       });

//                       // Remove all fields for this sample in reverse order to maintain indices
//                       fieldsToRemove.reverse().forEach(index => {
//                         onRemoveField?.('collectedSampleDataInfo', index);
//                       });
//                     }}
//                     style={{
//                       backgroundColor: "#ef4444",
//                       color: "white",
//                       padding: "2px 6px",
//                       borderRadius: "3px",
//                       border: "none",
//                       fontSize: "11px",
//                       cursor: "pointer"
//                     }}
//                   >
//                     ×
//                   </button>
//                 </td>
//               )}
//             </tr>
//           ));

//           return (
//             <table style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               fontSize: "12px"
//             }}>
//               <thead>
//                 <tr style={{ backgroundColor: "#f9fafb" }}>
//                   {hasData.sampleId && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Customer Sample ID</th>}
//                   {hasData.matrix && <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Matrix</th>}
//                   {hasData.comp && <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Comp/<br></br> Grab</th>}
//                   {hasData.startDate && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Composite Start(Date)</th>}
//                   {hasData.startTime && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "140px" }}>Composite Start(Time)</th>}
//                   {hasData.endDate && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "180px" }}>Collected or Composite End(Date)</th>}
//                   {hasData.endTime && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "180px" }}>Collected or Composite End(Time)</th>}
//                   {hasData.containers && <th style={{ ...headerStyle, ...additionalheaderStyle, }}># Cont</th>}
//                   {hasData.method && <th style={{ ...headerStyle, ...additionalheaderStyle, minWidth: "100px" }}>Method</th>}
//                   {editable && <th style={{ ...headerStyle, ...additionalheaderStyle, }}>Actions</th>}
//                 </tr>
//               </thead>
//               <tbody>
//                 {tableRows}
//               </tbody>
//             </table>
//           );
//         })()}
//       </div>
//     </div>
//   );
// };

// // Styles for the table
// const headerStyle: React.CSSProperties = {
//   padding: "8px 4px",
//   borderBottom: "1px solid #e5e7eb",
//   borderRight: "1px solid #e5e7eb",
//   fontSize: "11px",
//   fontWeight: "600",
//   color: "#374151",
//   textAlign: "left",
//   minWidth: "80px"
// };

// const additionalheaderStyle: React.CSSProperties = {
//   textAlign: "center",
// };

// const cellStyle: React.CSSProperties = {
//   padding: "4px",
//   borderBottom: "1px solid #e5e7eb",
//   borderRight: "1px solid #e5e7eb",
//   fontSize: "11px",
//   minWidth: "80px"
// };

// const inputStyle: React.CSSProperties = {
//   width: "100%",
//   border: "1px solid #d1d5db",
//   borderRadius: "3px",
//   padding: "2px 4px",
//   fontSize: "11px",
//   outline: "none",
//   minWidth: "70px"
// };

// interface EditableTableProps {
//   fields: Field[];
//   onFieldChange?: (index: number, value: string) => void;
//   onRemoveField?: (index: number) => void;
//   editable?: boolean;
// }

// interface SpreadsheetViewProps {
//   sections: {
//     companyLocationInfo: any[];
//     contactProjectInfo: any[];
//     dataDeliverables: any[];
//     containerInfo: any[];
//     collectedSampleDataInfo: any[];
//   };
//   onFieldChange?: (sectionType: string, index: number, value: string) => void;
//   onRemoveField?: (sectionType: string, index: number) => void;
//   editable?: boolean;
// }

// // Generic Spreadsheet Table Component for all sections
// const SpreadsheetTable: React.FC<{
//   title: string;
//   items: any[];
//   sectionType: string;
//   onFieldChange?: (sectionType: string, index: number, value: string) => void;
//   onRemoveField?: (sectionType: string, index: number) => void;
//   editable?: boolean;
// }> = ({ title, items, sectionType, onFieldChange, onRemoveField, editable = true }) => {
//   if (items.length === 0) return null;

//   return (
//     <div style={{
//       marginBottom: "24px",
//       border: "2px solid #e5e7eb",
//       borderRadius: "8px",
//       backgroundColor: "#ffffff",
//       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
//     }}>
//       {/* Section Header */}
//       <div style={{
//         backgroundColor: "#f8fafc",
//         padding: "12px 16px",
//         borderBottom: "2px solid #e5e7eb",
//         borderTopLeftRadius: "6px",
//         borderTopRightRadius: "6px"
//       }}>
//         <h3 style={{
//           margin: 0,
//           fontSize: "16px",
//           fontWeight: "600",
//           color: "#1f2937",
//           textTransform: "uppercase",
//           letterSpacing: "0.5px"
//         }}>
//           {title}
//         </h3>
//       </div>

//       {/* Table Content */}
//       <div style={{ overflowX: "auto" }}>
//         <table style={{
//           width: "100%",
//           borderCollapse: "collapse",
//           fontSize: "12px"
//         }}>
//           <thead>
//             <tr style={{ backgroundColor: "#f9fafb" }}>
//               <th style={headerStyle}>Field Name</th>
//               <th style={headerStyle}>Value</th>
//               <th style={headerStyle}>Confidence</th>
//               {editable && <th style={headerStyle}>Actions</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((item, index) => (
//               <tr key={`${sectionType}-${index}`}>
//                 <td style={cellStyle}>
//                   <div style={{
//                     fontSize: "12px",
//                     fontWeight: "500",
//                     color: "#374151",
//                     wordWrap: "break-word",
//                     lineHeight: "1.3"
//                   }}>
//                     {formatEntityTypeToDisplayName(item.type)}
//                   </div>
//                 </td>
//                 <td style={cellStyle}>
//                   <input
//                     type="text"
//                     value={item.value || ''}
//                     disabled={!editable}
//                     onChange={(e) => onFieldChange?.(sectionType, index, e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         e.preventDefault();
//                         // Find next input field and focus it
//                         const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled])'));
//                         const currentIndex = inputs.indexOf(e.target as HTMLInputElement);
//                         const nextInput = inputs[currentIndex + 1];
//                         if (nextInput) {
//                           (nextInput as HTMLInputElement).focus();
//                           (nextInput as HTMLInputElement).select();
//                         }
//                       }
//                     }}
//                     style={inputStyle}
//                   />
//                 </td>
//                 <td style={cellStyle}>
//                   <div style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontSize: "11px",
//                     fontWeight: "600",
//                     color: item.confidence >= 0.9 ? "#059669" : item.confidence >= 0.7 ? "#d97706" : "#dc2626"
//                   }}>
//                     {Math.round(item.confidence * 100)}%
//                   </div>
//                 </td>
//                 {editable && (
//                   <td style={cellStyle}>
//                     <button
//                       onClick={() => onRemoveField?.(sectionType, index)}
//                       style={{
//                         backgroundColor: "#ef4444",
//                         color: "white",
//                         padding: "2px 6px",
//                         borderRadius: "3px",
//                         border: "none",
//                         fontSize: "11px",
//                         cursor: "pointer",
//                         transition: "background-color 0.2s ease"
//                       }}
//                       onMouseOver={(e) =>
//                         (e.currentTarget.style.backgroundColor = "#dc2626")
//                       }
//                       onMouseOut={(e) =>
//                         (e.currentTarget.style.backgroundColor = "#ef4444")
//                       }
//                     >
//                       ×
//                     </button>
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// // New Spreadsheet View Component
// export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
//   sections,
//   onFieldChange,
//   onRemoveField,
//   editable = true,
// }) => {
//   const items = [
//     {
//       "type": "Sample01_analysis01",
//       "value": "C-17201",
//       "confidence": 0.9998,
//       "normalized_value": null
//     },
//     {
//       "type": "Sample01_analysis02",
//       "value": "KB22056",
//       "confidence": 0.833,
//       "normalized_value": null
//     },
//     {
//       "type": "Sample02_analysis01",
//       "value": "KB22056",
//       "confidence": 0.833,
//       "normalized_value": null
//     },
//     {
//       "type": "Sample02_analysis02",
//       "value": "KB22056",
//       "confidence": 0.833,
//       "normalized_value": null
//     },
//     {
//       "type": "company_name",
//       "value": "Pinnacle Consultants",
//       "confidence": 0.9998,
//       "normalized_value": null
//     },
//     {
//       "type": "contact_to",
//       "value": "Ted Jeffcoat",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_project_no",
//       "value": "P-102",
//       "confidence": 0.9997,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_1",
//       "value": "MW-01",
//       "confidence": 1,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_1_end_time",
//       "value": "8:00",
//       "confidence": 0.9998,
//       "normalized_value": ""
//     },
//     {
//       "type": "customer_sample_id_2",
//       "value": "MW-02",
//       "confidence": 1,
//       "normalized_value": null
//     },
//     {
//       "type": "data_delverable_level4",
//       "value": "[] Level IV",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_2_comp",
//       "value": "G",
//       "confidence": 0.9989,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_2_end_date",
//       "value": "4-6-24",
//       "confidence": 0.9997,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_2_end_time",
//       "value": "8:15",
//       "confidence": 1,
//       "normalized_value": ""
//     },
//     {
//       "type": "customer_sample_id_2_matrix",
//       "value": "GW",
//       "confidence": 0.9996,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_3_comp",
//       "value": "G",
//       "confidence": 0.9998,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_3_end_time",
//       "value": "8:30",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_3_matrix",
//       "value": "GW",
//       "confidence": 0.9997,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_4_comp",
//       "value": "G",
//       "confidence": 0.9992,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_4_end_date",
//       "value": "4-6-24",
//       "confidence": 0.9999,
//       "normalized_value": "2024-04-06"
//     },
//     {
//       "type": "customer_sample_id_4_end_time",
//       "value": "9:00",
//       "confidence": 1,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_4_matrix",
//       "value": "SW",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_5",
//       "value": "Sw\n-\n32",
//       "confidence": 0.9993,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_5_comp",
//       "value": "G",
//       "confidence": 0.9995,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_5_end_date",
//       "value": "4-6-24",
//       "confidence": 0.9996,
//       "normalized_value": "2024-04-06"
//     },
//     {
//       "type": "customer_sample_id_5_end_time",
//       "value": "9:30",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_5_matrix",
//       "value": "SW",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_6",
//       "value": "SS-01",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_6_end_date",
//       "value": "4-7-24",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_6_end_time",
//       "value": "11:00",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_6_matrix",
//       "value": "SS",
//       "confidence": 0.9991,
//       "normalized_value": null
//     },
//     {
//       "type": "data_delverable_other",
//       "value": "Other",
//       "confidence": 0.9994,
//       "normalized_value": null
//     },
//     {
//       "type": "phone_number",
//       "value": "803-232-XXXX",
//       "confidence": 0.9999,
//       "normalized_value": null
//     },
//     {
//       "type": "analysis_request_2",
//       "value": "TCL 8270",
//       "confidence": 0.9983,
//       "normalized_value": null
//     },
//     {
//       "type": "collected_name",
//       "value": "Ted Jeffcoat",
//       "confidence": 0.9971,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_1_end_date",
//       "value": "4-6-24",
//       "confidence": 0.9971,
//       "normalized_value": "2024-04-06"
//     },
//     {
//       "type": "collector_signature",
//       "value": "Tel Jeffcuet",
//       "confidence": 0.9938,
//       "normalized_value": null
//     },
//     {
//       "type": "data_delverable_level3",
//       "value": "[Level III",
//       "confidence": 0.9921,
//       "normalized_value": null
//     },
//     {
//       "type": "project_name",
//       "value": "Well\nInvestigation",
//       "confidence": 0.9917,
//       "normalized_value": null
//     },
//     {
//       "type": "analysis_request_4",
//       "value": "TAL 6020",
//       "confidence": 0.9863,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_4",
//       "value": "Sw\n-\n12",
//       "confidence": 0.9868,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_6_comp",
//       "value": "C",
//       "confidence": 0.9852,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_1_matrix",
//       "value": "GW",
//       "confidence": 0.976,
//       "normalized_value": null
//     },
//     {
//       "type": "data_deliverable_level2",
//       "value": "[] Level II",
//       "confidence": 0.9632,
//       "normalized_value": null
//     },
//     {
//       "type": "analysis_request_1",
//       "value": "TCL 8260",
//       "confidence": 0.9573,
//       "normalized_value": null
//     },
//     {
//       "type": "street_address",
//       "value": "32 Hill Road\nGreer sc 29602",
//       "confidence": 0.9558,
//       "normalized_value": null
//     },
//     {
//       "type": "analysis_request_3",
//       "value": "8015",
//       "confidence": 0.9309,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_1_comp",
//       "value": "G",
//       "confidence": 0.9134,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_3",
//       "value": "MW\n-\n22",
//       "confidence": 0.9049,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_10_matrix",
//       "value": "GW G",
//       "confidence": 0.8743,
//       "normalized_value": null
//     },
//     {
//       "type": "data_deliverable_equis",
//       "value": "[ ] EQUIS",
//       "confidence": 0.6088,
//       "normalized_value": null
//     },
//     {
//       "type": "customer_sample_id_3_end_date",
//       "value": "4-6-24",
//       "confidence": 0.5675,
//       "normalized_value": "2024-04-06"
//     }
//   ]
//   return (
//     <div style={{
//       padding: "16px",
//       maxHeight: "65vh",
//       overflowY: "auto",
//       backgroundColor: "#f8fafc"
//     }}>
//       <SpreadsheetTable
//         title="Company & Location Information"
//         items={sections.companyLocationInfo}
//         sectionType="companyLocationInfo"
//         onFieldChange={onFieldChange}
//         onRemoveField={onRemoveField}
//         editable={editable}
//       />

//       <SpreadsheetTable
//         title="Contact & Project Information"
//         items={sections.contactProjectInfo}
//         sectionType="contactProjectInfo"
//         onFieldChange={onFieldChange}
//         onRemoveField={onRemoveField}
//         editable={editable}
//       />

//       <SpreadsheetTable
//         title="Data Deliverables"
//         items={sections.dataDeliverables}
//         sectionType="dataDeliverables"
//         onFieldChange={onFieldChange}
//         onRemoveField={onRemoveField}
//         editable={editable}
//       />

//       <SpreadsheetTable
//         title="Container Information"
//         items={sections.containerInfo}
//         sectionType="containerInfo"
//         onFieldChange={onFieldChange}
//         onRemoveField={onRemoveField}
//         editable={editable}
//       />

//       <SampleDataTable
//         items={sections.collectedSampleDataInfo}
//         onFieldChange={onFieldChange}
//         onRemoveField={onRemoveField}
//         editable={editable}
//       />
//     </div>
//   );
// };

// // Keep the original EditableTable for backward compatibility
// const EditableTable: React.FC<EditableTableProps> = ({
//   fields,
//   onFieldChange,
//   onRemoveField,
//   editable = true,
// }) => {
//   return (
//     <div
//       style={{
//         overflowX: "auto",
//         marginTop: "16px",
//         maxHeight: "55vh",
//         border: "1px solid #e5e7eb",
//         borderRadius: "8px",
//         boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//       }}
//     >
//       <table
//         style={{
//           width: "100%",
//           borderCollapse: "collapse",
//           backgroundColor: "#ffffff",
//           border: "1px solid #e5e7eb",
//           borderRadius: "8px",
//           boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//         }}
//       >
//         <thead>
//           <tr>
//             <th
//               style={{
//                 textAlign: "left",
//                 padding: "12px",
//                 borderBottom: "2px solid #e5e7eb",
//                 fontSize: "14px",
//                 fontWeight: "600",
//                 color: "#374151",
//                 backgroundColor: "#f3f4f6",
//                 position: "sticky",
//                 top: 0,
//                 zIndex: 1,
//               }}
//             >
//               Key
//             </th>
//             <th
//               style={{
//                 textAlign: "left",
//                 padding: "12px",
//                 borderBottom: "2px solid #e5e7eb",
//                 fontSize: "14px",
//                 fontWeight: "600",
//                 color: "#374151",
//                 backgroundColor: "#f3f4f6",
//                 position: "sticky",
//                 top: 0,
//                 zIndex: 1,
//               }}
//             >
//               Value
//             </th>
//             <th
//               style={{
//                 textAlign: "left",
//                 padding: "12px",
//                 borderBottom: "2px solid #e5e7eb",
//                 fontSize: "14px",
//                 fontWeight: "600",
//                 color: "#374151",
//                 backgroundColor: "#f3f4f6",
//                 position: "sticky",
//                 top: 0,
//                 zIndex: 1,
//               }}
//             >
//               Confidence
//             </th>
//             {editable && (
//               <th
//                 style={{
//                   textAlign: "left",
//                   padding: "12px",
//                   borderBottom: "2px solid #e5e7eb",
//                   fontSize: "14px",
//                   fontWeight: "600",
//                   color: "#374151",
//                   backgroundColor: "#f3f4f6",
//                   position: "sticky",
//                   top: 0,
//                   zIndex: 1,
//                 }}
//               >
//                 Actions
//               </th>
//             )}
//           </tr>
//         </thead>
//         <tbody>
//           {fields.map((field, index) => (
//             <tr key={field.id}>
//               <td
//                 style={{
//                   padding: "12px",
//                   borderBottom: "1px solid #e5e7eb",
//                   fontSize: "14px",
//                   color: "#374151",
//                 }}
//               >
//                 {field.displayName || field.key}
//               </td>
//               <td
//                 style={{
//                   padding: "12px",
//                   borderBottom: "1px solid #e5e7eb",
//                   fontSize: "14px",
//                   color: "#374151",
//                 }}
//               >
//                 <input
//                   type="text"
//                   value={field.value}
//                   disabled={!editable}
//                   onChange={(e) => onFieldChange?.(index, e.target.value)}
//                   style={{
//                     width: "100%",
//                     border: "1px solid #d1d5db",
//                     borderRadius: "4px",
//                     padding: "6px",
//                     fontSize: "14px",
//                     outline: "none",
//                     minWidth: editable ? "200px" : "300px",
//                   }}
//                 />
//               </td>
//               <td
//                 style={{
//                   padding: "12px",
//                   borderBottom: "1px solid #e5e7eb",
//                   fontSize: "14px",
//                   color: "#374151",
//                 }}
//               >
//                 {Math.round(field.confidence * 100)}%
//               </td>
//               {editable && (
//                 <td
//                   style={{
//                     padding: "12px",
//                     borderBottom: "1px solid #e5e7eb",
//                     fontSize: "14px",
//                     color: "#ef4444",
//                     textAlign: "center",
//                   }}
//                 >
//                   <button
//                     onClick={() => onRemoveField?.(index)}
//                     style={{
//                       backgroundColor: "#ef4444",
//                       color: "white",
//                       padding: "6px 12px",
//                       borderRadius: "4px",
//                       border: "none",
//                       fontSize: "14px",
//                       cursor: "pointer",
//                       transition: "background-color 0.2s ease",
//                     }}
//                     onMouseOver={(e) =>
//                       (e.currentTarget.style.backgroundColor = "#dc2626")
//                     }
//                     onMouseOut={(e) =>
//                       (e.currentTarget.style.backgroundColor = "#ef4444")
//                     }
//                   >
//                     Remove
//                   </button>
//                 </td>
//               )}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default EditableTable;
