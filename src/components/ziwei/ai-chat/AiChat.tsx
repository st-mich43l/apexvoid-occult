import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { UserContext } from "@/types/chart";
import type {
  ApiChartDto,
  ApiHistoryTurn,
  ApiInterpretRequest,
} from "@/api/contracts";
import {
  mapBackendErrorToUserMessage,
  parseTemporalSnapshotsRequired,
} from "@/api/errors";
import type { AiSubmissionContext } from "@/lib/ziwei/temporal-snapshots";

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
    chart: ApiChartDto | null;
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
  const [history, setHistory] = useState<ApiHistoryTurn[]>([]);
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

    const baseBody: ApiInterpretRequest = {
      question,
      chartText,
      chart,
      profile,
      history: requestHistory,
      temporalSnapshots: null,
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
        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          throw new Error("TEMPORAL_NEGOTIATION_FAILED");
        }
        const required = parseTemporalSnapshotsRequired(payload);
        if (!required) {
          throw new Error(mapBackendErrorToUserMessage(payload));
        }
        if (!ctx.buildTemporalSnapshots) {
          throw new Error("TEMPORAL_NEGOTIATION_FAILED");
        }
        const temporalSnapshots = ctx.buildTemporalSnapshots(required.years);
        const retryBody: ApiInterpretRequest = {
          ...baseBody,
          temporalSnapshots,
        };
        response = await fetch(`${endpoint()}/api/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify(retryBody),
        });
        if (response.status === 409) {
          throw new Error("TEMPORAL_NEGOTIATION_FAILED");
        }
      }

      if (!response.ok || !response.body) {
        let reason = `HTTP ${response.status}`;
        try {
          const payload: unknown = await response.json();
          reason = mapBackendErrorToUserMessage(payload) || reason;
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
