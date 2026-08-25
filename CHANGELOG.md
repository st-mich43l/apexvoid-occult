# Changelog

## Unreleased

### Fixed

- **Tử Vi (Palace Overview)**: Restored Palace Overview production numeric
  **and V1.2 version identity** to the historical runtime at
  `0ac04ad0875dd3de5b03036d8a673fa6b00b8a08` (`PO-FROZEN-0ac04ad`). Fixtures
  come from that worktree; a narrow PO brightness compat overlay covers later
  Calculation Core drift (Thiên Cơ@Sửu). Research V2 remains detached. Not a
  recalibration.

### Added

- **Tử Vi (research)**: added a non-numeric Romance / Phu Thê semantic evidence audit for Annual Axes V0.10 (`romance-semantic-v0.1`). No production score or routing changes.

- **Tử Vi**: Annual Axes **V0.10** layered fortune (Natal + Đại Vận + Lưu Niên + Resonance) được promote thành runtime hiện hành cho Nam Phái với profile `layered-balanced` (30/25/35/10). Radar và detail UI đọc trực tiếp điểm V0.10; V0.8.2 chỉ còn là research/control baseline, không còn là public runtime. V0.10 vẫn **EXPERIMENTAL / UNCALIBRATED**.

- **Bát Tự (Tứ Trụ)**: Pipeline lấy Dụng Thần đa pháp — **Chuyên Vượng → Thông Quan → Phù Ức (/ Điều Hậu)**. Ngưỡng cấu hình trong `conventions.yongShenPipeline`. Minh bạch: `pipelineNotes` + nhãn pháp trên UI / text export. Chuyên Vượng / Thông Quan dùng heuristic % đóng cửa (khung *Tử Bình Chân Thuyên* / chú Xu); **cần thầy duyệt ngưỡng**. Bệnh Dược và bảng Điều Hậu Xuân–Thu theo Can chưa làm (không bịa).
- **Kinh Dịch**: Tạo trang mới "Lục Hào Đại Thành" (`/kinh-dich/luc-hao-dai-thanh`) đóng vai trò là bách khoa toàn thư chuyên sâu, tổng hợp các tuyệt kỹ từ Tăng San Bốc Dịch & Bốc Phệ Chính Tông: Dụng Thần Lưỡng Hiện, Phục Thần lộ dụng, Ám Động vs Xung Tán, Tam Hợp cục và Ứng Kỳ.
- **Kinh Dịch**: Bổ sung hệ thống kiến thức chuẩn Lục Hào vào cheat sheet: Cách gieo 3 đồng xu, Hệ sinh thái Dụng thần (Nguyên thần, Kỵ thần, Cừu thần), Lục Thú (Thanh Long, Chu Tước...), và Tượng trạng thái (Du Hồn, Quy Hồn).
- **Kinh Dịch**: Thêm biểu đồ minh họa vòng sinh khắc của Lục Thân.

### Changed

- **Kinh Dịch**: Refactored I Ching articles (Căn bản, Nâng cao) from raw HTML injected via `dangerouslySetInnerHTML` into fully-typed React (`.tsx`) components, utilizing modular `iching.css` for styling and componentizing SVG diagrams.

- **Bát Tự (Tứ Trụ)**: Tứ trụ một bảng (dương/âm/nông, can–chi, tàng can, nạp âm, trường sinh, thần sát); giờ gộp ô đồng hồ.
- **Bát Tự (Tứ Trụ)**: Form chọn ngày / tháng / năm (không gõ `dd/mm/yyyy`). Giờ chọn chi như Tử Vi. Mặc định 21/09/1991 giờ Dậu nữ.
- **Bát Tự (Tứ Trụ)**: Trụ giờ theo đồng hồ. Header dương/âm/nông, ± ngũ hành, viết tắt thập thần.
- **Bát Tự (Tứ Trụ)**: Trường sinh Nhật Chủ trên bốn trụ. Thần sát SSOT năm+ngày (Thiên Ất, Thái Cực, Lộc, Tướng Tinh, …); không ẩn sao theo mẫu, không gọi Thái Cực là Thiên Nộ. Cần thầy duyệt roster v1.
- **Tử Vi**: Chat luận giải trên điện thoại cuộn được khi nội dung dài.
- **Tử Vi**: Radar 12 cung và sáu trục: điểm hiện dưới biểu đồ khi hover cả cánh trục; hai thẻ cùng cột, radar 320px.
- **Tử Vi**: Sáu trục khí vận Nam Phái: điểm = 50 + 50×tanh(raw/5) (không còn 50+5×raw, không còn tanh/2 dồn sát 10/90). Cần thầy duyệt.

