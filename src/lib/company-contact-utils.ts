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
  contactProjectInfo: any[],
  dataDeliverables: any[],
  containerInfo: any[]
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

  // Add data deliverables
  dataDeliverables.forEach((item, index) => {
    combinedData.push({
      id: `deliverable_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Data Deliverables",
      sectionType: "dataDeliverables",
      originalIndex: index,
    });
  });

  // Add container info
  containerInfo.forEach((item, index) => {
    combinedData.push({
      id: `container_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Container Information",
      sectionType: "containerInfo",
      originalIndex: index,
    });
  });

  return combinedData;
};
