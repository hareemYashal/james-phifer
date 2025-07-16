import PdfViewerClient from "@/components/pdf-viewer/pdf";
import { fetchUserDetails } from "@/lib/actions/auth";

export default async function Page() {
  return <PdfViewerClient />;
}