- **Tử Vi**: Thiên Đồng tại Dậu là **Hãm** (không theo bảng engine Đắc). Thiên Cơ tại Sửu là **Đắc / đắc địa** (không theo bảng engine Hãm). Thiên Di tại Sửu là **đắc địa**. Engine/golden không đổi. Cần thầy duyệt độ lớn cung.
- **Tử Vi**: Đại Vận (Nam Phái và Trung Châu): Tứ Hóa = hóa **năm sinh chiếu hạn** (Kỵ hội TP4C; cát hóa chỉ cung đại vận). Không chấm hóa can cung, không sao Lưu. Cần thầy duyệt.
- **Tử Vi**: Palace Overview có bảng SSOT **chính/phụ tinh + cách cục + tổ
  hợp** (`nam-phai-star-systems.v1.json`): 14 chính, 92 phụ, Tứ Hóa, Tuần/
  Triệt, 12 trường sinh; 8 cách cục đã có không cộng lần hai; thêm tổ hợp
  KB (Kình Đà, Hỏa Linh, Tham Hỏa/Linh, Lộc Mã, ngựa què, Đào Hoa sát, …).
  Tam hợp Bác Sĩ chỉ ghi hình học, chưa chấm điểm. Cần thầy duyệt.
- **Tử Vi**: Hung tinh phản vi khi đắc chỗ: Tham Hỏa/Linh đắc = bạo phát
  (Hãm mới phạt); Kình/Đà tứ mộ nhập miếu; chính Hãm gặp Lộc/Khoa. Cần thầy duyệt.
- **Tử Vi**: Tam Minh Đào–Hồng–Hỷ được chấm cát; Thanh Long hội/đối Hóa Kỵ
  là long–vân. Cần thầy duyệt.
- **Tử Vi**: Hóa Kỵ tọa tứ mộ (Thìn/Tuất/Sửu/Mùi) không phạt như Kỵ thường.
- **Tử Vi**: Palace Overview: cách cục/tổ hợp nhân theo chỗ ngồi
  (tọa vs hội tam hợp); xung chiếu đối cung không sao chép 1:1. Cần thầy duyệt.
- **Tử Vi**: Đại Vận không dùng sao Lưu / Lưu Hóa. Nam Phái không chấm Tứ Hóa can đại vận. Cần thầy duyệt.
- **Tử Vi**: Radar: nhiều chính đồng cung không cộng thành nhiều Miếu — Tử Phủ Vũ Tướng Liêm không dính vành. Sao kèm ≤ Đắc; 用 không đội cung đã Miếu. Cần thầy duyệt.
- **Tử Vi**: Palace Overview Tứ Hóa is a transform of the host star
  (40-cell matrix), not a separate additive evidence row. 12 / 40 cells
  have star-specific heuristic deltas; the rest keep the old four-constant
  fallback. Numeric scores **change**. Cần thầy duyệt on filled cells.
- **Tử Vi**: Palace Overview formations expanded 3 → 8 (Cự Nhật, Song Lộc,
  Lộc Quyền hội, Khoa Quyền Lộc, Kình Đà giáp Kỵ). Interaction deltas only.
- **Tử Vi**: Structural rules now pass through Tuần/Triệt attenuation
  (`localStructuralMagnitudeFactor` 0.6 / 0.4) in the same void pass as
  stars. Exactly one `void-attenuate` evidence id per voided palace in the
  frame.
- **Tử Vi**: Annual-axes Trung Châu lock fixture refreshed because natal
  major-star seeds are shared with Palace Overview.

### Added

- **Tử Vi**: Palace Overview scoring-rebuild note
  (`docs/research/palace-overview-scoring-rebuild-v2-1.md`).
