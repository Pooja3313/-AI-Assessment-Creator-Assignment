"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  Sparkles,
  Upload,
  Check,
  ChevronLeft,
  Plus,
  Minus,
} from "lucide-react";
import type { QuestionType } from "@vedaai/types";
import { useAssignmentStore } from "@/store/assignmentStore";
import { adjustDifficulty } from "@/lib/difficulty";
import { extractPdfText } from "@/lib/pdfExtract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRADE_LEVELS = [
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  "Undergraduate",
  "Postgraduate",
];

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple Choice Questions" },
  { value: "short_answer", label: "Short Answer Questions" },
  { value: "long_answer", label: "Long Answer Questions" },
  { value: "true_false", label: "True / False Questions" },
];

type FormErrors = Record<string, string>;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { formData, setFormField, submitAssignment } = useAssignmentStore();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [typeQuestionCounts, setTypeQuestionCounts] = useState<Record<string, number>>({});

  const difficulty = formData.difficulty ?? {
    easy: 40,
    medium: 40,
    hard: 20,
  };

  function autoDistribute(types: QuestionType[], total: number) {
    if (types.length === 0 || total === 0) {
      setTypeQuestionCounts({});
      return;
    }
    const perType = Math.floor(total / types.length);
    const newCounts: Record<string, number> = {};
    types.forEach((t, i) => {
      newCounts[t] = i === types.length - 1
        ? total - perType * (types.length - 1)
        : perType;
    });
    setTypeQuestionCounts(newCounts);
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!formData.subject?.trim()) e.subject = "Subject is required";
    if (!formData.topic?.trim()) e.topic = "Topic is required";
    if (!formData.gradeLevel) e.gradeLevel = "Grade level is required";
    if (!formData.dueDate) {
      e.dueDate = "Due date is required";
    } else {
      const due = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) e.dueDate = "Due date must be in the future";
    }
    const tq = formData.totalQuestions;
    if (tq === undefined || tq < 1 || tq > 50) {
      e.totalQuestions = "Total questions must be between 1 and 50";
    }
    const tm = formData.totalMarks;
    if (tm === undefined || tm < 1) {
      e.totalMarks = "Total marks must be at least 1";
    }
    if (!formData.questionTypes?.length) {
      e.questionTypes = "Select at least one question type";
    }
    const sum = difficulty.easy + difficulty.medium + difficulty.hard;
    if (sum !== 100) {
      e.difficulty = "Difficulty split must total 100%";
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
      const totalFromCounts = Object.values(typeQuestionCounts).reduce((a, b) => a + b, 0);
      const assignmentId = await submitAssignment({
        ...formData,
        difficulty,
        totalQuestions: totalFromCounts > 0 ? totalFromCounts : formData.totalQuestions,
        questionTypeCounts: typeQuestionCounts,
      } as Parameters<typeof submitAssignment>[0]);
      router.push(`/result/${assignmentId}`);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "Failed to submit assignment",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePdfChange(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, pdf: "Only PDF files are accepted" }));
      return;
    }
    try {
      const text = await extractPdfText(file);
      setFormField("fileContent", text);
      setPdfName(file.name);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pdf;
        return next;
      });
    } catch {
      setErrors((prev) => ({ ...prev, pdf: "Failed to extract text from PDF" }));
    }
  }

  function toggleQuestionType(type: QuestionType) {
    const current = formData.questionTypes ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setFormField("questionTypes", next);
    autoDistribute(next, formData.totalQuestions ?? 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-10">
          <Link href="/assignments" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assignment Details</h1>
          <p className="text-gray-600">Fill in the details about your assignment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <CardTitle className="text-2xl text-gray-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Subject *</Label>
                  <Input
                    placeholder="e.g., Mathematics"
                    className="h-11 border-gray-300"
                    value={formData.subject ?? ""}
                    onChange={(e) => setFormField("subject", e.target.value)}
                  />
                  {errors.subject && <p className="text-xs text-red-600">{errors.subject}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Topic *</Label>
                  <Input
                    placeholder="e.g., Algebra Basics"
                    className="h-11 border-gray-300"
                    value={formData.topic ?? ""}
                    onChange={(e) => setFormField("topic", e.target.value)}
                  />
                  {errors.topic && <p className="text-xs text-red-600">{errors.topic}</p>}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Grade Level *</Label>
                  <Select
                    value={formData.gradeLevel ?? ""}
                    onValueChange={(v) => setFormField("gradeLevel", v)}
                  >
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent
                      className="z-[9999] bg-white border border-gray-300 shadow-xl"
                      position="popper"
                      sideOffset={4}
                    >
                      {GRADE_LEVELS.map((g) => (
                        <SelectItem key={g} value={g} className="text-gray-900 hover:bg-gray-100">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gradeLevel && <p className="text-xs text-red-600">{errors.gradeLevel}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Due Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      className="h-11 pl-10 border-gray-300"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.dueDate ?? ""}
                      onChange={(e) => setFormField("dueDate", e.target.value)}
                    />
                  </div>
                  {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <CardTitle className="text-2xl text-gray-900">Question Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Total Questions *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="Enter number"
                    className="h-11 border-gray-300"
                    value={formData.totalQuestions ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormField("totalQuestions", val);
                      autoDistribute(formData.questionTypes ?? [], val);
                    }}
                  />
                  {errors.totalQuestions && <p className="text-xs text-red-600">{errors.totalQuestions}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Total Marks *</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter marks"
                    className="h-11 border-gray-300"
                    value={formData.totalMarks ?? ""}
                    onChange={(e) => setFormField("totalMarks", Number(e.target.value) || 0)}
                  />
                  {errors.totalMarks && <p className="text-xs text-red-600">{errors.totalMarks}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-900">Question Type *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {QUESTION_TYPE_OPTIONS.map((opt) => {
                    const selected = formData.questionTypes?.includes(opt.value) ?? false;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleQuestionType(opt.value)}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-4 cursor-pointer transition-all duration-200 ${
                          selected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900 text-left">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.questionTypes && <p className="text-xs text-red-600">{errors.questionTypes}</p>}
              </div>

              {formData.questionTypes && formData.questionTypes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-1">Questions Distribution</h4>
                  <p className="text-xs text-gray-500 mb-4">Auto-distributed equally. Adjust manually if needed.</p>
                  <div className="space-y-4">
                    {QUESTION_TYPE_OPTIONS.map((opt) => {
                      if (!formData.questionTypes?.includes(opt.value)) return null;
                      const count = typeQuestionCounts[opt.value] ?? 0;
                      const total = formData.totalQuestions ?? 0;
                      return (
                        <div key={opt.value} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = Math.max(0, count - 1);
                                setTypeQuestionCounts((prev) => ({ ...prev, [opt.value]: newCount }));
                              }}
                              className="h-8 w-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-8 text-center">{count}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = Math.min(total, count + 1);
                                setTypeQuestionCounts((prev) => ({ ...prev, [opt.value]: newCount }));
                              }}
                              className="h-8 w-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <span className="text-xs text-gray-500">of {total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <CardTitle className="text-2xl text-gray-900">Difficulty & Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-900">Difficulty Split *</Label>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    difficulty.easy + difficulty.medium + difficulty.hard === 100
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    Total: {difficulty.easy + difficulty.medium + difficulty.hard}%
                  </span>
                </div>
                {(["easy", "medium", "hard"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="capitalize text-sm font-semibold text-gray-900">{key}</span>
                      <span className="text-lg font-bold text-blue-600">{difficulty[key]}%</span>
                    </div>
                    <Slider
                      value={[difficulty[key]]}
                      max={100}
                      step={5}
                      className="h-2"
                      onValueChange={([v]) =>
                        setFormField("difficulty", adjustDifficulty(difficulty, key, v))
                      }
                    />
                  </div>
                ))}
                {errors.difficulty && <p className="text-xs text-red-600">{errors.difficulty}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">
                  Additional Instructions <span className="text-gray-500 font-normal">(optional)</span>
                </Label>
                <textarea
                  rows={4}
                  placeholder="e.g., Focus on Chapter 3 and 4, No calculators allowed"
                  className="flex w-full rounded-lg border border-gray-300 px-4 py-3 text-base placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
                  value={formData.additionalInstructions ?? ""}
                  onChange={(e) => setFormField("additionalInstructions", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <CardTitle className="text-2xl text-gray-900">Syllabus / Reference</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-xs text-gray-600 mb-4">Upload a syllabus or reference document for better AI generation</p>
              <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="h-10 w-10 text-gray-400" />
                <div className="text-center">
                  {pdfName ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900">✓ {pdfName}</p>
                      <p className="text-xs text-gray-500 mt-1">PDF uploaded successfully</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-900">Click to upload PDF</p>
                      <p className="text-xs text-gray-500 mt-1">PDF files only (max 10MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {errors.pdf && <p className="text-xs text-red-600 mt-2">{errors.pdf}</p>}
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="px-8 h-12 text-base border-gray-300"
              onClick={() => setErrors({})}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-8 h-12 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-5 w-5" />Generate with AI</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}