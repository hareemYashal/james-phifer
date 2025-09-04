import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APIURL, FASTAPIURL } from "./constant";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function processFastAPI(file: File, abortSignal?: AbortSignal): Promise<any> {
  try {
    console.log("🚀 Attempting to call FastAPI at:", `${FASTAPIURL}/extract`);
    console.log("📁 File details:", { name: file?.name, size: file?.size, type: file?.type });

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${FASTAPIURL}/extract`, {
      method: "POST",
      body: formData,
      signal: abortSignal,
      // Add any headers your API requires
      headers: {
        // 'Authorization': 'Bearer your-token',
        // 'X-API-Key': 'your-api-key',
      },
    });

    console.log("📡 Response status:", response?.status);
    console.log("📡 Response ok:", response?.ok);

    if (!response?.ok) {
      const errorText = await response?.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`API Error: ${response?.status} ${response?.statusText} - ${errorText}`);
    }

    const result = await response?.json();
    return result;
  } catch (error) {
    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.log("🛑 API request was aborted");
      return {
        success: false,
        error: "Request was cancelled",
        aborted: true,
      };
    }

    console.error("❌ FASTAPIURL processing error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error?.message : "Unknown error",
      name: error instanceof Error ? error?.name : "Unknown",
      stack: error instanceof Error ? error?.stack : "No stack trace"
    });
    return {
      success: false,
      error: error instanceof Error ? error?.message : "Unknown error occurred",
    };
  }
}

export async function processDocumentAPI(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("extractCoordinates", "true");
    formData.append("extractKeyValue", "true");
    formData.append("includeRegions", "true");

    const response = await fetch(`${APIURL}/process-document`, {
      method: "POST",
      body: formData,
      // Add any headers your API requires
      headers: {
        // 'Authorization': 'Bearer your-token',
        // 'X-API-Key': 'your-api-key',
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Document processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Utility function to convert display names to database-friendly keys
export function toDatabaseKey(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

// entities mapping. func:

// Enhanced function to extract key-value pairs from full text
export function extractKeyValuePairsFromText(
  text: string
): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];

  // Split text into lines and look for patterns
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip very short lines
    if (line.length < 3) continue;

    // Look for "Label:" or "Label :" patterns
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      const key = colonMatch[1].trim();
      const value = colonMatch[2].trim();
      if (key.length > 1 && value.length > 0 && !isCommonWord(key)) {
        pairs.push({ key, value });
      }
    }

    // Look for invoice-specific patterns
    const invoiceNumberMatch = line.match(/Invoice\s+number\s+([A-Z0-9-]+)/i);
    if (invoiceNumberMatch) {
      pairs.push({ key: "Invoice Number", value: invoiceNumberMatch[1] });
    }

    const dateMatch = line.match(/Date\s+of\s+issue\s+(.+)/i);
    if (dateMatch) {
      pairs.push({ key: "Date of Issue", value: dateMatch[1].trim() });
    }

    const dueDateMatch = line.match(/Date\s+due\s+(.+)/i);
    if (dueDateMatch) {
      pairs.push({ key: "Date Due", value: dueDateMatch[1].trim() });
    }

    // Look for amounts
    const amountMatch = line.match(/([C$]+[\d,]+\.[\d]{2})/g);
    if (amountMatch) {
      amountMatch.forEach((amount, index) => {
        if (line.toLowerCase().includes("total")) {
          pairs.push({ key: "Total Amount", value: amount });
        } else if (line.toLowerCase().includes("subtotal")) {
          pairs.push({ key: "Subtotal", value: amount });
        } else if (line.toLowerCase().includes("due")) {
          pairs.push({ key: "Amount Due", value: amount });
        } else {
          pairs.push({ key: `Amount ${index + 1}`, value: amount });
        }
      });
    }

    // Look for addresses (lines with postal codes or common address patterns)
    if (
      line.match(/\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/) ||
      line.match(
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i
      )
    ) {
      pairs.push({ key: "Address", value: line });
    }

    // Look for phone numbers
    const phoneMatch = line.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      pairs.push({ key: "Phone Number", value: phoneMatch[1] });
    }

    // Look for email addresses
    const emailMatch = line.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (emailMatch) {
      pairs.push({ key: "Email Address", value: emailMatch[1] });
    }

    // Look for dates in various formats
    const generalDateMatch = line.match(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/i
    );
    if (
      generalDateMatch &&
      !pairs.some((p) => p.value === generalDateMatch[1])
    ) {
      pairs.push({ key: "Date", value: generalDateMatch[1] });
    }
  }

  // Look for multi-line patterns
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    // Check if current line is a label and next line is the value
    if (
      currentLine.length > 0 &&
      currentLine.length < 50 &&
      !currentLine.includes(":") &&
      nextLine.length > 0 &&
      nextLine.length < 100 &&
      !isCommonWord(currentLine)
    ) {
      // Skip if it looks like a continuation of previous content
      if (
        !currentLine.match(/^\d/) &&
        !nextLine.match(/^\d/) &&
        !pairs.some((p) => p.key === currentLine || p.value === nextLine)
      ) {
        pairs.push({ key: currentLine, value: nextLine });
      }
    }
  }

  return pairs;
}

// Helper function to check if a word is too common to be useful
export function isCommonWord(text: string): boolean {
  const commonWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "this",
    "that",
    "these",
    "those",
    "here",
    "there",
    "where",
    "when",
    "why",
    "how",
    "page",
    "total",
    "amount",
    "description",
    "qty",
    "quantity",
    "price",
    "unit",
  ];
  return commonWords.includes(text.toLowerCase()) || text.length < 2;
}

// Efficient entity type to display name mapping for optimal performance
const ENTITY_TYPE_DISPLAY_MAPPING: Record<string, string> = {
  // 1) Company & Location Information
  'location_requested': 'City/State',
  'company_name': 'Company Name',
  'street_address': 'Street Address',
  'customer_project_no': 'Customer Project #',
  'project_name': 'Project Name',
  'site_collection_info': 'Site Collection Info/ Faculty ID ( as applicable )',

  // 2) Contact & Project Information
  'contact_to': 'Contact/Report To',
  'phone_number': 'Phone #',
  'cc_email': 'E-Mail',
  'invoice_to': 'Invoice to',
  'invoice_email': 'Invoice E-mail',
  'purchase_order_no': 'Purchase Order # ( if applicable )',
  'quote_no': 'Quote #',
  'country_state_origin': 'Country/ State origin of sample(s)',
  'regulatory_program': 'Regulatory Program ( DW, RCRA, etc ) as applicable',
  'additional_instructions_from_pace': 'Additional Instructions from pace',

  // 3) Data Deliverables
  'date_deliverables_level2': 'Level II',
  'date_deliverables_level3': 'Level III',
  'date_deliverables_level4': 'Level IV',
  'date_deliverables_equis': 'EQUIS',
  'date_deliverables_other': 'Others',
  'date_result': 'Date Results Requested',

  // 4) Container Information
  'container_size': 'Specify Container Size',
  'container_preservative_tyoe': 'Identify Container Preservative Type',

  // 5) Collected Sample Data Information and Analysis Request (first 2 values)
  'collected_name': 'Collected By:',
  'collector_signature': 'Signature'
};

// Helper function to convert entity type to display name with efficient lookup
export function formatEntityTypeToDisplayName(entityType: string): string {
  // Use mapping for specified entities, fallback to original formatting for others
  if (ENTITY_TYPE_DISPLAY_MAPPING[entityType]) {
    return ENTITY_TYPE_DISPLAY_MAPPING[entityType];
  }

  // Fallback to original formatting for unmapped entities
  return entityType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to categorize text based on content
export function categorizeText(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("invoice") || lowerText.includes("number")) {
    return "invoice";
  }
  if (
    lowerText.includes("phone") ||
    lowerText.includes("tel") ||
    /\d{3}-\d{3}-\d{4}/.test(text)
  ) {
    return "contact";
  }
  if (lowerText.includes("email") || lowerText.includes("@")) {
    return "contact";
  }
  if (
    lowerText.includes("address") ||
    lowerText.includes("street") ||
    lowerText.includes("city")
  ) {
    return "address";
  }
  if (
    lowerText.includes("date") ||
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text)
  ) {
    return "dates";
  }
  if (
    lowerText.includes("amount") ||
    lowerText.includes("total") ||
    lowerText.includes("$") ||
    lowerText.includes("c$")
  ) {
    return "financial";
  }
  if (
    lowerText.includes("company") ||
    lowerText.includes("corp") ||
    lowerText.includes("inc")
  ) {
    return "company";
  }

  return "other";
}

// Helper function to categorize entities into sections based on AI engineer's provide hard-coded values and specifications.
export function categorizeEntitiesIntoSections(entities: any[]): {
  companyLocationInfo: any[];
  contactProjectInfo: any[];
  dataDeliverables: any[];
  containerInfo: any[];
  collectedSampleDataInfo: any[];
} {
  const sections = {
    companyLocationInfo: [] as any[],
    contactProjectInfo: [] as any[],
    dataDeliverables: [] as any[],
    containerInfo: [] as any[],
    collectedSampleDataInfo: [] as any[]
  };

  // Define exact field mappings for each section (in desired display order)
  const sectionMapping = {
    // 1) Company & Location Information
    companyLocationInfo: [
      'location_requested',
      'company_name',
      'street_address',
      'customer_project_no',
      'project_name',
      'site_collection_info'
    ],

    // 2) Contact & Project Information
    contactProjectInfo: [
      'contact_to',
      'phone_number',
      'cc_email',
      'invoice_to',
      'invoice_email',
      'purchase_order_no',
      'quote_no',
      'country_state_origin',
      'regulatory_program',
      'additional_instructions_from_pace'
    ],

    // 3) Data Deliverables
    dataDeliverables: [
      'date_deliverables_level2',
      'date_deliverables_level3',
      'date_deliverables_level4',
      'date_deliverables_equis',
      'date_deliverables_other',
      'date_result'
    ],

    // 4) Container Information
    containerInfo: [
      'container_size',
      'container_preservative_tyoe'
    ],

    // 5) Collected Sample Data Information and Analysis Request
    collectedSampleDataInfo: [
      'collected_name',
      'collector_signature',
      'customer_sample_id_1',
      'customer_sample_id_2',
      'customer_sample_id_3',
      'customer_sample_id_4',
      'customer_sample_id_5',
      'customer_sample_id_6',
      'customer_sample_id_7',
      'customer_sample_id_8',
      'customer_sample_id_9',
      'customer_sample_id_10',
      'customer_sample_id_1_matrix',
      'customer_sample_id_2_matrix',
      'customer_sample_id_3_matrix',
      'customer_sample_id_4_matrix',
      'customer_sample_id_5_matrix',
      'customer_sample_id_6_matrix',
      'customer_sample_id_7_matrix',
      'customer_sample_id_8_matrix',
      'customer_sample_id_9_matrix',
      'customer_sample_id_10_matrix',
      'customer_sample_id_1_comp',
      'customer_sample_id_2_comp',
      'customer_sample_id_3_comp',
      'customer_sample_id_4_comp',
      'customer_sample_id_5_comp',
      'customer_sample_id_6_comp',
      'customer_sample_id_7_comp',
      'customer_sample_id_8_comp',
      'customer_sample_id_9_comp',
      'customer_sample_id_10_comp',
      'customer_sample_id_1_start_date',
      'customer_sample_id_2_start_date',
      'customer_sample_id_3_start_date',
      'customer_sample_id_4_start_date',
      'customer_sample_id_5_start_date',
      'customer_sample_id_6_start_date',
      'customer_sample_id_7_start_date',
      'customer_sample_id_8_start_date',
      'customer_sample_id_9_start_date',
      'customer_sample_id_10_start_date',
      'customer_sample_id_1_start_time',
      'customer_sample_id_2_start_time',
      'customer_sample_id_3_start_time',
      'customer_sample_id_4_start_time',
      'customer_sample_id_5_start_time',
      'customer_sample_id_6_start_time',
      'customer_sample_id_7_start_time',
      'customer_sample_id_8_start_time',
      'customer_sample_id_9_start_time',
      'customer_sample_id_10_start_time',
      'customer_sample_id_1_end_date',
      'customer_sample_id_2_end_date',
      'customer_sample_id_3_end_date',
      'customer_sample_id_4_end_date',
      'customer_sample_id_5_end_date',
      'customer_sample_id_6_end_date',
      'customer_sample_id_7_end_date',
      'customer_sample_id_8_end_date',
      'customer_sample_id_9_end_date',
      'customer_sample_id_10_end_date',
      'customer_sample_id_1_end_time',
      'customer_sample_id_2_end_time',
      'customer_sample_id_3_end_time',
      'customer_sample_id_4_end_time',
      'customer_sample_id_5_end_time',
      'customer_sample_id_6_end_time',
      'customer_sample_id_7_end_time',
      'customer_sample_id_8_end_time',
      'customer_sample_id_9_end_time',
      'customer_sample_id_10_end_time',
      'sample_id_1_no_of_container',
      'sample_id_2_no_of_container',
      'sample_id_3_no_of_container',
      'sample_id_4_no_of_container',
      'sample_id_5_no_of_container',
      'sample_id_6_no_of_container',
      'sample_id_7_no_of_container',
      'sample_id_8_no_of_container',
      'sample_id_9_no_of_container',
      'sample_id_10_no_of_container',
      'analysis_request_1',
      'analysis_request_2',
      'analysis_request_3',
      'analysis_request_4',
      'analysis_request_5',
      'analysis_request_6',
      'analysis_request_7',
      'analysis_request_8',
      'analysis_request_9',
      'analysis_request_10',
      'Sample01_analysis01',
      'Sample01_analysis02',
      'Sample01_analysis03',
      'Sample01_analysis04',
      'Sample01_analysis05',
      'Sample01_analysis06',
      'Sample01_analysis07',
      'Sample01_analysis08',
      'Sample01_analysis09',
      'Sample01_analysis10',
      'Sample02_analysis01',
      'Sample02_analysis02',
      'Sample02_analysis03',
      'Sample02_analysis04',
      'Sample02_analysis05',
      'Sample02_analysis06',
      'Sample02_analysis07',
      'Sample02_analysis08',
      'Sample02_analysis09',
      'Sample02_analysis10',
      'Sample03_analysis01',
      'Sample03_analysis02',
      'Sample03_analysis03',
      'Sample03_analysis04',
      'Sample03_analysis06',
      'Sample03_analysis07',
      'Sample03_analysis08',
      'Sample03_analysis09',
      'Sample03_analysis10',
      'Sample04_analysis01',
      'Sample04_analysis02',
      'Sample04_analysis03',
      'Sample04_analysis04',
    ]
  };

  entities.forEach(entity => {
    if (!entity.type || entity.value === null) return; // Skip null or missing entities

    const entityType = entity.type; // Use exact field name, 

    // Check each section using strict equality
    if (sectionMapping.companyLocationInfo.includes(entityType)) {
      sections.companyLocationInfo.push(entity);
    }
    else if (sectionMapping.contactProjectInfo.includes(entityType)) {
      sections.contactProjectInfo.push(entity);
    }
    else if (sectionMapping.dataDeliverables.includes(entityType)) {
      sections.dataDeliverables.push(entity);
    }
    else if (sectionMapping.containerInfo.includes(entityType)) {
      sections.containerInfo.push(entity);
    }
    else if (sectionMapping.collectedSampleDataInfo.includes(entityType)) {
      sections.collectedSampleDataInfo.push(entity);
    }
    // No default fallback - only show fields that are explicitly categorized
  });

  // Sort each section by predefined order for consistent display (O(n log n) but only once)
  // This maintains the exact order you specified without affecting performance significantly
  const sortByPredefinedOrder = (sectionKey: keyof typeof sectionMapping, items: any[]) => {
    const orderMap = sectionMapping[sectionKey];
    return items.sort((a, b) => {
      const indexA = orderMap.indexOf(a.type);
      const indexB = orderMap.indexOf(b.type);
      return indexA - indexB;
    });
  };

  return {
    companyLocationInfo: sortByPredefinedOrder('companyLocationInfo', sections.companyLocationInfo),
    contactProjectInfo: sortByPredefinedOrder('contactProjectInfo', sections.contactProjectInfo),
    dataDeliverables: sortByPredefinedOrder('dataDeliverables', sections.dataDeliverables),
    containerInfo: sortByPredefinedOrder('containerInfo', sections.containerInfo),
    collectedSampleDataInfo: sortByPredefinedOrder('collectedSampleDataInfo', sections.collectedSampleDataInfo)
  };
}

// Helper function to export data to Excel format (CSV for now, can be enhanced)
// NOTE: This function now automatically uses the same mapping and ordering as the UI
// because it uses formatEntityTypeToDisplayName() and receives pre-sorted sections
/** 
export function exportToExcel(sections: any, filename: string = 'extracted_data') {
  let csvContent = '';

  // Add Company & Location Information Section
  // Fields will appear in exact same order as UI: location_requested, company_name, street_address, customer_project_no, project_name, site_collection_info
  csvContent += 'COMPANY & LOCATION INFORMATION\n';
  csvContent += 'Field,Value,Confidence\n';
  sections.companyLocationInfo.forEach((item: any) => {
    const displayName = formatEntityTypeToDisplayName(item.type);
    csvContent += `"${displayName}","${item.value}","${Math.round(item.confidence * 100)}%"\n`;
  });
  csvContent += '\n';

  // Add Contact & Project Information Section  
  // Fields will appear in exact same order as UI
  csvContent += 'CONTACT & PROJECT INFORMATION\n';
  csvContent += 'Field,Value,Confidence\n';
  sections.contactProjectInfo.forEach((item: any) => {
    const displayName = formatEntityTypeToDisplayName(item.type);
    csvContent += `"${displayName}","${item.value}","${Math.round(item.confidence * 100)}%"\n`;
  });
  csvContent += '\n';

  // Add Data Deliverables Section
  // Fields will appear in exact same order as UI: level2, level3, level4, equis, other, date_result
  csvContent += 'DATA DELIVERABLES\n';
  csvContent += 'Field,Value,Confidence\n';
  sections.dataDeliverables.forEach((item: any) => {
    const displayName = formatEntityTypeToDisplayName(item.type);
    csvContent += `"${displayName}","${item.value}","${Math.round(item.confidence * 100)}%"\n`;
  });
  csvContent += '\n';

  // Add Container Information Section
  // Fields will appear in exact same order as UI
  csvContent += 'CONTAINER INFORMATION\n';
  csvContent += 'Field,Value,Confidence\n';
  sections.containerInfo.forEach((item: any) => {
    const displayName = formatEntityTypeToDisplayName(item.type);
    csvContent += `"${displayName}","${item.value}","${Math.round(item.confidence * 100)}%"\n`;
  });
  csvContent += '\n';

  // Add Collected Sample Data Information and Analysis Request Section
  csvContent += 'COLLECTED SAMPLE DATA INFORMATION AND ANALYSIS REQUEST\n';

  // Group sample data by sample number for table format (like the UI)
  const groupedSamples: Record<string, any> = {};
  const nonSampleFields: any[] = [];

  sections.collectedSampleDataInfo.forEach((item: any) => {
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
      nonSampleFields.push(item);
    }

    if (sampleNumber) {
      if (!groupedSamples[sampleNumber]) {
        groupedSamples[sampleNumber] = {};
      }
      groupedSamples[sampleNumber][type] = item;
    }
  });

  // Add non-sample fields first
  if (nonSampleFields.length > 0) {
    csvContent += 'General Information:\n';
    nonSampleFields.forEach(field => {
      const displayName = formatEntityTypeToDisplayName(field.type);
      csvContent += `"${displayName}","${field.value}","${Math.round(field.confidence * 100)}%"\n`;
    });
    csvContent += '\n';
  }

  // Add sample data in table format
  if (Object.keys(groupedSamples).length > 0) {
    csvContent += 'Sample Data Table:\n';
    csvContent += '"Customer Sample ID","Confidence","Matrix","Confidence","Comp/Grab","Confidence","Composite Start(Date)","Confidence","Composite Start(Time)","Confidence","Collected or Composite End(Date)","Confidence","Collected or Composite End(Time)","Confidence","# Cont","Confidence","Method","Confidence"\n';

    const sampleNumbers = Object.keys(groupedSamples).sort((a, b) => parseInt(a) - parseInt(b));

    sampleNumbers.forEach(sampleNum => {
      const sample = groupedSamples[sampleNum];
      const sampleId = sample[`customer_sample_id_${sampleNum}`];
      const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];
      const comp = sample[`customer_sample_id_${sampleNum}_comp`];
      const startDate = sample[`customer_sample_id_${sampleNum}_start_date`];
      const startTime = sample[`customer_sample_id_${sampleNum}_start_time`];
      const endDate = sample[`customer_sample_id_${sampleNum}_end_date`];
      const endTime = sample[`customer_sample_id_${sampleNum}_end_time`];
      const containers = sample[`sample_id_${sampleNum}_no_of_container`];
      const analysisRequest = sample[`analysis_request_${sampleNum}`];

      // Find all active analysis methods for this sample
      const activeAnalysisMethods: any[] = [];

      // Check each analysis method (01-10)
      for (let i = 1; i <= 10; i++) {
        const analysisNum = i.toString().padStart(2, '0');
        const fieldType = `Sample${sampleNum.padStart(2, '0')}_analysis${analysisNum}`;
        let analysisField = sample[fieldType];

        if (!analysisField && groupedSamples[sampleNum.padStart(2, '0')]) {
          analysisField = groupedSamples[sampleNum.padStart(2, '0')][fieldType];
        }

        if (analysisField) {
          const methodValue = analysisField.value || '';
          activeAnalysisMethods.push({
            methodValue,
            analysisField,
            analysisNum
          });
        }
      }

      // Only process if at least one field exists for this sample
      const hasData = sampleId || matrix || comp || startDate || startTime || endDate || endTime || containers || analysisRequest;
      if (!hasData) return;

      // If no active analysis methods, check for fallback analysis_request
      if (activeAnalysisMethods.length === 0) {
        // Use analysis_request as fallback
        if (analysisRequest) {
          csvContent += `"${sampleId?.value || ''}","${sampleId ? Math.round(sampleId.confidence * 100) + '%' : ''}","${matrix?.value || ''}","${matrix ? Math.round(matrix.confidence * 100) + '%' : ''}","${comp?.value || ''}","${comp ? Math.round(comp.confidence * 100) + '%' : ''}","${startDate?.value || ''}","${startDate ? Math.round(startDate.confidence * 100) + '%' : ''}","${startTime?.value || ''}","${startTime ? Math.round(startTime.confidence * 100) + '%' : ''}","${endDate?.value || ''}","${endDate ? Math.round(endDate.confidence * 100) + '%' : ''}","${endTime?.value || ''}","${endTime ? Math.round(endTime.confidence * 100) + '%' : ''}","${containers?.value || ''}","${containers ? Math.round(containers.confidence * 100) + '%' : ''}","${analysisRequest.value || ''}","${Math.round(analysisRequest.confidence * 100) + '%'}"\n`;
        } else {
          // No method data at all
          csvContent += `"${sampleId?.value || ''}","${sampleId ? Math.round(sampleId.confidence * 100) + '%' : ''}","${matrix?.value || ''}","${matrix ? Math.round(matrix.confidence * 100) + '%' : ''}","${comp?.value || ''}","${comp ? Math.round(comp.confidence * 100) + '%' : ''}","${startDate?.value || ''}","${startDate ? Math.round(startDate.confidence * 100) + '%' : ''}","${startTime?.value || ''}","${startTime ? Math.round(startTime.confidence * 100) + '%' : ''}","${endDate?.value || ''}","${endDate ? Math.round(endDate.confidence * 100) + '%' : ''}","${endTime?.value || ''}","${endTime ? Math.round(endTime.confidence * 100) + '%' : ''}","${containers?.value || ''}","${containers ? Math.round(containers.confidence * 100) + '%' : ''}","",""\n`;
        }
      } else {
        // Create a row for each active analysis method
        activeAnalysisMethods.forEach((method) => {
          csvContent += `"${sampleId?.value || ''}","${sampleId ? Math.round(sampleId.confidence * 100) + '%' : ''}","${matrix?.value || ''}","${matrix ? Math.round(matrix.confidence * 100) + '%' : ''}","${comp?.value || ''}","${comp ? Math.round(comp.confidence * 100) + '%' : ''}","${startDate?.value || ''}","${startDate ? Math.round(startDate.confidence * 100) + '%' : ''}","${startTime?.value || ''}","${startTime ? Math.round(startTime.confidence * 100) + '%' : ''}","${endDate?.value || ''}","${endDate ? Math.round(endDate.confidence * 100) + '%' : ''}","${endTime?.value || ''}","${endTime ? Math.round(endTime.confidence * 100) + '%' : ''}","${containers?.value || ''}","${containers ? Math.round(containers.confidence * 100) + '%' : ''}","${method.methodValue}","${method.analysisField ? Math.round(method.analysisField.confidence * 100) + '%' : ''}"\n`;
        });
      }
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
*/