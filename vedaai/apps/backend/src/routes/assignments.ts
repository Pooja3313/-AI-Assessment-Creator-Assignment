import { Router, Request, Response } from "express";
import type { AssignmentInput, QuestionType } from "../types";
import { AssignmentModel, toAssignmentJSON } from "../models/Assignment";
import { assignmentQueue } from "../queues/assignmentQueue";
import { getCachedAssignment, setCachedAssignment } from "../lib/redis";

const router = Router();

const VALID_QUESTION_TYPES: QuestionType[] = [
  "mcq",
  "short_answer",
  "long_answer",
  "true_false",
  "diagram_based",
  "numerical",
  "fill_in_blank",
];

function validateAssignmentInput(body: Partial<AssignmentInput>): string | null {
  const requiredFields: (keyof AssignmentInput)[] = [
    "subject",
    "topic",
    "gradeLevel",
    "dueDate",
    "totalMarks",
    "questionTypes",
    "difficulty",
    "totalQuestions",
  ];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ""
    ) {
      return `Field "${field}" is required`;
    }
  }

  if (typeof body.subject !== "string" || !body.subject.trim()) {
    return 'Field "subject" is required';
  }
  if (typeof body.topic !== "string" || !body.topic.trim()) {
    return 'Field "topic" is required';
  }
  if (typeof body.gradeLevel !== "string" || !body.gradeLevel.trim()) {
    return 'Field "gradeLevel" is required';
  }
  if (typeof body.dueDate !== "string" || !body.dueDate.trim()) {
    return 'Field "dueDate" is required';
  }

  const due = new Date(body.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(due.getTime())) {
    return 'Field "dueDate" must be a valid date';
  }
  if (due < today) {
    return 'Field "dueDate" cannot be in the past';
  }

  if (
    typeof body.totalQuestions !== "number" ||
    body.totalQuestions < 1 ||
    body.totalQuestions > 50
  ) {
    return 'Field "totalQuestions" must be between 1 and 50';
  }

  if (typeof body.totalMarks !== "number" || body.totalMarks < 1) {
    return 'Field "totalMarks" must be at least 1';
  }

  if (body.totalMarks < 0 || body.totalQuestions < 0) {
    return "Negative numbers are not allowed";
  }

  if (!Array.isArray(body.questionTypes) || body.questionTypes.length === 0) {
    return 'Field "questionTypes" must contain at least one question type';
  }

  for (const qt of body.questionTypes) {
    if (!VALID_QUESTION_TYPES.includes(qt)) {
      return `Field "questionTypes" contains invalid type: ${qt}`;
    }
  }

  if (!body.difficulty) {
    return 'Field "difficulty" is required';
  }

  const { easy, medium, hard } = body.difficulty;
  if (
    typeof easy !== "number" ||
    typeof medium !== "number" ||
    typeof hard !== "number"
  ) {
    return 'Field "difficulty" must contain easy, medium, and hard percentages';
  }

  if (easy < 0 || medium < 0 || hard < 0) {
    return "Difficulty percentages cannot be negative";
  }

  if (easy + medium + hard !== 100) {
    return 'Field "difficulty" percentages must sum to exactly 100';
  }

  return null;
}

// GET /api/assignments ? list all for teacher (filter by teacherId from JWT)
router.get("/", async (req: Request, res: Response) => {
  try {
    // In production, filter by teacherId from JWT: req.user.id
    // For now, return all assignments sorted by newest first
    const assignments = await AssignmentModel.find()
      .sort({ createdAt: -1 });

    return res.json({ assignments });
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const validationError = validateAssignmentInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const input = req.body as AssignmentInput;

    const assignment = await AssignmentModel.create({
      input,
      status: "pending",
      sections: [],
      metadata: {
        totalMarks: input.totalMarks,
        totalQuestions: input.totalQuestions,
        generatedAt: "",
        subject: input.subject,
        topic: input.topic,
        gradeLevel: input.gradeLevel,
        dueDate: input.dueDate,
      },
      jobId: "",
    });

    const job = await assignmentQueue.add("generate", {
      assignmentId: assignment._id.toString(),
    });

    assignment.jobId = job.id ?? "";
    await assignment.save();

    return res.status(202).json({
      assignmentId: assignment._id.toString(),
      jobId: job.id,
      status: "pending",
    });
  } catch (error) {
    console.error("POST /api/assignments error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cached = await getCachedAssignment(id);
    if (cached) {
      return res.json(cached);
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const result = toAssignmentJSON(assignment);
    await setCachedAssignment(id, result, 3600);

    return res.json(result);
  } catch (error) {
    console.error("GET /api/assignments/:id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/assignments/:id ? delete an assignment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/assignments/:id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;