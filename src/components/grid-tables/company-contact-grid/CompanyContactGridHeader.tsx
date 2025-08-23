import React from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Trash2 } from "lucide-react";
import type { CompanyContactRowData } from "@/lib/company-contact-utils";

interface CompanyContactGridHeaderProps {
  selectedRows: CompanyContactRowData[];
  onExport: () => void;
  onDeleteSelected: () => void;
}

export const CompanyContactGridHeader: React.FC<
  CompanyContactGridHeaderProps
> = ({ selectedRows, onExport, onDeleteSelected }) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>Company & Location + Contact & Project Information</span>
        <div className="flex gap-2">
          {/* <Button onClick={onExport} size="sm" variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button> */}
          {selectedRows.length > 0 && (
            <Button onClick={onDeleteSelected} size="sm" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedRows.length})
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );
};
