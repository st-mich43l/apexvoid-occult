import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChartDto, UserContext } from "@/types/chart";
import type { AiSubmissionContext } from "@/lib/ziwei/temporal-snapshots";

interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  warning?: boolean;
}

interface AiChatProps {
  /**
   * Must return a race-safe submission context captured from current React state.
   * Prefer including buildTemporalSnapshots bound to the same birth input / school.
   */
  getContext(): {
    chartText: string;
    chart: ChartDto | null;
    profile: UserContext;
    school?: AiSubmissionContext["school"];
    gender?: AiSubmissionContext["gender"];
    birthInput?: AiSubmissionContext["birthInput"];
    buildTemporalSnapshots?: AiSubmissionContext["buildTemporalSnapshots"];
  };
}

const INTRO =
  "Chào bạn. Tôi có thể luận tổng quan mệnh cách, sự nghiệp, tài chính, tình duyên, sức khỏe hoặc đại vận/lưu niên của lá số đang hiển thị.";

function endpoint(): string {
  const configured =
    window.VOIDOCC_CONFIG?.BACKEND_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    "";
  return String(configured).trim().replace(/\/+$/, "");
}

function mapTemporalError(payload: {
  code?: string;
  error?: string;
  message?: string;
  school?: string;
}): string {
  const code = payload.code ?? payload.error;
  if (code === "UNSUPPORTED_NARRATIVE_SCHOOL") {
    const schoolLabel =
      payload.school === "trung-chau" ? "Trung Châu" : payload.school;
    return schoolLabel === "Trung Châu"
      ? "Luận giải AI cho Trung Châu chưa được kích hoạt vì hệ thống hiện chưa có knowledge pack Trung Châu đã được kiểm chứng."
      : (payload.message ??
        "Luận giải AI cho trường phái này chưa được kích hoạt vì hệ thống hiện chưa có knowledge pack đã được kiểm chứng.");
  }
  if (code === "TEMPORAL_RANGE_TOO_LARGE") {
    return "Khoảng thời gian quá dài. Hãy chọn tối đa 5 năm để luận cùng lúc.";
  }
  if (code === "TEMPORAL_YEAR_OUT_OF_RANGE") {
    return "Năm yêu cầu nằm ngoài phạm vi lá số hiện được hỗ trợ.";
  }
  if (
    code === "TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH" ||
    code === "TEMPORAL_ANCHOR_MISMATCH"
  ) {
    return "Không thể tạo ngữ cảnh nhiều năm nhất quán với lá số đang hiển thị.";
  }
  if (
    code === "TEMPORAL_NEGOTIATION_FAILED" ||
    code === "TEMPORAL_SNAPSHOT_SET_MISMATCH"
  ) {
    return "Không thể chuẩn bị dữ liệu lưu niên đầy đủ cho khoảng thời gian này.";
  }
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  return "Không thể luận giải.";
}

async function readSseAnswer(
  body: ReadableStream<Uint8Array>,
  onDelta: (answer: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let answer = "";
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const [eventLine, dataLine] = line.split("\n");
      if (!eventLine || !dataLine) continue;
      const event = eventLine.replace("event: ", "").trim();
      const dataStr = dataLine.replace("data: ", "").trim();
      if (event === "error") {
        const data = JSON.parse(dataStr);
        throw new Error(data.message);
      } else if (event === "delta") {
        const chunk = JSON.parse(dataStr);
        answer += chunk;
        onDelta(answer);
      }
    }
  }
  buffer += decoder.decode();
  if (!answer.trim()) throw new Error("Backend không trả về nội dung");
  return answer;
}

