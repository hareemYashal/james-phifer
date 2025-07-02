"use client"
import dynamic from "next/dynamic";

const PdfViewerClient = dynamic(() => import("@/components/pdf-viewer/pdf"), {
  ssr: false,
});

export default function Page() {
  return <PdfViewerClient />;
}
