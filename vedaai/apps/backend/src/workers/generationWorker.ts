import "dotenv/config";
import { Worker } from "bullmq";
import Groq from 'groq-sdk'

import Redis from "ioredis";
import mongoose from "mongoose";
import type {
  Assignment,
  AssignmentInput,
  Difficulty,
  Question,
  QuestionType,
  Section,
} from "@vedaai/types";
import { AssignmentModel, toAssignmentJSON } from "../models/Assignment";
import type { AssignmentJobData } from "../queues/assignmentQueue";
import { setCachedAssignment } from "../lib/redis";
import { emitAssignmentEvent, initWorkerEmitter } from "../socket";

const SYSTEM_PROMPT = `You are an expert exam paper creator. You must respond with ONLY a valid JSON object. No markdown. No explanation. No code fences. Just raw JSON.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function buildUserPrompt(input: AssignmentInput & { questionTypeCounts?: Record<string, number> }): string {
  const easyCount = Math.round(
    (input.totalQuestions * input.difficulty.easy) / 100
  );
  const mediumCount = Math.round(
    (input.totalQuestions * input.difficulty.medium) / 100
  );
  const hardCount = input.totalQuestions - easyCount - mediumCount;

  const questionTypeLabels = input.questionTypes
    .map((t) => {
      const map: Record<QuestionType, string> = {
        mcq: "Multiple Choice (MCQ) - use type: mcq",
        short_answer: "Short Answer - use type: short_answer",
        long_answer: "Long Answer - use type: long_answer",
        true_false: "True/False - use type: true_false",
        diagram_based: "Diagram/Graph Based - use type: diagram_based",
        numerical: "Numerical Problems - use type: numerical",
        fill_in_blank: "Fill in the Blanks - use type: fill_in_blank",
      };
      return map[t];
    })
    .join(", ");

  let prompt = `Create an assessment with these specifications:
- Subject: ${input.subject}
- Topic: ${input.topic}
- Grade Level: ${input.gradeLevel}
- Total Questions: ${input.totalQuestions}
- Total Marks: ${input.totalMarks}
- Question Types: ${questionTypeLabels}
- Easy questions: ${easyCount}
- Medium questions: ${mediumCount}
- Hard questions: ${hardCount}`;

  if (input.questionTypeCounts && Object.keys(input.questionTypeCounts).length > 0) {
    prompt += `\n\nIMPORTANT - Generate EXACTLY this many questions per type:`;
    Object.entries(input.questionTypeCounts).forEach(([type, count]) => {
      prompt += `\n- ${type}: ${count} questions`;
    });
  }

  prompt += `\n\nReturn a JSON object with this exact structure:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section A",
      "instruction": "Attempt all questions.",
      "totalMarks": 50,
      "questions": [
        {
          "id": "q1",
          "text": "Full question text here",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 1,
          "options": [
            {"id": "a", "text": "Option A"},
            {"id": "b", "text": "Option B"},
            {"id": "c", "text": "Option C"},
            {"id": "d", "text": "Option D"}
          ],
          "answer": "a"
        }
      ]
    }
  ]
}`;

  if (input.additionalInstructions) {
    prompt += `\n\nAdditional Instructions:\n${input.additionalInstructions}`;
  }

  if (input.fileContent) {
    prompt += `\n\nReference Material:\n${input.fileContent.slice(0, 2000)}`;
  }

  return prompt;
}

async function callGroq(userPrompt: string, correction = false): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey || apiKey.toLowerCase().includes("your")) {
    throw new Error("GROQ_API_KEY is not set in .env file");
  }

  const message = correction
    ? "The previous response was not valid JSON. Return only valid JSON with no other text."
    : userPrompt;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0].message.content?.trim() ?? "";
}

function extractJson(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
    cleaned = cleaned.trim();
  }

  // Find the first { and last } to extract JSON if there's extra text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

function defaultDifficulty(): Difficulty {
  return "medium";
}

function defaultQuestionType(types: QuestionType[]): QuestionType {
  return types[0] ?? "short_answer";
}

function validateAndNormalizeSections(
  parsed: unknown,
  input: AssignmentInput
): Section[] {
  const raw = parsed as { sections?: unknown[] };
  if (!Array.isArray(raw.sections)) {
    return [];
  }

  return raw.sections.map((sec, sIdx) => {
    const section = sec as Record<string, unknown>;
    const questionsRaw = Array.isArray(section.questions)
      ? section.questions
      : [];

    const questions: Question[] = questionsRaw.map((q, qIdx) => {
      const question = q as Record<string, unknown>;
      const rawType = String(question.type ?? "").toLowerCase().replace(/\s+/g, "_");
      const validTypes: QuestionType[] = ["mcq", "short_answer", "long_answer", "true_false", "diagram_based", "numerical", "fill_in_blank"];
      const type = validTypes.includes(rawType as QuestionType)
        ? rawType as QuestionType
        : defaultQuestionType(input.questionTypes);
      const difficulty = (question.difficulty as Difficulty) || defaultDifficulty();

      const normalized: Question = {
        id: String(question.id ?? `q-${sIdx + 1}-${qIdx + 1}`),
        text: String(question.text ?? "Question text"),
        type,
        difficulty,
        marks: Number(question.marks) || 1,
      };

      if (type === "mcq" && Array.isArray(question.options)) {
        normalized.options = (
          question.options as Array<Record<string, string>>
        ).slice(0, 4).map((opt, i) => ({
          id: String(opt.id ?? String.fromCharCode(97 + i)),
          text: String(opt.text ?? `Option ${i + 1}`),
        }));
      }

      if (question.answer) {
        normalized.answer = String(question.answer);
      }

      return normalized;
    });

    const totalMarks =
      Number(section.totalMarks) ||
      questions.reduce((sum, q) => sum + q.marks, 0);

    return {
      id: String(section.id ?? `section-${sIdx + 1}`),
      title: String(section.title ?? `Section ${String.fromCharCode(65 + sIdx)}`),
      instruction: String(
        section.instruction ?? "Attempt all questions."
      ),
      questions,
      totalMarks,
    };
  });
}

async function processJob(assignmentId: string): Promise<void> {
  const assignment = await AssignmentModel.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const input = assignment.input;

  assignment.status = "processing";
  await assignment.save();

  emitAssignmentEvent(assignmentId, {
    type: "JOB_STARTED",
    assignmentId,
    progress: 10,
    message: "Starting AI generation",
  });

  const rawPrompt = buildUserPrompt(input);

  emitAssignmentEvent(assignmentId, {
    type: "JOB_PROGRESS",
    assignmentId,
    progress: 20,
    message: "Analyzing your requirements",
  });

  let responseText: string = "";
  let parsed: unknown;

  try {
    emitAssignmentEvent(assignmentId, {
      type: "JOB_PROGRESS",
      assignmentId,
      progress: 40,
      message: "Generating questions with AI",
    });

    responseText = await callGroq(rawPrompt);

    emitAssignmentEvent(assignmentId, {
      type: "JOB_PROGRESS",
      assignmentId,
      progress: 60,
      message: "Building question structure",
    });

    const extractedJson = extractJson(responseText);
    parsed = JSON.parse(extractedJson);
  } catch (firstErr) {
    // try one correction attempt
    try {
      console.error(
        `First JSON parse attempt failed for ${assignmentId}:`,
        firstErr instanceof Error ? firstErr.message : firstErr
      );
      console.debug(`Raw response: ${responseText?.substring(0, 500) || "N/A"}`);

      emitAssignmentEvent(assignmentId, {
        type: "JOB_PROGRESS",
        assignmentId,
        progress: 70,
        message: "AI returned invalid JSON, requesting corrected JSON",
      });

      responseText = await callGroq(rawPrompt, true);
      const extractedJson = extractJson(responseText);
      parsed = JSON.parse(extractedJson);
    } catch (secondErr) {
      console.error(
        `Second JSON parse attempt failed for ${assignmentId}:`,
        secondErr instanceof Error ? secondErr.message : secondErr
      );
      console.debug(`Raw response: ${responseText?.substring(0, 500) || "N/A"}`);

      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: "failed",
      });

      emitAssignmentEvent(assignmentId, {
        type: "JOB_FAILED",
        assignmentId,
        message: "Failed to parse AI response as valid JSON",
      });

      throw new Error("Failed to parse AI response as valid JSON");
    }
  }

  const sections = validateAndNormalizeSections(parsed, input);

  const metadata = {
    totalMarks: input.totalMarks,
    totalQuestions: input.totalQuestions,
    generatedAt: new Date().toISOString(),
    subject: input.subject,
    topic: input.topic,
    gradeLevel: input.gradeLevel,
    dueDate: input.dueDate,
  };

  assignment.status = "completed";
  assignment.sections = sections;
  assignment.metadata = metadata;
  await assignment.save();

  emitAssignmentEvent(assignmentId, {
    type: "JOB_PROGRESS",
    assignmentId,
    progress: 90,
    message: "Formatting your paper",
  });

  const result = toAssignmentJSON(assignment);
  await setCachedAssignment(assignmentId, result, 3600);

  emitAssignmentEvent(assignmentId, {
    type: "JOB_COMPLETED",
    assignmentId,
    progress: 100,
    data: result as Assignment,
  });
}

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
};

async function startWorker() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/vedaai";
  await mongoose.connect(mongoUri);
  console.log("Worker connected to MongoDB");

  initWorkerEmitter();
  console.log("Worker Redis emitter initialized");

  const worker = new Worker<AssignmentJobData>(
    "assignment-generation",
    async (job) => {
      const { assignmentId } = job.data;
      console.log(`Processing assignment ${assignmentId}`);

      try {
        await processJob(assignmentId);
        console.log(`Completed assignment ${assignmentId}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: "failed",
        });

        emitAssignmentEvent(assignmentId, {
          type: "JOB_FAILED",
          assignmentId,
          message,
        });

        throw error;
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log("Assignment generation worker started");
}

startWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});