- **Tử Vi**: Palace Overview v2 knowledge-model note
  (`docs/research/palace-overview-v2-knowledge-model.md`).
- **Tử Vi**: Research-only four-axis Palace Overview score candidate
  (`w_st=0.15`, CLI `compare-four-axis`). Production remains 2-axis.
  Calibration / shadow / production stay **NO_GO**.
- **Tử Vi**: Palace Overview distribution invariants now fail closed if
  median/mean scores inflate away from 50 on a 500-chart deterministic
  corpus. Calibration remains **NO_GO**.

- Palace Overview pilot execution hardening: canonical rubric 2.1 enums,
  assignment-only review forms, assignment-aware ingest, and no fabricated
  confidence. Pilot remains unaccepted. Calibration, shadow, and production
  stay **NO_GO**. Numeric scores unchanged.
- Palace Overview expert corpus pipeline: deterministic structural case
  discovery, natal fingerprints, coverage/promotion, compact pairwise
  assignment, research-only review form, validated ingest, and a five-case
  blinded pilot corpus. Decision: **PILOT_READY**. Calibration, shadow, and
  production stay **NO_GO**. Numeric scores unchanged.
- Palace Overview Benchmark V2 integrity (Stage 3.1): review packs from
  `normalizeNatalFacts`, real reviewer-overlap units, school-sliced
  Krippendorff readiness, usable pairwise counts, strict raw-review
  validation, calibration/holdout accessors, and
  `research:palace-overview:status`. Decision remains
  **READY_FOR_EXPERT_DATA_COLLECTION**. Calibration, shadow, and production
  stay **NO_GO**. Numeric scores unchanged.
- Palace Overview Stage 3: 紫微斗數全書卷二 conditional palace claims with
  exact section locators, honest coverage (not fake 168/168), Benchmark V2
  (case / review / adjudication), blind review-pack CLI, review validator,
  Split V2 SHA-256 holdout rule, and Krippendorff α from real review
  matrices. Decision: **READY_FOR_EXPERT_DATA_COLLECTION**. Calibration,
  shadow, and production remain **NO_GO**. Numeric scores unchanged.
- Palace Overview Stage 2 doctrine layer: source registry, twelve-palace
  matrix, sparse 14×12 claims, star-system recognition, school VCD policy,
  coverage components, conflict diagnostic, Krippendorff alpha, and
  `validate:palace-overview` vs `release:palace-overview:shadow`. Numeric
  scores remain frozen. Decision: **RESEARCH_READY_FOR_EXPERT_REVIEW**.
- Palace Overview scoring validation infrastructure: parameter registry,
  net-quality score semantics, evidence traces, expert-benchmark workflow,
  frozen chart-level split, sensitivity and distribution gates, and
  `npm run release:palace-overview:gate`. Numeric coefficients are unchanged
  heuristic seeds. Release decision remains **NO_GO** until expert review
  exists (`NO_GO_FOR_CALIBRATION`).

### Changed

- **Tử Vi**: Restored the original analysis card grid: 12 cung beside Lưu
  Niên, Đại vận beside Lưu Nguyệt.
- Updated the root and analysis READMEs to match the current Calculation Core /
  Analysis module tree, UI folders, docs, and release-gate commands.
- Consolidated frontend validation into one CI job: whitespace, dead-code audit,
  typecheck, tests, production build, and source-tree cleanliness.
- Updated the CI runtime to Node.js 22 and Python 3.12 with current GitHub
  Actions.
- Kept only runtime analysis modules and their regression coverage; archived
  research generators, generated reports, preview-only UI, and obsolete audit
  workflows were removed.
- Tightened the public TypeScript surface by removing unused barrel exports and
  declaring Tailwind CSS as a direct build dependency.

### Fixed

- Removed a Node-only dynamic `eval("require")` path from the browser bundle.
- Removed dangling knowledge references to deleted research files.

### Current analysis integrations

- Annual axes: `0.10.0` Nam Phái current runtime (**experimental / uncalibrated**); V0.8.2 control-only
- Major fortune: `0.5.4`
- Monthly flow: `0.3.0`

Older changes remain available in Git history.
