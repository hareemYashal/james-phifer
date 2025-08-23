import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const ActionsCellRenderer = (params: any) => {
  const { onRemoveField } = params.context || {};

  const onDelete = () => {
    if (
      onRemoveField &&
      params.data.sectionType !== undefined &&
      params.data.originalIndex !== undefined
    ) {
      onRemoveField(params.data.sectionType, params.data.originalIndex);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
