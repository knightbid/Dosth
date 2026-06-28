import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { Task, GOAL_TYPES } from "../types";
import { ChevronRight, Activity } from "lucide-react";

interface GoalChartProps {
  tasks: Task[];
  focusedGoal: string | null;
  setFocusedGoal: (goal: string | null) => void;
}

// Nothing Tech themed colors for each goal
const GOAL_MONOCHROME_COLORS: Record<string, string> = {
  "Công việc": "#000000",      // Pure black
  "Học tập": "#3f3f46",       // Zinc 700
  "Sức khỏe": "#ff2a00",      // Nothing Red
  "Cá nhân": "#71717a",       // Zinc 500
  "Tài chính": "#a1a1aa",     // Zinc 400
  "Khác": "#e4e4e7"           // Zinc 200
};

export default function GoalChart({ tasks, focusedGoal, setFocusedGoal }: GoalChartProps) {
  // Aggregate tasks by Goal
  const data = GOAL_TYPES.map((goal) => {
    const goalTasks = tasks.filter((t) => t.goal === goal);
    const total = goalTasks.length;
    const completed = goalTasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      name: goal,
      "Tổng số việc": total,
      "Đã hoàn thành": completed,
      "Tỷ lệ %": rate,
      color: GOAL_MONOCHROME_COLORS[goal] || "#000000"
    };
  });

  // Filter out goals with 0 tasks to make the chart cleaner, unless it is focused
  const activeChartData = data.filter((d) => d["Tổng số việc"] > 0 || d.name === focusedGoal);

  // Overall metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border-[1.5px] border-black p-5 space-y-6 nothing-shadow-sm">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-nothing-red animate-ping rounded-full absolute"></span>
            <span className="w-2.5 h-2.5 bg-nothing-red rounded-full relative"></span>
            <h2 className="text-sm font-extrabold text-black uppercase tracking-widest font-mono flex items-center gap-2">
              THEO DÕI TIẾN ĐỘ
            </h2>
          </div>
          <p className="text-[10px] text-neutral-450 mt-1 font-mono uppercase tracking-tight">
            Phân bổ dữ liệu & mật độ hoàn thành mục tiêu
          </p>
        </div>
        
        {/* Total Progress Badge in Nothing style */}
        <div className="flex items-center gap-3 border-[1.5px] border-black px-3 py-1.5 bg-neutral-50 rounded-none">
          <div className="text-right">
            <span className="block text-[9px] font-black uppercase tracking-wider font-mono text-neutral-500">TIẾN TRÌNH</span>
            <span className="text-sm font-black text-black font-mono">
              {completedTasks}/{totalTasks} VIỆC
            </span>
          </div>
          <div className="w-[1px] h-6 bg-neutral-300"></div>
          <div className="text-center font-mono font-black text-lg text-black leading-none">
            {totalCompletionRate}%
          </div>
        </div>
      </div>

      {/* Goal Cards Grid / Quick Focus Controller */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {data.map((item) => {
          const isSelected = focusedGoal === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setFocusedGoal(isSelected ? null : item.name)}
              className={`p-3 border-[1.5px] rounded-none text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-neutral-300 hover:border-black"
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <span className="text-xs font-bold font-mono tracking-tight truncate">
                  {item.name.toUpperCase()}
                </span>
                <span
                  className={`text-[9px] font-bold font-mono px-1 border ${
                    isSelected
                      ? "bg-white text-black border-white"
                      : "bg-black text-white border-black"
                  }`}
                >
                  {item["Tỷ lệ %"]}%
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="leading-none">
                  <span className={`block text-[8px] font-mono uppercase ${isSelected ? "text-neutral-400" : "text-neutral-500"}`}>
                    ĐÃ XONG
                  </span>
                  <span className="text-sm font-black font-mono">
                    {item["Đã hoàn thành"]}
                    <span className={`text-xs font-normal ${isSelected ? "text-neutral-400" : "text-neutral-500"}`}>
                      /{item["Tổng số việc"]}
                    </span>
                  </span>
                </div>
                
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-100 ${
                  isSelected ? "translate-x-0 text-white" : "translate-x-1 opacity-40 group-hover:translate-x-0 group-hover:opacity-100"
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Focus banner */}
      {focusedGoal && (
        <div className="p-2 bg-black border border-black text-white rounded-none flex items-center justify-between text-xxs font-mono">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-nothing-red animate-pulse"></span>
            LỌC THEO: <strong>{focusedGoal.toUpperCase()}</strong> ({tasks.filter(t => t.goal === focusedGoal).length} VIỆC)
          </span>
          <button
            onClick={() => setFocusedGoal(null)}
            className="text-[9px] font-black uppercase text-black bg-white px-2 py-0.5 border border-white hover:bg-neutral-100 transition-colors"
          >
            HỦY LỌC
          </button>
        </div>
      )}

      {/* Main Bar Chart */}
      <div className="h-44 w-full pt-2">
        {activeChartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-[1.5px] border-dashed border-neutral-300 rounded-none bg-neutral-50/50">
            <p className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest font-mono">NO ANALYSIS DATA</p>
            <p className="text-[9px] text-neutral-400 font-mono mt-1">HÃY GÁN THÊM MỤC TIÊU CHO KẾ HOẠCH HÀNG NGÀY</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeChartData}
              margin={{ top: 10, right: 10, left: -30, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#000", fontFamily: "monospace", fontWeight: "700" }}
                axisLine={{ stroke: "#000", strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#000", fontFamily: "monospace" }}
                axisLine={{ stroke: "#000", strokeWidth: 1.5 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "0px",
                  border: "1.5px solid #000",
                  boxShadow: "2px 2px 0px 0px #000",
                  fontFamily: "monospace",
                  fontSize: "11px"
                }}
                labelStyle={{ fontWeight: "800", color: "#000", fontSize: "11px", borderBottom: "1px dashed #ccc", paddingBottom: "2px", marginBottom: "4px" }}
                itemStyle={{ fontSize: "11px", padding: "1px 0" }}
              />
              <Legend verticalAlign="top" height={28} iconType="square" iconSize={6} wrapperStyle={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} />
              <Bar dataKey="Tổng số việc" fill="#e4e4e7" stroke="#000" strokeWidth={1} barSize={12}>
                {activeChartData.map((entry, index) => (
                  <Cell key={`cell-total-${index}`} fill={`${entry.color}20`} />
                ))}
              </Bar>
              <Bar dataKey="Đã hoàn thành" stroke="#000" strokeWidth={1} barSize={12}>
                {activeChartData.map((entry, index) => (
                  <Cell key={`cell-done-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

