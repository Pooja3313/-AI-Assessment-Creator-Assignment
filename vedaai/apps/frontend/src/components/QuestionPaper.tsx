"use client";

import type { Section, Question as IQuestion } from "@vedaai/types";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionPaperProps {
  sections: Section[];
  title: string;
  subject: string;
  gradeLevel: string;
  showAnswerKey?: boolean;
}

function QuestionBlock({ question, number, sectionNumber, showAnswer }: { question: IQuestion; number: number; sectionNumber: number; showAnswer?: boolean }) {
  const labels = ["A", "B", "C", "D"];
  const diffClr = question.difficulty === "easy" ? "bg-green-50 border-green-200 text-green-700" : question.difficulty === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700";
  return (
    <div className="mb-6 pb-6 border-b border-gray-300 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-base font-semibold text-gray-900 leading-relaxed flex-1">
          <span className="font-bold">{sectionNumber}.{number}.</span> {question.text}</p>
        <div className="flex gap-2 flex-shrink-0">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border ${diffClr}`}>{question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</span>
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-700">{question.marks}M</span>
        </div>
      </div>
      {question.type === "mcq" && question.options && (
        <div className="ml-6 space-y-2 mt-4">
          {question.options.map((opt, i) => <div key={opt.id} className="text-sm text-gray-700"><span className="font-semibold text-gray-900">{labels[i]})</span> {opt.text}</div>)}
        </div>
      )}
      {question.type === "true_false" && (
        <div className="ml-6 space-y-2 mt-4">
          <div className="text-sm text-gray-700"><span className="font-semibold text-gray-900">A)</span> True</div>
          <div className="text-sm text-gray-700"><span className="font-semibold text-gray-900">B)</span> False</div>
        </div>
      )}
      {question.type === "fill_in_blank" && <div className="ml-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-gray-700">________________________________________</div>}
      {showAnswer && question.answer && (
        <div className="ml-6 mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs font-semibold text-green-900 mb-1">Answer:</p>
          <p className="text-sm text-green-800">{question.answer}</p>
        </div>
      )}
    </div>
  );
}

export function QuestionPaper({ sections, title, subject, gradeLevel, showAnswerKey = false }: QuestionPaperProps) {
  const totalMarks = sections.reduce((sum, s) => sum + s.totalMarks, 0);
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div>
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">{subject}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Delhi Public School, Sector-4</h1>
        <p className="text-lg font-semibold text-gray-900 mb-3">{title}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-900 font-bold px-3 py-1 rounded-lg text-sm">{gradeLevel}</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500 font-medium">Time: 45 min</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500 font-medium">Max Marks: <strong className="text-gray-900">{totalMarks}</strong></span>
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">All questions are compulsory. Read each question carefully.</p>
        <div className="mt-6 border border-gray-200 rounded-xl bg-gray-50/50 p-4 text-left text-sm">
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <div><span className="text-gray-500 text-xs">Name: </span><span className="border-b border-gray-300 inline-block min-w-[120px]">&nbsp;</span></div>
            <div><span className="text-gray-500 text-xs">Roll No: </span><span className="border-b border-gray-300 inline-block min-w-[80px]">&nbsp;</span></div>
            <div><span className="text-gray-500 text-xs">Class: </span><span className="border-b border-gray-300 inline-block min-w-[80px]">&nbsp;</span></div>
            <div><span className="text-gray-500 text-xs">Section: </span><span className="border-b border-gray-300 inline-block min-w-[80px]">&nbsp;</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white border-x border-gray-200 px-8 py-4 flex items-center gap-6 text-sm">
        <span className="text-gray-500">Questions: <strong className="text-gray-900">{totalQuestions}</strong></span>
        <span className="text-gray-500">Marks: <strong className="text-gray-900">{totalMarks}</strong></span>
        <span className="text-gray-500">Sections: <strong className="text-gray-900">{sections.length}</strong></span>
      </div>

      {showAnswerKey && <div className="bg-green-50 border-x border-green-200 px-8 py-3 text-center"><p className="text-sm font-semibold text-green-800">Answer Key - Confidential</p></div>}

      {sections.map((section, sectionIdx) => (
        <div key={section.id}>
          <div className="bg-gray-900 text-white px-8 py-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold">{section.title}</h2><p className="text-gray-300 text-sm mt-1">{section.instruction}</p></div>
              <div className="text-right"><p className="text-2xl font-bold">{section.totalMarks}</p><p className="text-gray-300 text-sm">Marks</p></div>
            </div>
          </div>
          <Card className="border-x border-b border-gray-200 rounded-none shadow-sm">
            <CardContent className="p-8">
              {section.questions.map((q, qIdx) => <QuestionBlock key={q.id} question={q} number={qIdx + 1} sectionNumber={sectionIdx + 1} showAnswer={showAnswerKey} />)}
            </CardContent>
          </Card>
        </div>
      ))}

      <div className="bg-white rounded-b-xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">- {showAnswerKey ? "End of Answer Key" : "End of Question Paper"} -</p>
      </div>
    </div>
  );
}