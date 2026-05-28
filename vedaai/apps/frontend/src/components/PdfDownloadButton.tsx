"use client";

import dynamic from "next/dynamic";
import { Download, Loader2, FileKey } from "lucide-react";
import type { Assignment } from "@vedaai/types";
import { AssignmentPDFDocument } from "@/components/AssignmentPDF";
import { Button } from "@/components/ui/button";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Props {
  assignment: Assignment;
  showAnswerKey?: boolean;
}

export function PdfDownloadButton({ assignment, showAnswerKey = false }: Props) {
  const dateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  const suffix = showAnswerKey ? "_Answer_Key" : "";
  const fileName = `${assignment.metadata.topic}${suffix}_${dateStr}.pdf`.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <PDFDownloadLink document={<AssignmentPDFDocument assignment={assignment} showAnswerKey={showAnswerKey} />} fileName={fileName}>
      {({ loading }) => (
        <Button disabled={loading}
          className={`gap-2 rounded-full ${showAnswerKey ? "bg-gray-700 hover:bg-gray-800" : "bg-black hover:bg-gray-800"} text-white transition-all hover:scale-105`}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : showAnswerKey ? <FileKey className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {loading ? "Preparing..." : showAnswerKey ? "Download Answer Key" : "Download as PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}