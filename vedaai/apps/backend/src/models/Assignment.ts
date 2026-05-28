import mongoose, { Schema, Document } from "mongoose";
import type { Assignment, AssignmentInput, AssignmentStatus } from "@vedaai/types";

export interface AssignmentDocument extends Document {
  input: AssignmentInput;
  status: AssignmentStatus;
  sections: Assignment["sections"];
  metadata: Assignment["metadata"];
  jobId: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionOptionSchema = new Schema({ id: String, text: String }, { _id: false });
const questionSchema = new Schema(
  {
    id: String,
    text: String,
    type: { type: String, enum: ["mcq", "short_answer", "long_answer", "true_false", "diagram_based", "numerical", "fill_in_blank"] },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    marks: Number,
    options: { type: [questionOptionSchema], default: undefined },
    answer: { type: String, default: undefined },
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    id: String,
    title: String,
    instruction: String,
    questions: { type: [questionSchema], default: [] },
    totalMarks: Number,
  },
  { _id: false }
);

const questionTypeConfigSchema = new Schema(
  {
    type: { type: String, enum: ["mcq", "short_answer", "long_answer", "true_false", "diagram_based", "numerical", "fill_in_blank"] },
    count: Number,
    marksEach: Number,
  },
  { _id: false }
);

const assignmentInputSchema = new Schema(
  {
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    dueDate: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    questionTypes: { type: [String], required: true },
    questionTypeConfigs: { type: [questionTypeConfigSchema], default: undefined },
    difficulty: {
      easy: { type: Number, required: true },
      medium: { type: Number, required: true },
      hard: { type: Number, required: true },
    },
    totalQuestions: { type: Number, required: true },
    additionalInstructions: String,
    fileContent: String,
  },
  { _id: false }
);

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    input: { type: assignmentInputSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    sections: { type: [sectionSchema], default: [] },
    metadata: {
      totalMarks: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      generatedAt: { type: String, default: "" },
      subject: { type: String, default: "" },
      topic: { type: String, default: "" },
      gradeLevel: { type: String, default: "" },
      dueDate: { type: String, default: "" },
    },
    jobId: { type: String, default: "" },
  },
  { timestamps: true }
);

assignmentSchema.index({ createdAt: -1 });

export const AssignmentModel = mongoose.model<AssignmentDocument>("Assignment", assignmentSchema);

export function toAssignmentJSON(doc: AssignmentDocument): Assignment {
  return {
    _id: doc._id.toString(),
    input: doc.input,
    status: doc.status,
    sections: doc.sections,
    metadata: doc.metadata,
    jobId: doc.jobId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}