export function AiChat({ getContext }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "ai", text: INTRO },
  ]);
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const messageBox = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const box = messageBox.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  function clear() {
    abortController.current?.abort();
    setHistory([]);
    setMessages([
      {
        id: nextId.current++,
        role: "ai",
        text: "Đã xoá hội thoại. Bạn muốn xem khía cạnh nào của lá số?",
      },
    ]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    // Capture submission context once — race-safe against later form edits.
    const ctx = getContext();
    const { chartText, chart, profile } = ctx;
    if (!chartText || !chart) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "ai",
          text: "Chưa có lá số hợp lệ để luận. Hãy kiểm tra lại dữ liệu sinh.",
          warning: true,
        },
      ]);
      return;
    }

    const requestHistory = history.slice(-6);
    const aiMessageId = nextId.current++;
    setInput("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: question },
      { id: aiMessageId, role: "ai", text: "Đang luận giải…" },
    ]);

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const baseBody: Record<string, unknown> = {
      question,
      chartText,
      chart,
      profile,
      history: requestHistory,
    };

    try {
      let response = await fetch(`${endpoint()}/api/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify(baseBody),
      });

      // One-shot temporal negotiation — invisible to the user.
      if (response.status === 409) {
        const payload = (await response.json()) as {
          code?: string;
          years?: number[];
          anchorYear?: number;
        };
        if (payload.code !== "TEMPORAL_SNAPSHOTS_REQUIRED") {
          throw new Error(mapTemporalError(payload));
        }
        if (!ctx.buildTemporalSnapshots) {
          throw new Error("TEMPORAL_NEGOTIATION_FAILED");
        }
        const years = payload.years ?? [];
        const temporalSnapshots = ctx.buildTemporalSnapshots(years);
        response = await fetch(`${endpoint()}/api/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ ...baseBody, temporalSnapshots }),
        });
        if (response.status === 409) {
          throw new Error("TEMPORAL_NEGOTIATION_FAILED");
        }
      }

      if (!response.ok || !response.body) {
        let reason = `HTTP ${response.status}`;
        try {
          const payload = (await response.json()) as {
            error?: string;
            code?: string;
            school?: string;
            message?: string;
          };
          reason = mapTemporalError(payload) || reason;
        } catch {
          // non-JSON
        }
        throw new Error(reason);
      }

      const answer = await readSseAnswer(response.body, (text) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === aiMessageId ? { ...message, text } : message,
          ),
        );
      });

      setHistory((current) => [
        ...current.slice(-5),
        { role: "user", text: question },
        { role: "model", text: answer },
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      const reason = error instanceof Error ? error.message : String(error);
      const friendly =
        reason === "TEMPORAL_NEGOTIATION_FAILED"
          ? "Không thể chuẩn bị dữ liệu lưu niên đầy đủ cho khoảng thời gian này."
          : reason === "TEMPORAL_RANGE_TOO_LARGE"
            ? "Khoảng thời gian quá dài. Hãy chọn tối đa 5 năm để luận cùng lúc."
            : reason === "TEMPORAL_YEAR_OUT_OF_RANGE"
              ? "Năm yêu cầu nằm ngoài phạm vi lá số hiện được hỗ trợ."
              : reason;
      setMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                warning: true,
                text: `Không thể luận giải: ${friendly}\n\nKiểm tra backend và route /api/interpret.`,
              }
            : message,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="chat-section">
      <div id="aiChat" className="ai-chat">
        <div className="ai-chat-panel">
          <div className="ai-chat-head">
            <div>
              <strong>Luận giải Tử Vi</strong>
            </div>
            <button
              type="button"
              className="ai-icon-btn"
              title="Xoá hội thoại"
              onClick={clear}
              disabled={busy}
            >
              🗑
            </button>
          </div>
          <div className="ai-chat-msgs" ref={messageBox} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-msg ai-msg-${message.role}${message.warning ? " is-warn" : ""}`}
              >
                <div className="ai-msg-avatar" aria-hidden="true">
                  {message.role === "ai" ? "🔮" : "👤"}
                </div>
                <div className="ai-msg-content ai-plain-text">
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form className="ai-chat-input" onSubmit={submit}>
            <textarea
              rows={1}
              value={input}
              disabled={busy}
              placeholder="Hỏi về sự nghiệp, tài chính, tình duyên, đại vận…"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="ai-send-btn"
              title="Gửi"
              disabled={busy || !input.trim()}
            >
              {busy ? "…" : "➤"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
