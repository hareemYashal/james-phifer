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
import { Label } from "@/components/ui/label";
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
          {columns.map((col) => {
            if (col.headerName.toLowerCase() === "actions") return null;
            return (
              <div className="flex items-center gap-3  hover:bg-gray-100 rounded-md cursor-pointer" key={col.field}>
                <Checkbox className="ml-2" id={col.field} checked={visibleMap[col.field] ?? true} onCheckedChange={(checked) => onToggle(col.field, checked as boolean)} />

                <Label className="text-sm w-full capitalize py-2 hover:text-primary cursor-pointer" htmlFor={col.field}>
                  {col.headerName?.replace(/_/g, " ")}

                </Label>
              </div>

            )
          })}



        </DropdownMenuContent>
      </DropdownMenu>
    </div>

  );
};
