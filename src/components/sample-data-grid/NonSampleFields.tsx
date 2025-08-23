import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { NonSampleFieldData } from "@/lib/sample-data-utils";

const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => (
  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
      style={{ width: `${confidence * 100}%` }}
    />
  </div>
);

interface NonSampleFieldsProps {
  nonSampleData: NonSampleFieldData[];
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

export const NonSampleFields: React.FC<NonSampleFieldsProps> = ({
  nonSampleData,
  onFieldChange,
  onRemoveField,
}) => {
  if (nonSampleData.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border border-blue-200 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-2 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
        <h4 className="text-lg font-bold text-gray-800 tracking-wide">
          General Information
        </h4>
      </div>
      <div className="space-y-4">
        {nonSampleData.map((field) => (
          <div
            key={field.id}
            className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                {field.fieldName}
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onRemoveField?.(field.sectionType, field.originalIndex)
                }
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-full opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="text"
              aria-label={field.fieldName}
              value={field.value}
              onChange={(e) =>
                onFieldChange?.(
                  field.sectionType,
                  field.originalIndex,
                  e.target.value
                )
              }
              className="w-full text-sm border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
            />
            {field.confidence && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Confidence:</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                      data-confidence={field.confidence}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {Math.round(field.confidence * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
