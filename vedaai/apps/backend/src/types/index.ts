export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "true_false"
  | "diagram_based"
  | "numerical"
  | "fill_in_blank";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionTypeConfig {
  type: QuestionType;
  count: number;
  marksEach: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: QuestionOption[];
  answer?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface AssignmentInput {
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  questionTypes: QuestionType[];
  questionTypeConfigs?: QuestionTypeConfig[];
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalQuestions: number;
  additionalInstructions?: string;
  fileContent?: string;
}

export type AssignmentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface Assignment {
  _id: string;
  input: AssignmentInput;
  status: AssignmentStatus;
  sections: Section[];
  metadata: {
    totalMarks: number;
    totalQuestions: number;
    generatedAt: string;
    subject: string;
    topic: string;
    gradeLevel: string;
    dueDate: string;
  };
  jobId: string;
  createdAt: string;
  updatedAt: string;
}

export type WebSocketEventType =
  | "JOB_STARTED"
  | "JOB_PROGRESS"
  | "JOB_COMPLETED"
  | "JOB_FAILED";

export interface WebSocketEvent {
  type: WebSocketEventType;
  assignmentId: string;
  progress?: number;
  message?: string;
  data?: Assignment;
}