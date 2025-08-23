import React from "react";

export const ConfidenceCellRenderer = (params: any) => {
  const confidence = params.value;
  const percentage = Math.round(confidence * 100);
  const color =
    percentage >= 90
      ? "text-green-600"
      : percentage >= 70
      ? "text-yellow-600"
      : "text-red-600";
  return <span className={color}>{percentage}%</span>;
};
