import React, { useState } from "react";
import { Task, Priority, GOAL_TYPES } from "../types";
import {
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  Edit2,
  X,
  Save,
  Tag,
  ArrowUp,
  ArrowDown,
  ChevronRight
} from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFields: Partial<Task>) => void;
  todayStr: string;
}

// Nothing Tech monochrome tag styling
const GOAL_BADGES: Record<string, string> = {
  "Công việc": "bg-black text-white border-black",
  "Học tập": "bg-neutral-100 text-black border-black",
  "Sức khỏe": "bg-neutral-200 text-black border-neutral-600",
  "Cá nhân": "bg-zinc-800 text-white border-zinc-900",
  "Tài chính": "bg-white text-black border-black border-dashed",
  "Khác": "bg-neutral-50 text-neutral-600 border-neutral-300"
};

export default function TaskItem({ task, onToggle, onDelete, onUpdate, todayStr }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editGoal, setEditGoal] = useState(task.goal);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);

  const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
  const isToday = !task.completed && task.dueDate === todayStr;

  const badgeStyle = GOAL_BADGES[task.goal] || GOAL_BADGES["Khác"];

  const handleSave = () => {
    if (!editText.trim()) return;
    onUpdate(task.id, {
      text: editText.trim(),
      goal: editGoal,
      priority: editPriority,
      dueDate: editDueDate
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(task.text);
    setEditGoal(task.goal);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate);
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative p-4 transition-all duration-150 border-[1.5px] rounded-lg ${
        task.completed
          ? "border-neutral-200 bg-neutral-50/70 opacity-60"
          : isOverdue
          ? "border-nothing-red bg-rose-50/20 nothing-shadow-red"
          : "border-black bg-white nothing-shadow-sm hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000000]"
      }`}
    >
      {isEditing ? (
        <div className="space-y-4 font-sans text-xs">
          {/* Main Editing Input */}
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 border-[1.5px] border-black rounded-none focus:outline-none bg-white text-black font-mono"
            placeholder="Nội dung công việc..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Goal Select */}
            <div className="space-y-1">
              <label className="block text-xxs font-extrabold text-black uppercase tracking-widest font-mono">Mục tiêu</label>
              <select
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border-[1.5px] border-black bg-white rounded-none font-mono focus:outline-none"
              >
                {GOAL_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div className="space-y-1">
              <label className="block text-xxs font-extrabold text-black uppercase tracking-widest font-mono">Độ ưu tiên</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                className="w-full text-xs px-2.5 py-2 border-[1.5px] border-black bg-white rounded-none font-mono focus:outline-none"
              >
                <option value="Cao">Cao [🔥]</option>
                <option value="Trung bình">Trung bình [⚡]</option>
                <option value="Thấp">Thấp [🌱]</option>
              </select>
            </div>

            {/* Due Date Input */}
            <div className="space-y-1">
              <label className="block text-xxs font-extrabold text-black uppercase tracking-widest font-mono">Hạn chót</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border-[1.5px] border-black bg-white rounded-none font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-neutral-300">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-xxs font-extrabold uppercase border-[1.5px] border-neutral-300 hover:border-black text-neutral-500 hover:text-black transition-colors"
            >
              <X className="w-3 h-3" />
              HỦY
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 text-xxs font-extrabold uppercase bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              <Save className="w-3 h-3" />
              LƯU LẠI
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3.5">
          {/* Complete Checkbox Square Square Button */}
          <button
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 border-[1.5px] flex items-center justify-center transition-all duration-100 ${
              task.completed
                ? "bg-black border-black text-white"
                : isOverdue
                ? "border-nothing-red hover:bg-rose-500/10 bg-white"
                : "border-black hover:bg-neutral-100 bg-white"
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Goal Tag - Square Minimal border tag */}
              <span className={`inline-flex items-center px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider font-mono ${badgeStyle}`}>
                {task.goal}
              </span>

              {/* Priority Tag */}
              {task.priority === "Cao" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black bg-white text-nothing-red text-[9px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse"></span>
                  HIGH
                </span>
              )}

              {task.priority === "Trung bình" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black bg-white text-black text-[9px] font-bold font-mono">
                  MED
                </span>
              )}

              {task.priority === "Thấp" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-neutral-400 bg-white text-neutral-500 text-[9px] font-medium font-mono">
                  LOW
                </span>
              )}

              {/* Overdue/Today Notification Badge */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-nothing-red text-white text-[9px] font-extrabold font-mono tracking-widest animate-pulse">
                  OVERDUE
                </span>
              )}
              {isToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[9px] font-extrabold font-mono tracking-widest">
                  TODAY
                </span>
              )}
            </div>

            {/* Task Description */}
            <p
              className={`text-sm tracking-tight break-words font-sans ${
                task.completed ? "text-neutral-400 line-through font-normal" : "text-black font-semibold"
              }`}
            >
              {task.text}
            </p>

            {/* Date Details footer */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xxs font-mono text-neutral-400">
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? "text-nothing-red font-bold" : ""}`}>
                  <Calendar className="w-3 h-3" />
                  BY: {task.dueDate}
                </span>
              )}
              {task.completedAt && (
                <span className="text-neutral-500">
                  DONE: {new Date(task.completedAt).toLocaleString("vi-VN", {
                    hour: "numeric",
                    minute: "2-digit",
                    day: "numeric",
                    month: "numeric"
                  }).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Edit/Delete Actions Pane (Absolute over group hover) */}
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center bg-white border border-black p-0.5 shadow-sm">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-neutral-100 text-black transition-colors"
              title="Sửa"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <div className="w-[1px] h-3 bg-black"></div>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 hover:bg-neutral-100 text-nothing-red transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
