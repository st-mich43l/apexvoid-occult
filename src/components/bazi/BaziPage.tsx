import { useEffect, useMemo, useState } from "react";
import { generateBaziChart } from "@/lib/bazi/bazi-engine";
import { buildBaziText } from "@/lib/bazi/bazi-text";
import { DEFAULT_MANUAL_LONGITUDE } from "@/lib/bazi/provinces";
import { BaziChart as BaziChartComponent } from "./BaziChart";
import { BRANCHES } from "@/lib/calendar/sexagenary";
import { maskDdMmYyyy, normalizeDdMmYyyy, parseDdMmYyyy } from "@/lib/bazi/form-datetime";

const BAZI_FORM_STORAGE_KEY = "bazi.form.v4";

const BRANCH_HAN: Record<string, string> = {
  Tý: "子",
  Sửu: "丑",
  Dần: "寅",
  Mão: "卯",
  Thìn: "辰",
  Tị: "巳",
  Ngọ: "午",
  Mùi: "未",
  Thân: "申",
  Dậu: "酉",
  Tuất: "戌",
  Hợi: "亥",
};

const HOUR_RANGES = [
  "23-01",
  "01-03",
  "03-05",
  "05-07",
  "07-09",
  "09-11",
  "11-13",
  "13-15",
  "15-17",
  "17-19",
  "19-21",
  "21-23",
];

function hourBranchToClock(branch: string): { hour: number; minute: number } {
  const index = BRANCHES.indexOf(branch);
  const i = index < 0 ? 6 : index;
  return { hour: (i * 2) % 24, minute: 0 };
}

interface StoredBaziForm {
  dateInput: string;
  birthHour: string;
  gender: "M" | "F";
  timezone: number;
}

function loadStoredBaziForm(): Partial<StoredBaziForm> {
  try {
    const raw = localStorage.getItem(BAZI_FORM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function BaziPage() {
  const stored = loadStoredBaziForm();

  const [dateInput, setDateInput] = useState(() =>
    normalizeDdMmYyyy(stored.dateInput ?? "21/09/1991"),
  );
  const [birthHour, setBirthHour] = useState(() =>
    BRANCHES.includes(stored.birthHour ?? "") ? stored.birthHour! : "Dậu",
  );
  const [gender, setGender] = useState<"M" | "F">(() => stored.gender ?? "F");
  const [timezone, setTimezone] = useState(() => stored.timezone ?? 7);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const payload: StoredBaziForm = {
      dateInput,
      birthHour,
      gender,
      timezone,
    };
    try {
      localStorage.setItem(BAZI_FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // bỏ qua lỗi quota/private-mode
    }
  }, [dateInput, birthHour, gender, timezone]);

  const chart = useMemo(() => {
    try {
      const date = parseDdMmYyyy(dateInput);
      if (!date || !BRANCHES.includes(birthHour)) return null;
      const time = hourBranchToClock(birthHour);

      const instantMs =
        Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute) -
        timezone * 60 * 60 * 1000;
      const d = new Date(instantMs);
      if (isNaN(d.getTime())) return null;
      return generateBaziChart(d, DEFAULT_MANUAL_LONGITUDE, timezone * 60, gender);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [dateInput, birthHour, gender, timezone]);

  async function copyChart() {
    if (!chart) return;
    const text = buildBaziText(chart);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  const copyLabel =
    copyState === "success"
      ? "✓ Đã chép"
      : copyState === "error"
        ? "⚠ Lỗi"
        : "⧉ Copy Lá Số";

  return (
    <div className="min-h-screen bg-void text-paper font-sans p-4 lg:p-8">
      <div className="max-w-[1440px] mx-auto space-y-6">
        <nav className="topbar mb-6">
          <a href="/">← Void Occult</a>
        </nav>

        <header className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-display text-gold">Lá Số Bát Tự</h1>
            <p className="text-sm text-muted">Hệ thống an lá số Tứ Trụ (Bát Tự) dựa trên thuật toán thiên văn chính xác.</p>
          </div>
          {chart && (
            <button
              onClick={copyChart}
              className="text-sm bg-[var(--surface-1)] hover:bg-[var(--state-hover)] border border-[var(--border-subtle)] rounded px-3 py-1.5 transition-colors whitespace-nowrap text-paper"
            >
              {copyLabel}
            </button>
          )}
        </header>

        <section className="bg-ink rounded-lg p-3 lg:p-6 border border-[var(--border-subtle)] grid grid-cols-2 gap-3 items-stretch lg:flex lg:flex-row lg:gap-4 lg:items-end">
          <div className="col-span-2 flex flex-col gap-1 lg:flex-[2] lg:min-w-[240px]">
            <label className="text-xs text-muted uppercase tracking-wider">Ngày sinh (DL)</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="dd/mm/yyyy"
              maxLength={10}
              spellCheck={false}
              aria-label="Ngày sinh dương lịch, dd/mm/yyyy"
              value={dateInput}
              onChange={(e) => setDateInput(maskDdMmYyyy(e.target.value))}
              className="bg-void border border-[var(--border-subtle)] rounded px-3 py-2 text-sm focus:border-gold outline-none w-full font-mono tracking-wide"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1 lg:flex-[2] lg:min-w-[220px]">
            <label className="text-xs text-muted uppercase tracking-wider">Giờ sinh</label>
            <select
              aria-label="Giờ sinh"
              value={birthHour}
              onChange={(e) => setBirthHour(e.target.value)}
              className="bg-void border border-[var(--border-subtle)] rounded px-3 py-2 text-sm focus:border-gold outline-none w-full"
            >
              {BRANCHES.map((branch, index) => (
                <option value={branch} key={branch}>
                  {branch} {BRANCH_HAN[branch]} · {HOUR_RANGES[index]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 flex flex-col gap-1 lg:w-32 lg:flex-shrink-0">
            <label className="text-xs text-muted uppercase tracking-wider">Giới Tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "M" | "F")}
              className="bg-void border border-[var(--border-subtle)] rounded px-3 py-2 text-sm focus:border-gold outline-none w-full"
            >
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
            </select>
          </div>
          <div className="order-3 lg:order-none col-span-1 flex flex-col gap-1 lg:w-56 lg:flex-shrink-0">
            <label className="text-xs text-muted uppercase tracking-wider" title="Sinh ở miền Nam 1959–1975 chọn UTC+8">
              Múi Giờ (UTC+)
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(parseInt(e.target.value, 10))}
              className="bg-void border border-[var(--border-subtle)] rounded px-3 py-2 text-sm focus:border-gold outline-none w-full"
            >
              <option value={7}>UTC+7 (Mặc định)</option>
              <option value={8}>UTC+8 (Miền Nam 1959-1975)</option>
            </select>
          </div>
        </section>

        {chart ? (
          <BaziChartComponent chart={chart} />
        ) : (
          <div className="text-center py-12 text-muted">Vui lòng nhập ngày giờ sinh hợp lệ.</div>
        )}
      </div>
    </div>
  );
}
