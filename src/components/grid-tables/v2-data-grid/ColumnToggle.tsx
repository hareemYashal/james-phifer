import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ColumnToggleProps {
  columns: { field: string; headerName: string }[];
  visibleMap: Record<string, boolean>;
  onToggle: (field: string, visible: boolean) => void;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, visibleMap, onToggle }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        Columns
      </Button>
      {open && (
        <Card style={{ position: "absolute", zIndex: 10, minWidth: 180, padding: 8, top: 36, left: 0 }}>
          <div className="space-y-2">
            {columns.map((col) => (
              <label key={col.field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleMap[col.field] ?? true}
                  onChange={(e) => onToggle(col.field, e.target.checked)}
                  disabled={col.field === "fieldName"} // always show key field
                />
                {col.headerName}
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
