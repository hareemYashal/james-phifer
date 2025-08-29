// Data interfaces
export interface V2DataRowData {
    id: string;
    fieldName: string;
    value: string;
    confidence: number;
    section: string;
    type?: string;
    originalIndex?: number;
}

// Helper function to transform extracted_fields data
export const transformV2Data = (extractedFields: any[]): V2DataRowData[] => {
    const combinedData: V2DataRowData[] = [];

    console.log('transformV2Data input:', extractedFields.length, 'fields');

    // Transform extracted fields into grid rows
    extractedFields.forEach((field, index) => {
        combinedData.push({
            id: `field_${index}`,
            fieldName: field.key || "",
            value: field.value || "",
            confidence: 0.95, // Default confidence since it's not in the data
            section: "Extracted Fields", // Single section for now
            type: field.type || "",
            originalIndex: index,
        });
    });

    console.log('transformV2Data output:', combinedData.length, 'rows');
    return combinedData;
};
