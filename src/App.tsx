import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  addDoc,
  getDocs
} from "firebase/firestore";
import { Task, ChatMessage, Priority, GOAL_TYPES } from "./types";
import GoalChart from "./components/GoalChart";
import TaskItem from "./components/TaskItem";
import ChatAI from "./components/ChatAI";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Smartphone, 
  Filter, 
  Inbox, 
  CheckSquare,
  Copy,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Get local today date string (YYYY-MM-DD)
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate high readability Alphanumeric Sync Code
const generateSyncCode = () => {
  return "TODO-" + Math.floor(1000 + Math.random() * 9000);
};

export default function App() {
  const todayStr = getTodayStr();

  // Core Sync state
  const [syncCode, setSyncCode] = useState<string>(() => {
    const saved = localStorage.getItem("todo_sync_code");
    if (saved) return saved;
    const newCode = generateSyncCode();
    localStorage.setItem("todo_sync_code", newCode);
    return newCode;
  });

  const [inputSyncCode, setInputSyncCode] = useState("");
  const [isSyncExpanded, setIsSyncExpanded] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState(false);

  // App data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sorting & Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Tất cả" | "Chưa xong" | "Đã xong">("Tất cả");
  const [focusedGoal, setFocusedGoal] = useState<string | null>(null);

  // New task form state
  const [newText, setNewText] = useState("");
  const [newGoal, setNewGoal] = useState<string>("Công việc");
  const [newPriority, setNewPriority] = useState<Priority>("Trung bình");
  const [newDueDate, setNewDueDate] = useState(todayStr);

  // 1. Subscribe to real-time sync with Firestore for Tasks and Messages
  useEffect(() => {
    if (!syncCode) return;

    // References to user's subcollections via syncCode path
    const tasksRef = collection(db, "sessions", syncCode, "tasks");
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc"));

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        fetchedTasks.push({
          id: docSnap.id,
          text: d.text || "",
          completed: !!d.completed,
          createdAt: d.createdAt || "",
          dueDate: d.dueDate || "",
          completedAt: d.completedAt || null,
          goal: d.goal || "Khác",
          priority: d.priority || "Trung bình"
        });
      });
      setTasks(fetchedTasks);

      // Trigger automatic default state generation if database document just got created and is empty
      if (snapshot.empty) {
        generateDemoData(syncCode);
      }
    });

    const messagesRef = collection(db, "sessions", syncCode, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMsgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        fetchedMsgs.push({
          id: docSnap.id,
          role: d.role || "user",
          text: d.text || "",
          createdAt: d.createdAt || ""
        });
      });
      setMessages(fetchedMsgs);
    });

    return () => {
      unsubTasks();
      unsubMessages();
    };
  }, [syncCode]);

  // Seed default nice demo tasks and AI greetings for new setups
  const generateDemoData = async (code: string) => {
    const tasksCollection = collection(db, "sessions", code, "tasks");
    const messagesCollection = collection(db, "sessions", code, "messages");

    const demoTasks = [
      {
        text: "Lên kế hoạch công việc và học tập cho ban mai",
        completed: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        dueDate: todayStr,
        goal: "Công việc",
        priority: "Cao" as Priority
      },
      {
        text: "Tập thể dục thể thao 30 phút rèn luyện sức bền",
        completed: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        dueDate: todayStr,
        goal: "Sức khỏe",
        priority: "Trung bình" as Priority,
        completedAt: new Date().toISOString()
      },
      {
        text: "Đọc 10 trang sách lập trình hoặc kỹ năng mềm",
        completed: false,
        createdAt: new Date(Date.now() - 1080000).toISOString(),
        dueDate: todayStr,
        goal: "Học tập",
        priority: "Thấp" as Priority
      }
    ];

    for (const t of demoTasks) {
      await addDoc(tasksCollection, t);
    }

    const firstMsg = {
      role: "model",
      text: "Chào mừng bạn! Tôi là Trợ Lý Lập Kế Hoạch AI.\n\nTôi đã tạo sẵn một vài công việc mẫu để bạn khám phá đồ thị tiến trình ở cột bên phải. Bạn hãy gõ câu hỏi ở khung chat bên dưới hoặc bấm nút **🔍 Tìm bất thường & Đề xuất** để tôi phân tích danh sách và đưa ra cảnh báo quá hạn hay lời khuyên hữu hiệu giúp bạn lập kế hoạch nhé!",
      createdAt: new Date().toISOString()
    };

    await addDoc(messagesCollection, firstMsg);
  };

  // Sync session management
  const handleConnectSync = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputSyncCode.trim().toUpperCase();
    if (!cleanCode) return;
    setSyncCode(cleanCode);
    localStorage.setItem("todo_sync_code", cleanCode);
    setInputSyncCode("");
    setIsSyncExpanded(false);
  };

  const handleResetSyncCode = () => {
    if (confirm("Bạn có chắc chắn muốn tạo mã đồng bộ mới? Dữ liệu cũ sẽ không mất nhưng thiết bị này sẽ tách sang dòng đồng bộ mới.")) {
      const newCode = generateSyncCode();
      setSyncCode(newCode);
      localStorage.setItem("todo_sync_code", newCode);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(syncCode);
    setClipboardFeedback(true);
    setTimeout(() => setClipboardFeedback(false), 2000);
  };

  // 2. Firestore Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const tasksCollection = collection(db, "sessions", syncCode, "tasks");
      await addDoc(tasksCollection, {
        text: newText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: newDueDate,
        goal: newGoal,
        priority: newPriority
      });

      // Clear main text box after adding
      setNewText("");
    } catch (err) {
      console.error("Lỗi thêm công việc:", err);
    }
  };

  // AI Suggestion Adder
  const handleAddAIProposedTasks = async (suggested: { text: string; goal: string; priority: "Cao" | "Trung bình" | "Thấp"; dueDate: string }[]) => {
    try {
      const tasksCollection = collection(db, "sessions", syncCode, "tasks");
      for (const t of suggested) {
        await addDoc(tasksCollection, {
          text: t.text,
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: t.dueDate,
          goal: t.goal,
          priority: t.priority
        });
      }
    } catch (err) {
      console.error("Lỗi thêm công việc AI đề xuất:", err);
    }
  };

  // 3. Toggle completed status
  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const taskDoc = doc(db, "sessions", syncCode, "tasks", id);
      const nextCompleted = !task.completed;
      await updateDoc(taskDoc, {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : null
      });
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  // 4. Update individual fields
  const handleUpdateTask = async (id: string, updatedFields: Partial<Task>) => {
    try {
      const taskDoc = doc(db, "sessions", syncCode, "tasks", id);
      await updateDoc(taskDoc, updatedFields);
    } catch (err) {
      console.error("Lỗi sửa công việc:", err);
    }
  };

  // 5. Delete transaction
  const handleDeleteTask = async (id: string) => {
    try {
      const taskDoc = doc(db, "sessions", syncCode, "tasks", id);
      await deleteDoc(taskDoc);
    } catch (err) {
      console.error("Lỗi xóa công việc:", err);
    }
  };

  // 6. Send User message and request Gemini backend reply
  const handleSendMessage = async (text: string) => {
    setIsAiLoading(true);

    const messagesCollection = collection(db, "sessions", syncCode, "messages");
    const userMsg = {
      role: "user" as const,
      text: text,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(messagesCollection, userMsg);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          tasks: tasks,
          today: todayStr
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi gọi phản hồi AI từ máy chủ");
      }

      const resData = await response.json();

      await addDoc(messagesCollection, {
        role: "model",
        text: resData.text,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn AI:", err);
      await addDoc(messagesCollection, {
        role: "model",
        text: `⚠️ Trợ lý AI đang tạm thời gián đoạn. Lỗi chi tiết: ${err.message || "Lỗi xử lý hệ thống"}. Hãy chắc chắn bạn đã cấu hình phím GEMINI_API_KEY trong tệp .env hoặc Secrets panel.`,
        createdAt: new Date().toISOString()
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Front-end Filter algorithm logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGoal = focusedGoal ? t.goal === focusedGoal : true;
    const matchesStatus =
      filterStatus === "Tất cả"
        ? true
        : filterStatus === "Đã xong"
        ? t.completed
        : !t.completed;

    return matchesSearch && matchesGoal && matchesStatus;
  });

  return (
    <div className="min-h-screen nothing-dotted-bg text-black flex flex-col antialiased font-sans pb-12">
      {/* Dynamic Sync/Header Banner in Nothing style */}
      <header className="bg-white border-b-[1.5px] border-black py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand/Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-[1.5px] border-black bg-black flex items-center justify-center text-white">
              <span className="font-dot text-2xl leading-none">N</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none flex items-center gap-2">
                NOTHING PLANNER
                <span className="text-[9px] font-mono border border-black px-1 py-0.5 bg-black text-white font-bold">OS-V2.5</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase tracking-tight">DAILY ASSISTANT SYNCHRONIZATION</p>
            </div>
          </div>

          {/* Sync status section */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border-[1.5px] border-black bg-white px-3 py-1.5 rounded-none font-mono text-xs">
              <span className="text-zinc-500 font-black">SYS_KEY:</span>
              <span className="font-black tracking-wider text-black">{syncCode}</span>
              <button
                onClick={copyToClipboard}
                className="text-black hover:text-neutral-600 transition-colors pl-2 border-l border-neutral-300 flex items-center gap-1"
                title="Sao chép Code"
              >
                <Copy className="w-3 h-3" />
                <span className="text-[9px] font-black">{clipboardFeedback ? "COPIED" : "COPY"}</span>
              </button>
            </div>

            <button
              onClick={() => setIsSyncExpanded(!isSyncExpanded)}
              className="text-xs uppercase font-extrabold font-mono text-black bg-white border-[1.5px] border-black hover:bg-neutral-100 px-3.5 py-1.5 rounded-none transition-all flex items-center gap-1.5 action-btn"
            >
              <Smartphone className="w-3.5 h-3.5" />
              ĐỒNG BỘ MULTI-DEV
            </button>
          </div>
        </div>
      </header>

      {/* Sync Expand Panel with strict monospace layout */}
      <AnimatePresence>
        {isSyncExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black text-white border-b-[1px] border-t-[1px] border-black overflow-hidden font-mono text-xs"
          >
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black flex items-center gap-2 tracking-widest text-white uppercase">
                  <Smartphone className="w-4 h-4 text-nothing-red animate-pulse" />
                  KẾT NỐI VÀ ĐỒNG BỘ ĐA THIẾT BỊ HOÀN TOÀN TỰ ĐỘNG
                </h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
                  NHẬP MÃ ĐỒNG BỘ HIỆN CÓ CỦA BẠN (VD: TODO-3829) TRÊN THIẾT BỊ KHÁC ĐỂ KẾT NỐI THỜI GIAN THỰC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2 border-t border-dashed border-zinc-800">
                <form onSubmit={handleConnectSync} className="flex gap-2">
                  <input
                    type="text"
                    value={inputSyncCode}
                    onChange={(e) => setInputSyncCode(e.target.value)}
                    placeholder="VÍ DỤ: TODO-1234"
                    className="flex-1 text-xs px-3 py-2 bg-zinc-900 border border-zinc-700 placeholder-zinc-500 text-white font-extrabold uppercase tracking-widest focus:outline-none focus:border-white rounded-none"
                  />
                  <button
                    type="submit"
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase px-4 py-2 transition-all rounded-none"
                  >
                    KẾT NỐI_
                  </button>
                </form>

                <div className="flex gap-2">
                  <button
                    onClick={handleResetSyncCode}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-black uppercase py-2 px-3 transition-colors text-white rounded-none flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    TẠO MÃ MỚI
                  </button>
                  <button
                    onClick={() => setIsSyncExpanded(false)}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-[10px] font-black uppercase py-2 px-3 text-zinc-400 border border-zinc-800 transition-colors rounded-none"
                  >
                    ĐÓNG BẢNG_
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Checklist & Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick task creation card */}
          <div className="bg-white rounded-lg border-[1.5px] border-black p-5 space-y-4 nothing-shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <h2 className="text-xs font-black text-black uppercase tracking-widest font-mono">
                THÊM KẾ HOẠCH MỚI
              </h2>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Hôm nay bạn cần hoàn thành cam kết gì?"
                  className="flex-1 text-xs px-3.5 py-3 border-[1.5px] border-black bg-white text-black placeholder-zinc-400 focus:outline-none rounded-none font-bold uppercase transition-all"
                />
                <button
                  type="submit"
                  disabled={!newText.trim()}
                  className="px-5 py-3 rounded-none bg-black text-white disabled:bg-neutral-200 disabled:text-neutral-400 font-black uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  THÊM KẾ HOẠCH
                </button>
              </div>

              {/* Advanced configuration inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-dashed border-neutral-300 pt-3">
                
                {/* Goal Selector */}
                <div className="space-y-1 bg-neutral-50 p-2 border border-neutral-200">
                  <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest font-mono">CHỌN MỤC TIÊU</label>
                  <select
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full text-xs py-1 border-b border-black bg-transparent text-black font-extrabold focus:outline-none"
                  >
                    {GOAL_TYPES.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection brutalist controls */}
                <div className="space-y-1 bg-neutral-50 p-2 border border-neutral-200">
                  <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest font-mono">ƯU TIÊN</label>
                  <div className="flex border border-black rounded-none overflow-hidden mt-1 bg-white">
                    {(["Cao", "Trung bình", "Thấp"] as Priority[]).map((p) => {
                      const isSelected = newPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 text-[8px] py-1 font-extrabold uppercase transition-colors font-mono ${
                            isSelected
                              ? p === "Cao"
                                ? "bg-nothing-red text-white"
                                : p === "Trung bình"
                                ? "bg-black text-white"
                                : "bg-neutral-600 text-white"
                              : "bg-white text-zinc-500 hover:bg-neutral-50"
                          }`}
                        >
                          {p === "Cao" ? "HIGH" : p === "Trung bình" ? "MED" : "LOW"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hạn chót selection */}
                <div className="space-y-1 bg-neutral-50 p-2 border border-neutral-200">
                  <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest font-mono">HẠN CHÓT</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs py-1 border-b border-black bg-transparent text-black font-extrabold font-mono focus:outline-none"
                  />
                </div>

              </div>
            </form>
          </div>

          {/* Checklist management view */}
          <div className="bg-white rounded-lg border-[1.5px] border-black p-5 space-y-4 nothing-shadow-sm">
            
            {/* Filter and control pane */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-[1.5px] border-black">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-black" />
                <h2 className="text-xs font-black text-black uppercase tracking-widest font-mono">KẾ HOẠCH HIỆN CÓ</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 border border-black bg-black text-white font-mono">
                  {filteredTasks.length} VIỆC
                </span>
              </div>

              {/* Status toggles */}
              <div className="flex border border-black rounded-none p-0.5 bg-neutral-100 font-mono">
                {(["Tất cả", "Chưa xong", "Đã xong"] as const).map((status) => {
                  const isSelected = filterStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-none transition-colors ${
                        isSelected ? "bg-black text-white border border-black" : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-view Search bar */}
            <div className="flex items-center gap-2 font-mono">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="TÌM KIẾM CÔNG VIỆC..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-black focus:outline-none text-black font-bold uppercase placeholder-zinc-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-white bg-black px-1.5 py-0.5"
                  >
                    XÓA
                  </button>
                )}
              </div>
            </div>

            {/* Task list array */}
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-black space-y-4">
                  <div className="w-12 h-12 border-[1.5px] border-black flex items-center justify-center bg-white mx-auto">
                    <Inbox className="w-5 h-5 text-black" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-1 font-mono">
                    <p className="text-xs font-black uppercase tracking-wider">HÒA BÌNH TUYỆT ĐỐI_</p>
                    <p className="text-[9px] text-zinc-500 uppercase leading-relaxed font-semibold">
                      {focusedGoal ? `THỬ TẮT BỘ LỌC '${focusedGoal.toUpperCase()}' HOẶC THÊM CÔNG VIỆC CHƯA HOÀN THÀNH` : "HÃY THÊM MỘT CÔNG VIỆC MỚI ĐỂ SÂN CHƠI NĂNG SUẤT BẮT ĐẦU VẬN HÀNH!"}
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <TaskItem
                        task={task}
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onUpdate={handleUpdateTask}
                        todayStr={todayStr}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Charts & AI (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recharts progress visualization */}
          <GoalChart
            tasks={tasks}
            focusedGoal={focusedGoal}
            setFocusedGoal={setFocusedGoal}
          />

          {/* AI Helper chat box */}
          <ChatAI
            tasks={tasks}
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddSuggestedTasks={handleAddAIProposedTasks}
            isLoading={isAiLoading}
          />
          
        </div>
      </main>
    </div>
  );
}
