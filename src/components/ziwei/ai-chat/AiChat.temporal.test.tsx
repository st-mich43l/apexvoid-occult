import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BirthInput, ChartDto } from "@/types/chart";
import { AiChat } from "./AiChat";

const birthInput: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function sse(text: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(`event: delta\ndata: ${JSON.stringify(text)}\n\n`),
      );
      controller.close();
    },
  });
}

describe("AiChat temporal negotiation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries once with TemporalSnapshotBundle and keeps a single chat turn", async () => {
    const buildTemporalSnapshots = vi.fn((years: number[]) => ({
      anchorAnnualYear: 2026,
      snapshots: years.map(
        (y) =>
          ({
            school: "nam-phai",
            gender: "female",
            annualYear: y,
          }) as ChartDto,
      ),
    }));

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        body: null,
        json: async () => ({
          code: "TEMPORAL_SNAPSHOTS_REQUIRED",
          anchorYear: 2026,
          years: [2027, 2028],
          maxSnapshots: 5,
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: sse("Luận 2027-2028"),
      } as Response);

    render(
      <AiChat
        getContext={() => ({
          chartText: "Lá số 2026",
          chart: {
            school: "nam-phai",
            gender: "female",
            annualYear: 2026,
          } as ChartDto,
          profile: { name: "", occupationStatus: "", relationshipStatus: "" },
          school: "nam-phai",
          gender: "female",
          birthInput,
          buildTemporalSnapshots,
        })}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Hỏi về sự nghiệp/), {
      target: { value: "2027 và 2028 thế nào?" },
    });
    fireEvent.click(screen.getByTitle("Gửi"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(buildTemporalSnapshots).toHaveBeenCalledWith([2027, 2028]);

    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(secondBody.temporalSnapshots.snapshots.map((s: { annualYear: number }) => s.annualYear)).toEqual([
      2027, 2028,
    ]);

    await waitFor(() => expect(screen.getByText("Luận 2027-2028")).toBeTruthy());
    expect(screen.getAllByText("2027 và 2028 thế nào?")).toHaveLength(1);
  });

  it("ordinary questions use a single request without temporalSnapshots", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      body: sse("Tổng quan"),
    } as Response);

    render(
      <AiChat
        getContext={() => ({
          chartText: "Lá số",
          chart: { school: "nam-phai", gender: "female", annualYear: 2026 } as ChartDto,
          profile: { name: "", occupationStatus: "", relationshipStatus: "" },
        })}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Hỏi về sự nghiệp/), {
      target: { value: "tổng quan sự nghiệp" },
    });
    fireEvent.click(screen.getByTitle("Gửi"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.temporalSnapshots).toBeNull();
  });
});
