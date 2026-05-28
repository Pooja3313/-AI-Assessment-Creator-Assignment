"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw, Sparkles, ChevronLeft, Eye, BookOpen } from "lucide-react";
import type { Assignment } from "@vedaai/types";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAssignmentSocket } from "@/hooks/useAssignmentSocket";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { QuestionPaper } from "@/components/QuestionPaper";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ResultPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"paper" | "answers">("paper");
  const [tabAnimating, setTabAnimating] = useState(false);
  const { currentAssignment, status, progress, progressMessage, setAssignment, setStatus, submitAssignment } = useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  useAssignmentSocket(assignmentId);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const res = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
        if (!res.ok) throw new Error("Not found");
        const data = (await res.json()) as Assignment;
        setAssignment(data);
        if (data.status === "completed") setStatus("completed", 100, "Assessment ready");
        else if (data.status === "processing") setStatus("processing", 30, "Generating...");
        else if (data.status === "failed") setStatus("failed", 0, "Generation failed");
        else setStatus("pending", 5, "Waiting...");
      } catch { setStatus("failed", 0, "Could not load assignment"); }
      finally { setLoading(false); }
    }
    fetchAssignment();
  }, [assignmentId, setAssignment, setStatus]);

  const assignment = currentAssignment;
  const isGenerating = loading || status === "pending" || status === "processing";

  async function handleRegenerate() {
    if (!assignment?.input) return;
    setRegenerating(true);
    try { const newId = await submitAssignment(assignment.input); router.push(`/result/${newId}`); }
    catch { setStatus("failed", 0, "Failed to regenerate"); }
    finally { setRegenerating(false); }
  }

  function switchTab(tab: "paper" | "answers") {
    if (tab === viewMode || tabAnimating) return;
    setTabAnimating(true);
    setViewMode(tab);
    setTimeout(() => setTabAnimating(false), 400);
  }

  const dueDate = assignment?.metadata?.dueDate ? new Date(assignment.metadata.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/assignments" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black text-sm font-medium transition-all hover:gap-2 group">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back
            </Link>
            <div className="flex gap-2">
              {assignment && status === "completed" && viewMode === "answers" && (
                <PdfDownloadButton assignment={assignment} showAnswerKey={true} />
              )}
              {assignment && status === "completed" && (
                <PdfDownloadButton assignment={assignment} />
              )}
            </div>
          </div>
          {assignment && (
            <div className="animate-fadeInUp">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{assignment.metadata.topic}</h1>
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="font-semibold text-white bg-black px-3.5 py-1 rounded-full text-xs">{assignment.metadata.subject}</span>
                <span className="text-gray-300">|</span>
                <span className="font-semibold text-gray-500">{assignment.metadata.gradeLevel}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Due: <span className="font-semibold text-gray-900">{dueDate}</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:px-8">
        {isGenerating && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center animate-scaleIn">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-gray-900 animate-rotateY" />
                <div className="absolute inset-0 bg-black/5 rounded-full animate-ping" />
              </div>
            </div>
            <div className="max-w-lg mx-auto space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 animate-slideUp">Generating Your Assessment</h2>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
                <p className="text-base text-gray-700">{progress}%</p>
              </div>
              <p className="text-sm text-gray-500">{progressMessage || "Generating..."}</p>
            </div>
          </div>
        )}

        {status === "failed" && !isGenerating && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center animate-shake">
            <p className="text-lg font-semibold text-red-800 mb-6">{progressMessage || "Something went wrong"}</p>
            <Button onClick={handleRegenerate} disabled={regenerating} className="gap-2 bg-red-600 hover:bg-red-700 rounded-full animate-glow">
              {regenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating...</> : <><RefreshCw className="h-4 w-4" /> Try Again</>}
            </Button>
          </div>
        )}

        {status === "completed" && assignment && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button onClick={() => switchTab("paper")}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all duration-300 ${viewMode === "paper" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"}`}>
                <Eye className={`h-4 w-4 transition-transform duration-300 ${viewMode === "paper" ? "scale-110" : ""}`} /> Question Paper
              </button>
              <button onClick={() => switchTab("answers")}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all duration-300 ${viewMode === "answers" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"}`}>
                <BookOpen className={`h-4 w-4 transition-transform duration-300 ${viewMode === "answers" ? "scale-110" : ""}`} /> Answer Key
              </button>
            </div>
            <div className={`transition-all duration-400 ease-in-out ${viewMode === "paper" ? "animate-slideInRight" : "animate-slideInLeft"}`} key={viewMode}>
              {viewMode === "paper" ? (
                <QuestionPaper sections={assignment.sections} title={assignment.metadata.topic} subject={assignment.metadata.subject} gradeLevel={assignment.metadata.gradeLevel} showAnswerKey={false} />
              ) : (
                <QuestionPaper sections={assignment.sections} title={`${assignment.metadata.topic} - Answer Key`} subject={assignment.metadata.subject} gradeLevel={assignment.metadata.gradeLevel} showAnswerKey={true} />
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-8 pb-4">
              <Button onClick={handleRegenerate} disabled={regenerating} variant="outline" className="gap-2 rounded-full border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-all duration-300 hover:scale-105">
                {regenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating...</> : <><RefreshCw className="h-4 w-4" /> Regenerate</>}
              </Button>
              <div className="flex gap-2">
                {viewMode === "answers" && <PdfDownloadButton assignment={assignment} showAnswerKey={true} />}
                <PdfDownloadButton assignment={assignment} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}