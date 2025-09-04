import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState } from "react";
interface ColumnToggleProps {
  columns: { field: string; headerName: string }[];
  visibleMap: Record<string, boolean>;
  onToggle: (field: string, visible: boolean) => void;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, visibleMap, onToggle }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <DropdownMenu open={open} onOpenChange={setOpen} >
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[230px] p-2">
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((col) => (
            <DropdownMenuItem key={col.field}>
              <Checkbox id={col.field} checked={visibleMap[col.field] ?? true} onCheckedChange={(checked) => onToggle(col.field, checked as boolean)} />
              {col.headerName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

  );
};
