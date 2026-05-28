import { create } from "zustand";
import type { Assignment, AssignmentInput } from "@vedaai/types";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export type StoreStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

interface AssignmentStore {
  formData: Partial<AssignmentInput>;
  currentAssignment: Assignment | null;
  status: StoreStatus;
  progress: number;
  progressMessage: string;
  setFormField: <K extends keyof AssignmentInput>(
    field: K,
    value: AssignmentInput[K]
  ) => void;
  resetForm: () => void;
  setAssignment: (assignment: Assignment | null) => void;
  setStatus: (
    status: StoreStatus,
    progress?: number,
    progressMessage?: string
  ) => void;
  submitAssignment: (
    data?: Partial<AssignmentInput>
  ) => Promise<string>;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  formData: {
    difficulty: { easy: 40, medium: 40, hard: 20 },
    questionTypes: [],
  },
  currentAssignment: null,
  status: "idle",
  progress: 0,
  progressMessage: "",

  setFormField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));
  },

  resetForm: () => {
    set({
      formData: {
        difficulty: { easy: 40, medium: 40, hard: 20 },
        questionTypes: [],
      },
    });
  },

  setAssignment: (assignment) => {
    set({ currentAssignment: assignment });
  },

  setStatus: (status, progress, progressMessage) => {
    set({
      status,
      ...(progress !== undefined ? { progress } : {}),
      ...(progressMessage !== undefined ? { progressMessage } : {}),
    });
  },

  submitAssignment: async (data) => {
    const payload = (data ?? get().formData) as AssignmentInput;

    const res = await fetch(`${API_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { error?: string }).error || "Failed to create assignment"
      );
    }

    const result = (await res.json()) as {
      assignmentId: string;
      jobId: string;
      status: string;
    };

    set({
      status: "pending",
      progress: 0,
      progressMessage: "Assignment queued for generation...",
    });

    return result.assignmentId;
  },
}));
