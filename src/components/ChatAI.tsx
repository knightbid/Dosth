import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Task, GOAL_TYPES } from "../types";
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  HelpCircle,
  Clock,
  CheckCircle,
  Lightbulb,
  CornerDownRight,
  ChevronRight
} from "lucide-react";

interface ChatAIProps {
  tasks: Task[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onAddSuggestedTasks: (suggested: { text: string; goal: string; priority: "Cao" | "Trung bình" | "Thấp"; dueDate: string }[]) => void;
  isLoading: boolean;
}

// Function to extract suggested tasks from Gemini text responses
function extractSuggestedTasks(text: string): { text: string; goal: string; priority: "Cao" | "Trung bình" | "Thấp"; dueDate: string }[] {
  try {
    const regex = /```json_tasks_suggestion\s*([\s\S]*?)\s*```/;
    const match = text.match(regex);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        return parsed.map(t => ({
          text: String(t.text || ""),
          goal: GOAL_TYPES.includes(t.goal as any) ? t.goal : "Công việc",
          priority: ["Cao", "Trung bình", "Thấp"].includes(t.priority) ? t.priority : "Trung bình",
          dueDate: String(t.dueDate || new Date().toISOString().split('T')[0])
        }));
      }
    }
  } catch (err) {
    console.error("Error parsing suggested tasks:", err);
  }
  return [];
}

// Clean response markdown code block out of the main text
function cleanMessageText(text: string): string {
  return text.replace(/```json_tasks_suggestion\s*([\s\S]*?)\s*```/g, "").trim();
}

export default function ChatAI({ tasks, messages, onSendMessage, onAddSuggestedTasks, isLoading }: ChatAIProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textMsg = inputText;
    setInputText("");
    await onSendMessage(textMsg);
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isLoading) return;
    await onSendMessage(promptText);
  };

  // Pre-determined helper quick actions
  const quickActions = [
    {
      label: "🔍 TÌM BẤT THƯỜNG & ĐỀ XUẤT",
      prompt: "Hãy đánh giá danh sách công việc của tôi, phát hiện những bất thường (như quá hạn, quá tải, chưa phân bổ mục tiêu) và đưa ra gợi ý giải quyết.",
      icon: AlertCircle
    },
    {
      label: "📅 LÊN KẾ HOẠCH MẪU HÔM NAY",
      prompt: "Lên hộ tôi danh sách kế hoạch 3 việc trọng tâm học tập, sức khỏe và công việc hiệu quả nhất cho ngày hôm nay để cân bằng cuộc sống.",
      icon: Sparkles
    },
    {
      label: "💡 THIẾT LẬP THÓI QUEN TỐT",
      prompt: "Đề xuất cho mình 3 thói quen buổi sáng/tối tốt để cải thiện hiệu suất công việc và nâng cao sức khỏe.",
      icon: Lightbulb
    }
  ];

  return (
    <div className="bg-white rounded-lg border-[1.5px] border-black flex flex-col h-[550px] overflow-hidden nothing-shadow-sm font-mono">
      {/* Header */}
      <div className="bg-black px-4 py-3.5 text-white flex items-center justify-between border-b-[1.5px] border-black">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          <div>
            <h2 className="text-xs font-black tracking-widest uppercase">TRỢ LÝ AI [NOTHING_PLAN_OS]</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-ping absolute"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-nothing-red relative"></span>
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest">REALTIME PLANNING ALIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-black space-y-5">
            <div className="w-12 h-12 border-[1.5px] border-black flex items-center justify-center bg-white">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest">KHỞI ĐỘNG CHAT OS</h3>
              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                Hỏi đáp, kiểm tra rủi ro công việc của bạn hoặc chọn các phân tích nhanh bên dưới.
              </p>
            </div>
            
            {/* Quick Actions at Center empty state */}
            <div className="w-full max-w-xs space-y-1.5">
              {quickActions.map((qa, index) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(qa.prompt)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-2.5 bg-white border-[1.5px] border-black hover:bg-neutral-100 transition-all text-left text-[10px] text-black font-bold uppercase tracking-wider group"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-black flex-shrink-0" />
                      {qa.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-black group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-sans">
            {messages.map((message) => {
              const isAI = message.role === "model";
              const rawText = message.text;
              const cleanText = cleanMessageText(rawText);
              const suggestions = isAI ? extractSuggestedTasks(rawText) : [];

              return (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line border-[1.5px] rounded-none ${
                        isAI
                          ? "bg-white border-black text-black nothing-shadow-sm"
                          : "bg-black border-black text-white"
                      }`}
                    >
                      {/* Message author tag */}
                      <span className={`block text-[9px] mb-1 font-bold font-mono tracking-widest uppercase ${isAI ? "text-nothing-red" : "text-neutral-400"}`}>
                        {isAI ? "● SYSTEM_AI" : "● USER"}
                      </span>
                      {cleanText}
                    </div>
                  </div>

                  {/* Rendering Actionable Suggestion Cards */}
                  {suggestions.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border-[1.5px] border-dashed border-black p-3.5 space-y-2.5 rounded-none">
                        <div className="flex items-center gap-1.5 text-black font-mono">
                          <CheckCircle className="w-4 h-4 text-black flex-shrink-0" />
                          <h4 className="text-[10px] font-black uppercase tracking-wider">
                            KẾ HOẠCH ĐỀ XUẤT ({suggestions.length} VIỆC)
                          </h4>
                        </div>
                        
                        <div className="space-y-1.5 font-mono border-t border-neutral-300 pt-2 pb-1">
                          {suggestions.map((s, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1 text-[10px] text-black">
                              <CornerDownRight className="w-3.5 h-3.5 text-black flex-shrink-0 mt-0.5" />
                              <div className="leading-tight">
                                <span className="font-bold">{s.text.toUpperCase()}</span>
                                <span className="text-[8px] text-zinc-500 block mt-0.5">
                                  [{s.goal.toUpperCase()}] • HẠN: {s.dueDate} • ƯU TIÊN: {s.priority.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => onAddSuggestedTasks(suggestions)}
                          className="w-full bg-black hover:bg-zinc-800 text-white text-[9px] font-black uppercase py-2 tracking-widest transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          THÊM TOÀN BỘ VÀO CHECKLIST
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* loading bubble */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-[1.5px] border-black px-3.5 py-2 nothing-shadow-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                  <span className="text-[9px] text-black font-mono font-bold uppercase tracking-wider">PLANNING ENGINE COMPILING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form & Quick Action Triggers */}
      <div className="border-t-[1.5px] border-black p-3 space-y-2.5 bg-white">
        {/* Quick buttons when there are active messages */}
        {messages.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-0.5 font-mono">
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(qa.prompt)}
                className="px-2 py-0.5 text-[8px] font-extrabold uppercase border border-neutral-300 hover:border-black bg-white text-zinc-600 hover:text-black transition-colors"
              >
                {qa.label.split(" ").slice(1).join(" ")}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-1.5 font-mono">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="NHẬP YÊU CẦU HOẶC ĐẶT CÂU HỎI... "
            className="flex-1 text-xs bg-white border border-black px-3 py-2 focus:outline-none placeholder-zinc-400 text-black uppercase font-bold"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2 border border-black bg-black text-white hover:bg-neutral-850 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[8px] text-zinc-400 text-center uppercase tracking-widest font-mono">
          [SECURE DATA ENVELOPE SYNC_CODE ONLINE]
        </p>
      </div>
    </div>
  );
}

