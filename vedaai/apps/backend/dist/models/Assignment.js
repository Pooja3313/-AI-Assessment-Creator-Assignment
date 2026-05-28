"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentModel = void 0;
exports.toAssignmentJSON = toAssignmentJSON;
const mongoose_1 = __importStar(require("mongoose"));
const questionOptionSchema = new mongoose_1.Schema({ id: String, text: String }, { _id: false });
const questionSchema = new mongoose_1.Schema({
    id: String,
    text: String,
    type: { type: String, enum: ["mcq", "short_answer", "long_answer", "true_false", "diagram_based", "numerical", "fill_in_blank"] },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    marks: Number,
    options: { type: [questionOptionSchema], default: undefined },
    answer: { type: String, default: undefined },
}, { _id: false });
const sectionSchema = new mongoose_1.Schema({
    id: String,
    title: String,
    instruction: String,
    questions: { type: [questionSchema], default: [] },
    totalMarks: Number,
}, { _id: false });
const questionTypeConfigSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["mcq", "short_answer", "long_answer", "true_false", "diagram_based", "numerical", "fill_in_blank"] },
    count: Number,
    marksEach: Number,
}, { _id: false });
const assignmentInputSchema = new mongoose_1.Schema({
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
}, { _id: false });
const assignmentSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
assignmentSchema.index({ createdAt: -1 });
exports.AssignmentModel = mongoose_1.default.model("Assignment", assignmentSchema);
function toAssignmentJSON(doc) {
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
