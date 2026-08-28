import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiChartDto } from "@/api/contracts";
import { AiChat } from "./AiChat";

describe("AiChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the current profile with the chart context", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: delta\ndata: "Nội dung luận giải"\n\n',
          ),
        );
        controller.close();
      },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    } as Response);

    render(
      <AiChat
        getContext={() => ({
          chartText: "Lá số hợp lệ",
          chart: { school: "nam-phai", gender: "female" } as ApiChartDto,
          profile: {
            name: "An",
            occupationStatus: "Đang làm việc",
            relationshipStatus: "Độc thân",
          },
        })}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Hỏi về sự nghiệp/),
      { target: { value: "Xem công việc" } },
    );
    fireEvent.click(screen.getByTitle("Gửi"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0]?.[1];
    const payload = JSON.parse(String(request?.body));
    expect(payload.profile).toEqual({
      name: "An",
      occupationStatus: "Đang làm việc",
      relationshipStatus: "Độc thân",
    });
  });

  it("surfaces unsupported Trung Châu narrative without invalidating the chart", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      body: null,
      json: async () => ({
        code: "UNSUPPORTED_NARRATIVE_SCHOOL",
        error: "UNSUPPORTED_NARRATIVE_SCHOOL",
        school: "trung-chau",
        message: "…",
      }),
    } as unknown as Response);

    render(
      <AiChat
        getContext={() => ({
          chartText: "Lá số Trung Châu hợp lệ",
          chart: { school: "trung-chau", gender: "male" } as ApiChartDto,
          profile: { name: "", occupationStatus: "", relationshipStatus: "" },
        })}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Hỏi về sự nghiệp/),
      { target: { value: "Xem tổng quan" } },
    );
    fireEvent.click(screen.getByTitle("Gửi"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        screen.getByText(/Luận giải AI cho Trung Châu chưa được kích hoạt/),
      ).toBeTruthy(),
    );
  });
});
