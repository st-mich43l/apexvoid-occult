# 🔮 Void Occult

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

Frontend cho thư viện Kinh Dịch / Lục Hào, công cụ lập lá số Tử Vi Đẩu Số
(Calculation Core + Analysis Modules) và backend luận giải Gemini.

## 🧱 Tech stack

- ⚛️ **React 19** + 📘 **TypeScript** strict
- ⚡ **Vite 8**
- 🎨 **Tailwind CSS 4**
- 🐍 **FastAPI** + 🔮 **Gemini** (streaming, key ẩn server-side)
- 🐳 **Docker Compose**
- 🌐 Nginx chỉ phục vụ bundle frontend bên trong container; ingress và TLS do repo
  `../routing` quản lý

Frontend được build thành artifact `dist/`. Container không còn mount hoặc public
toàn bộ source repository, và không còn cấu hình/phụ thuộc Netlify.

## 📂 Cấu trúc

```text
src/
  App.tsx                  router pathname (lazy-load từng trang)
  assets/                  ảnh tĩnh (QR ủng hộ, …)
  components/
    ziwei/
      ChartPage.tsx        trang /tu-vi
      chart/               CompactChart, MobileChart
      ai-chat/             chat luận giải
      analysis/            Palace Overview radar + rebuilding UI
      annual-axes/         Lưu niên / trục năm
      major-fortune/       Đại vận
      monthly-flow/        Lưu nguyệt
    bazi/                  UI Bát Tự (/bat-tu, /bazi)
    iching/                trang bài viết Kinh Dịch / Lục Hào
    shared/                HomePage, ArticlePage, SupportButton
  lib/
    ziwei/
      engine-nam-phai.ts   Calculation Core — Nam Phái
      engine-trung-chau.ts Calculation Core — Trung Châu
      chart.ts             adapter typed cho UI
      calculation/         helper tính toán phụ (không diễn giải điểm)
      analysis/            diễn giải facts (không an sao)
        facts/             natal fact normalization
        frame/             khung tĩnh TP4C
        knowledge/         catalog JSON theo module
        modules/
          palace-overview/ Cấu trúc 12 cung
          annual-axes/
          major-fortune/
          monthly-flow/
        contracts/         getAnalysisStatus, version surface
    bazi/                  engine Bát Tự
    calendar/              toán lịch / thiên văn dùng chung
  scripts/                 release gates (tsx, không vào UI bundle)
  content/iching/          bài viết gốc (.html), Vite import lúc build
  styles/                  CSS lá số Tử Vi
  types/                   DTO / hợp đồng TypeScript
docs/architecture/         Zi Wei architecture SSOT (Calculation vs Analysis, Annual Axes lineage)
docs/research/             Historical research ADRs / baselines (may be SUPERSEDED)
backend/                   FastAPI, RAG, Gemini streaming (narrative — not scoring authority)
deploy/
  frontend.Dockerfile      multi-stage build
  nginx.conf               static server nội bộ + SPA fallback
```

Chi tiết module diễn giải: [`src/lib/ziwei/analysis/README.md`](src/lib/ziwei/analysis/README.md)
và kiến trúc hệ thống: [`docs/architecture/`](docs/architecture/README.md).

Alias đường dẫn `@/` trỏ vào `src/` (`tsconfig.app.json`, `vite.config.ts`).

Hai engine Tử Vi là hàm thuần TypeScript, không phụ thuộc DOM. React chỉ nhận
`ChartData` qua `src/lib/ziwei/chart.ts`. Golden snapshot
(`src/lib/ziwei/golden.test.ts`, snapshot ở `tests/golden/`) chạy trong
`npm test` / CI.

**Calculation Core** an cung, an sao, lịch pháp, lưu hạn — không chấm điểm vận khí.
**Analysis** đọc facts đó, có version / school / knowledge riêng, không back-solve
lá số từ điểm mong muốn.

Kiến trúc đầy đủ (SSOT): [`docs/architecture/README.md`](docs/architecture/README.md).
Annual Axes production hiện hành: **V0.11 EXP** (Nam Phái). V0.12/V0.13 là
research control / candidate — không phải production.

## 💻 Phát triển frontend

Yêu cầu Node.js 22.12 trở lên.

```bash
npm ci
npm run dev
```

Vite chạy tại `http://localhost:5173` và proxy `/api`, `/health` sang FastAPI tại
`http://localhost:8000`.

Các lệnh kiểm tra:

```bash
npm run typecheck
npm run audit:dead-code
npm test
npm run build
npm run release:monthly-flow-v1:gate
npm run release:palace-overview:gate
npm run research:palace-overview:review-pack
npm run research:palace-overview:validate-reviews
```

Palace Overview scoring hiện **experimental**. Stage 3 research:
`READY_FOR_EXPERT_DATA_COLLECTION`. Calibration / shadow / production remain
`NO_GO` until human Benchmark V2 data exists. That is a valid gate result.

Backend dùng test thuần stdlib:

```bash
cd backend
python -m unittest discover -s tests
```

## 🐳 Chạy đầy đủ bằng Docker (local, không rebuild mỗi lần)

Tạo `backend/.env` và điền `GEMINI_API_KEY`, rồi tạo network một lần:

```bash
docker network create routing   # bỏ qua nếu đã có
docker compose up -d            # lần đầu build backend image nếu chưa có
```

Không cần `--build` cho ngày thường: frontend Vite và backend `--reload` mount
source từ máy host. Chỉ rebuild khi đổi `backend/Dockerfile` / `requirements.txt`:

```bash
docker compose build backend && docker compose up -d
```

Services (host):

- Frontend Vite — http://127.0.0.1:5173/
- Backend API — http://127.0.0.1:8000/health
- MongoDB — internal `mongodb:27017` trên network `routing`

Prod-like nginx static (tuỳ chọn, cần build):

```bash
docker compose -f docker-compose.yml -f docker-compose.static.yml \
  up -d --build frontend-static
# http://127.0.0.1:5174/
```

Public qua central ingress (`../routing`): `apexvoid.net` /
`void-occult.localhost` vẫn trỏ vào stack trên network `routing`.

## 🔗 Routes

Public qua central ingress (`../routing`): `apexvoid.net`, `fate.apexvoid.net`,
và `void-occult.localhost` (HTTP-only cho local) đều có thể trỏ vào stack này
trên network `routing`. Local host cũng publish `:5173` (Vite) và `:8000`.

- `/` — trang chủ (`apexvoid-occult-frontend`)
- `/tu-vi` — lá số Tử Vi + analysis modules (lazy-load)
- `/bat-tu`, `/bazi` — Bát Tự
- `/kinh-dich/luc-hao-co-ban`
- `/kinh-dich/luc-hao-nang-cao`
- `/api/interpret` — Gemini streaming qua FastAPI (`apexvoid-occult-backend`)
- `/health` — backend health (`apexvoid-occult-backend`)
- `/api/debug/*` — bị ingress chặn (404) ở production

Các URL `.html` / `/pages/...` cũ vẫn được `App.tsx` map tương thích để bookmark
không gãy.

## 🏛️ Ghi chú kiến trúc

- Gemini API key chỉ tồn tại ở backend; frontend không còn UI lưu API key trong
  `localStorage`.
- Engine Tử Vi được tách khỏi initial bundle và chỉ lazy-load khi mở `/tu-vi`.
- Export ảnh dùng trực tiếp package `html-to-image`.
- Nginx container dùng SPA fallback; central routing, hostname và TLS thuộc repo
  `../routing`.
- Tooling calibration / sensitivity / release gate nằm ở `src/scripts/` và
  `*/calibration/` — không chạy trên đường dẫn UI.
