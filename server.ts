import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to lazy-initialize GoogleGenAI to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// REST API for Chat & AI Task Planning
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, tasks, today } = req.body;

    const formattedTasks = tasks && tasks.length > 0
      ? tasks.map((t: any) => 
          `- ID: ${t.id}, Nội dung: "${t.text}", Trạng thái: ${t.completed ? "Hoàn thành" : "Chưa hoàn thành"}, Hạn chót: ${t.dueDate || "Không có"}, Mục tiêu: ${t.goal || "Không rõ"}, Độ ưu tiên: ${t.priority || "Trung bình"}`
        ).join("\n")
      : "(Không có công việc nào trong danh sách hiện tại)";

    const systemPrompt = `
Bạn là một trợ lý AI lập kế hoạch cá nhân chuyên nghiệp và chu đáo bằng tiếng Việt.
Hôm nay là ngày: ${today || new Date().toISOString().split('T')[0]}.

Nhiệm vụ của bạn:
1. Giúp người dùng lên kế hoạch công việc hàng ngày một cách khoa học và hiệu quả dựa trên các Mục tiêu (Goal), Độ ưu tiên (Priority), và Hạn chót (Due date).
2. Phát hiện bất thường trong danh sách công việc hiện tại, bao gồm:
   - Quá nhiều công việc chưa hoàn thành (gây quá tải).
   - Công việc quá hạn chót (dueDate trước ngày hôm nay nhưng chưa completed).
   - Sự mất cân bằng giữa các mục tiêu (ví dụ: chỉ có công việc mà không có mục tiêu Sức khỏe, Học tập hay Cá nhân).
   - Phân bổ độ ưu tiên bất hợp lý (ví dụ: quá nhiều việc "Cao", không có việc trung bình/thấp).
3. Đề xuất các cải tiến cụ thể, thiết thực và động viên tinh thần người dùng. If there is any issue, point it out directly and suggest resolution.
4. Nếu người dùng muốn thêm việc, hướng dẫn họ hoặc tự đề xuất 3-5 đầu việc cụ thể tương thích. 
5. ĐẶC BIỆT: Khi bạn đề xuất các công việc cụ thể mới cho người dùng để họ có thể thêm vào danh sách, hãy luôn đính kèm một cấu trúc JSON JSON_TASKS_SUGGESTION ở cuối phản hồi của bạn dưới dạng block mã markdown để hệ thống frontend của chúng tôi có thể hiển thị nút "Thêm vào danh sách công việc" trực tiếp!
   Cú pháp block mã JSON đề xuất chính xác như sau:
   \`\`\`json_tasks_suggestion
   [
     {
       "text": "Ăn tối lành mạnh và đi bộ nhẹ nhàng",
       "goal": "Sức khỏe",
       "priority": "Trung bình",
       "dueDate": "${today}"
     }
   ]
   \`\`\`
   Lưu ý: Chỉ đặt trong block mã \`\`\`json_tasks_suggestion ... \`\`\` này những công việc mới mà bạn đề xuất thực sự, không chứa text rườm rà trong block này. Trường "goal" phải là một trong các mục: "Công việc", "Học tập", "Sức khỏe", "Cá nhân", "Tài chính", "Khác". Trường "priority" phải là "Cao", "Trung bình", hoặc "Thấp".

Dưới đây là danh sách công việc hiện tại của người dùng:
${formattedTasks}

Hãy trò chuyện bằng văn phong lịch sự, ấm áp, tích cực, truyền động lực, sử dụng ngôn ngữ tự nhiên tiếng Việt phong phú.
`;

    // Construct request payload for @google/genai
    const contents = [];
    
    // Convert previous messages to Gemini SDK contents format
    if (messages && messages.length > 0) {
      // We only take the last 15 messages for keeping server payload small
      const recentMessages = messages.slice(-15);
      for (const msg of recentMessages) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    } else {
      // Add a default context-initiator
      contents.push({
        role: "user",
        parts: [{ text: "Chào bạn, hãy phân tích công việc của tôi!" }]
      });
    }

    const client = getAIClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Xin lỗi, tôi chưa thể trả lời lúc này do sự cố kết nối.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý yêu cầu AI" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
