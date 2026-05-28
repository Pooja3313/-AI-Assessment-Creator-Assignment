"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  Sparkles,
  Upload,
  ChevronLeft,
  Plus,
  Minus,
  X,
} from "lucide-react";
import type { QuestionType } from "@vedaai/types";
import { useAssignmentStore } from "@/store/assignmentStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuestionTypeRow {
  id: string;
  type: QuestionType | "";
  count: number;
  marksEach: number;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple Choice Questions" },
  { value: "short_answer", label: "Short Questions" },
  { value: "long_answer", label: "Long Questions" },
  { value: "diagram_based", label: "Diagram/Graph-Based Questions" },
  { value: "numerical", label: "Numerical Problems" },
  { value: "true_false", label: "True/False" },
  { value: "fill_in_blank", label: "Fill in the Blanks" },
];

const FILE_TYPES = "image/jpeg,image/png,application/pdf";

type FormErrors = Record<string, string>;

let rowIdCounter = 0;

function createRow(): QuestionTypeRow {
  rowIdCounter++;
  return { id: `qt-${rowIdCounter}`, type: "", count: 4, marksEach: 1 };
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { formData, setFormField, submitAssignment } = useAssignmentStore();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<string | null>(null);
  const [subject, setSubject] = useState(formData.subject ?? "");
  const [topic, setTopic] = useState(formData.topic ?? "");
  const [gradeLevel, setGradeLevel] = useState(formData.gradeLevel ?? "");
  const [dueDate, setDueDate] = useState(formData.dueDate ?? "");
  const [rows, setRows] = useState<QuestionTypeRow[]>([createRow()]);

  const totalQuestions = rows.reduce((sum, r) => sum + (r.count || 0), 0);
  const totalMarks = rows.reduce(
    (sum, r) => sum + (r.count || 0) * (r.marksEach || 0),
    0
  );

  function handleFileUpload(file: File | null) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "JPEG, PNG, PDF upto 10MB",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: "File size must be less than 10MB" }));
      return;
    }
    setUploadedFileName(file.name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFileData(result);
      setFormField("fileContent", `[Uploaded file: ${file.name}]`);
    };
    reader.readAsDataURL(file);
  }

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(
    id: string,
    field: keyof QuestionTypeRow,
    value: string | number
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!subject.trim()) e.subject = "Subject is required";
    if (!topic.trim()) e.topic = "Topic is required";
    if (!gradeLevel.trim()) e.gradeLevel = "Grade level is required";
    if (!dueDate) {
      e.dueDate = "Due date is required";
    } else {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) e.dueDate = "Due date must be in the future";
    }
    const usedTypes = new Set<string>();
    for (const row of rows) {
      if (!row.type) {
        e[`row-${row.id}-type`] = "Select a question type";
      } else if (usedTypes.has(row.type)) {
        e[`row-${row.id}-type`] = "Duplicate question type";
      } else {
        usedTypes.add(row.type);
      }
      if (row.count < 1) {
        e[`row-${row.id}-count`] = "Min 1 question";
      }
      if (row.marksEach < 1) {
        e[`row-${row.id}-marks`] = "Min 1 mark";
      }
    }
    if (rows.length === 0 || !rows.some((r) => r.type)) {
      e.questionTypes = "Add at least one question type";
    }
    if (totalQuestions < 1) {
      e.totalQuestions = "Total questions must be at least 1";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try {
      const selectedTypes = rows
        .filter((r) => r.type)
        .map((r) => r.type as QuestionType);
      const questionTypeConfigs = rows
        .filter((r) => r.type)
        .map((r) => ({
          type: r.type as QuestionType,
          count: r.count,
          marksEach: r.marksEach,
        }));
      const assignmentId = await submitAssignment({
        subject: subject.trim(),
        topic: topic.trim(),
        gradeLevel: gradeLevel.trim(),
        dueDate,
        totalMarks,
        totalQuestions,
        questionTypes: selectedTypes,
        questionTypeConfigs,
        difficulty: formData.difficulty ?? { easy: 40, medium: 40, hard: 20 },
        additionalInstructions: formData.additionalInstructions,
        fileContent: uploadedFileData ?? undefined,
      } as Parameters<typeof submitAssignment>[0]);
      router.push(`/result/${assignmentId}`);
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error ? err.message : "Failed to submit assignment",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-10">
          <Link
            href="/assignments"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
            Create Assignment
          </h1>
          <p className="text-[#64748B]">
            Fill in the details to create your AI-powered question paper
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Details Section */}
          <Card className="border border-[#E2E8F0] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#E2E8F0] p-6">
              <CardTitle className="text-xl text-[#0F172A]">
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#0F172A]">
                    Subject *
                  </Label>
                  <Input
                    placeholder="e.g., Mathematics"
                    className="h-11 border-[#E2E8F0] rounded-xl"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  {errors.subject && (
                    <p className="text-xs text-[#EF4444]">{errors.subject}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#0F172A]">
                    Topic *
                  </Label>
                  <Input
                    placeholder="e.g., Algebra Basics"
                    className="h-11 border-[#E2E8F0] rounded-xl"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  {errors.topic && (
                    <p className="text-xs text-[#EF4444]">{errors.topic}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#0F172A]">
                    Grade Level *
                  </Label>
                  <Input
                    placeholder="e.g., Class 5th"
                    className="h-11 border-[#E2E8F0] rounded-xl"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  />
                  {errors.gradeLevel && (
                    <p className="text-xs text-[#EF4444]">
                      {errors.gradeLevel}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#0F172A]">
                    Due Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
                    <Input
                      type="date"
                      className="h-11 pl-10 border-[#E2E8F0] rounded-xl"
                      min={new Date().toISOString().split("T")[0]}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  {errors.dueDate && (
                    <p className="text-xs text-[#EF4444]">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#0F172A]">
                  Upload Reference (optional)
                </Label>
                <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-white p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                  <Upload className="h-8 w-8 text-[#64748B]" />
                  <div className="text-center">
                    {uploadedFileName ? (
                      <>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          ? {uploadedFileName}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          File uploaded successfully
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          Choose a file or drag & drop it here
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          JPEG, PNG, PDF upto 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#E2E8F0]"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("file-upload-input")?.click();
                    }}
                  >
                    Browse Files
                  </Button>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept={FILE_TYPES}
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {errors.file && (
                  <p className="text-xs text-[#EF4444]">{errors.file}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Types Section */}
          <Card className="border border-[#E2E8F0] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#E2E8F0] p-6">
              <CardTitle className="text-xl text-[#0F172A]">
                Question Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {errors.questionTypes && (
                <p className="text-xs text-[#EF4444]">
                  {errors.questionTypes}
                </p>
              )}

              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 p-4 bg-white border border-[#E2E8F0] rounded-xl"
                >
                  {/* Type dropdown */}
                  <div className="flex-1 min-w-[200px]">
                    <select
                      className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={row.type}
                      onChange={(e) =>
                        updateRow(row.id, "type", e.target.value)
                      }
                    >
                      <option value="">Select question type</option>
                      {QUESTION_TYPE_OPTIONS.map((opt) => {
                        const disabled = rows.some(
                          (r) => r.id !== row.id && r.type === opt.value
                        );
                        return (
                          <option
                            key={opt.value}
                            value={opt.value}
                            disabled={disabled}
                          >
                            {opt.label}
                          </option>
                        );
                      })}
                    </select>
                    {errors[`row-${row.id}-type`] && (
                      <p className="text-xs text-[#EF4444] mt-1">
                        {errors[`row-${row.id}-type`]}
                      </p>
                    )}
                  </div>

                  {/* Count +/- */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#64748B]">
                      No. of Questions:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(
                            row.id,
                            "count",
                            Math.max(1, row.count - 1)
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-14 h-8 text-center rounded-lg border border-[#E2E8F0] text-sm font-semibold"
                        value={row.count}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "count",
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(row.id, "count", row.count + 1)
                        }
                        className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Marks +/- */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#64748B]">Marks:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(
                            row.id,
                            "marksEach",
                            Math.max(1, row.marksEach - 1)
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-14 h-8 text-center rounded-lg border border-[#E2E8F0] text-sm font-semibold"
                        value={row.marksEach}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "marksEach",
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(row.id, "marksEach", row.marksEach + 1)
                        }
                        className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="h-8 w-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5 text-[#EF4444]" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Question Type Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addRow}
                className="w-full rounded-xl border-dashed border-[#E2E8F0] py-6 text-[#64748B] gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Question Type
              </Button>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-[#64748B]">
                      Total Questions:
                    </span>
                    <span className="ml-2 font-bold text-[#0F172A]">
                      {totalQuestions}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-[#64748B]">
                      Total Marks:
                    </span>
                    <span className="ml-2 font-bold text-[#0F172A]">
                      {totalMarks}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-[#EF4444]">{errors.submit}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="px-8 h-12 text-base gap-2 bg-[#0F172A] hover:bg-[#4F46E5] text-white font-semibold shadow-lg rounded-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}