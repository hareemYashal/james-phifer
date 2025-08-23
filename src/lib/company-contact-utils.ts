import { formatEntityTypeToDisplayName } from "@/lib/utils";

// Data interfaces
export interface CompanyContactRowData {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  section: string;
  sectionType?: string;
  originalIndex?: number;
}

// Helper function to transform data
export const transformCompanyContactData = (
  companyLocationInfo: any[],
  contactProjectInfo: any[]
): CompanyContactRowData[] => {
  const combinedData: CompanyContactRowData[] = [];

  // Add company location info
  companyLocationInfo.forEach((item, index) => {
    combinedData.push({
      id: `company_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Company & Location Information",
      sectionType: "companyLocationInfo",
      originalIndex: index,
    });
  });

  // Add contact project info
  contactProjectInfo.forEach((item, index) => {
    combinedData.push({
      id: `contact_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Contact & Project Information",
      sectionType: "contactProjectInfo",
      originalIndex: index,
    });
  });

  return combinedData;
};

// Sample data for when no real data is available
export const getSampleCompanyContactData = (): CompanyContactRowData[] => [
  {
    id: "sample_1",
    fieldName: "Company Name",
    value: "Pinnacle Consultants",
    confidence: 1.0,
    section: "Company & Location Information",
    sectionType: "companyLocationInfo",
    originalIndex: 0,
  },
  {
    id: "sample_2",
    fieldName: "Street Address",
    value: "32 Hill Road Greer sc 29602",
    confidence: 1.0,
    section: "Company & Location Information",
    sectionType: "companyLocationInfo",
    originalIndex: 1,
  },
  {
    id: "sample_3",
    fieldName: "Customer Project #",
    value: "P-102",
    confidence: 1.0,
    section: "Company & Location Information",
    sectionType: "companyLocationInfo",
    originalIndex: 2,
  },
  {
    id: "sample_4",
    fieldName: "Project Name",
    value: "WellInvestigation",
    confidence: 1.0,
    section: "Company & Location Information",
    sectionType: "companyLocationInfo",
    originalIndex: 3,
  },
  {
    id: "sample_5",
    fieldName: "Contact/Report To",
    value: "Ted Jeffcoat",
    confidence: 1.0,
    section: "Contact & Project Information",
    sectionType: "contactProjectInfo",
    originalIndex: 0,
  },
  {
    id: "sample_6",
    fieldName: "Phone #",
    value: "803-232-XXXX",
    confidence: 1.0,
    section: "Contact & Project Information",
    sectionType: "contactProjectInfo",
    originalIndex: 1,
  },
];
