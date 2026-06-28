export type Priority = "Cao" | "Trung bình" | "Thấp";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  dueDate: string;
  completedAt?: string | null;
  goal: string;
  priority: Priority;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

export const GOAL_TYPES = [
  "Công việc",
  "Học tập",
  "Sức khỏe",
  "Cá nhân",
  "Tài chính",
  "Khác"
] as const;

export type GoalType = typeof GOAL_TYPES[number];
