import { ArticleLayout } from "../shared/ArticleLayout";

export default function MasteryArticlePage() {
  return (
    <ArticleLayout title="Lục Hào Đại Thành" className="mastery-bg">
      <header className="iching-header mastery">
        <div className="iching-seal mastery han">精</div>
        <h1>
          Lục Hào · <em>Đại Thành Tuyệt Kỹ</em>
        </h1>
        <div className="iching-sub">
          Bí truyền từ Tăng San Bốc Dịch &amp; Bốc Phệ Chính Tông — Dụng thần phức
          tạp, Ám động, Tam hợp, Ứng kỳ.
        </div>
        <div className="iching-tier tier" style={{ color: "var(--gold)" }}>
          Tầng 3 · Tinh Hoa Bốc Dịch
        </div>
        <div className="iching-rule"></div>
      </header>

      {/* 1. DUNG THAN LUONG HIEN */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">壹</span>
          <h2>
            Dụng Thần Lưỡng Hiện<span className="han">兩現</span>
          </h2>
        </div>
        <p className="iching-lead">
          Khi trong một quẻ xuất hiện <b>hai hào</b> cùng mang Lục thân của Dụng thần (vd: hỏi tiền mà có 2 hào Thê Tài). Lúc này, ta phải chọn <b>1 hào làm trục chính</b> để luận đoán.
        </p>
        <div className="iching-card">
          <p style={{ marginBottom: 10 }}>
            Quy tắc chọn ưu tiên (từ cao xuống thấp) theo *Tăng San Bốc Dịch*:
          </p>
          <ol className="iching-steps">
            <li>
              <b>Ưu tiên hào Động:</b> "Thần triệu cơ ở động". Hào nào động thì lấy hào đó làm Dụng thần, hào tĩnh coi như phụ trợ.
            </li>
            <li>
              <b>Xét Tuần Không &amp; Nguyệt Phá:</b> Quan điểm Tăng San cho rằng "bệnh ở đâu, thuốc ở đó". Việc đang hỏi ứng với hào đang "có bệnh" (Không vong, Phá) — nên lấy nó làm Dụng thần để xét ứng kỳ chờ ngày "điền thực" (khỏi bệnh).
            </li>
            <li>
              <b>Hào lâm Nguyệt / Nhật / Xung / Hợp:</b> Ưu tiên lấy hào đang vượng hoặc đang chịu sự tác động trực tiếp của Nhật, Nguyệt.
            </li>
            <li>
              <b>Hào gần Thế:</b> Lấy hào nằm gần hào Thế hơn (ví dụ Thế ở hào 3, có hai hào Tài ở 1 và 4 thì lấy hào 4).
            </li>
          </ol>
          <div className="iching-note">
            Hào Dụng thần phụ (không được chọn) không bị vứt bỏ, mà đóng vai trò dự phòng hoặc cung cấp thêm góc nhìn (vd: 2 khoản tiền, 2 lựa chọn).
          </div>
        </div>
      </section>

      {/* 2. PHUC THAN LO DUNG */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">貳</span>
          <h2>
            Phục Thần Lộ Dụng<span className="han">伏神</span>
          </h2>
        </div>
        <p className="iching-lead">
          Dụng thần không hiện trong 6 hào thì tìm ở quẻ Bát Thuần (Phục thần). Hào đè lên nó gọi là <b>Phi thần</b>. Cốt lõi là xem Phục thần có <b>"lộ"</b> (xuất hiện) được hay không.
        </p>
        <div className="iching-grid2">
          <div className="iching-tcard gd">
            <h4 style={{ fontSize: "1.1rem" }}>
              <span className="han">有用</span>Phục Thần Hữu Dụng
            </h4>
            <div className="eff" style={{ marginTop: 6 }}>
              <b style={{ color: "var(--jade)" }}>Đủ sức phá vây ra mặt:</b><br/>
              • Bản thân Phục thần vượng (được Nhật, Nguyệt sinh/lâm).<br/>
              • <b>Phi sinh Phục</b> (được bảo bọc).<br/>
              • Phi thần bị Nhật/Nguyệt/hào động xung phá, hưu tù, hoặc Không Vong (Phi yếu không đè nổi Phục).
            </div>
          </div>
          <div className="iching-tcard bd">
            <h4 style={{ fontSize: "1.1rem" }}>
              <span className="han">無用</span>Phục Thần Vô Dụng
            </h4>
            <div className="eff" style={{ marginTop: 6 }}>
              <b style={{ color: "var(--cinnabar)" }}>Bị chôn vùi vĩnh viễn:</b><br/>
              • Phục thần hưu tù suy, tuyệt, nhập mộ, bị Nhật/Nguyệt khắc.<br/>
              • <b>Phi khắc Phục</b> (bị đè nén).<br/>
              • Phục thần sinh Phi thần (tiết khí, kiệt quệ). Việc cầu vĩnh viễn bế tắc, vô hy vọng.
            </div>
          </div>
        </div>
      </section>

      {/* 3. AM DONG & NHAT PHA */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">叁</span>
          <h2>
            Ám Động &amp; Xung Tán<span className="han">暗動 · 散</span>
          </h2>
        </div>
        <p className="iching-lead">
          Đây là hai trạng thái kỳ diệu nhất do <b>Nhật thần (Ngày)</b> tạo ra khi xung vào một hào <b>Tĩnh</b>. Nó quyết định sinh sát trong tích tắc.
        </p>
        <div className="iching-card">
          <div className="iching-grid2" style={{ gap: 16 }}>
            <div>
              <h3 className="iching-mini-header" style={{ marginTop: 0, color: "var(--jade)" }}>Ám Động <span className="han">暗動</span></h3>
              <p style={{ fontSize: "0.95rem" }}>
                Khi hào tĩnh đang <b>Vượng tướng</b> (được Nguyệt lệnh sinh phù), mà bị Nhật thần đến Xung.
              </p>
              <p style={{ fontSize: "0.95rem" }}>
                <b>Tượng:</b> Người đang khỏe mạnh, bị huých một cái thì bật dậy hành động ngay. Hào Ám Động có sức mạnh sinh khắc như hào Động thật sự. Việc diễn ra ngấm ngầm, bất ngờ, "sấm sét không kịp bưng tai".
              </p>
            </div>
            <div>
              <h3 className="iching-mini-header" style={{ marginTop: 0, color: "var(--cinnabar-bright)" }}>Xung Tán (Nhật Phá) <span className="han">日破</span></h3>
              <p style={{ fontSize: "0.95rem" }}>
                Khi hào tĩnh đang <b>Hưu tù, Suy</b> (bị Nguyệt lệnh khắc), mà bị Nhật thần đến Xung.
              </p>
              <p style={{ fontSize: "0.95rem" }}>
                <b>Tượng:</b> Người đang ốm yếu kiệt quệ, bị đánh thêm một cú bồi. Hào vỡ tan tành, triệt để vô dụng. Sự việc đổ vỡ nhanh chóng không cứu vãn được.
              </p>
            </div>
          </div>
          <div className="iching-warn" style={{ marginTop: 12 }}>
            Chìa khóa phân biệt Ám Động và Xung Tán là <b>Vượng hay Suy</b> ở Nguyệt Lệnh. Nếu hào Động mà bị Nhật xung thì lại gọi là <b>Xung Khai</b> (xung cho chạy nhanh hơn, ứng kỳ nhanh hơn).
          </div>
        </div>
      </section>

      {/* 4. HOP XU PHUNG XUNG */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">肆</span>
          <h2>
            Hợp Xứ Phùng Xung<span className="han">合處逢沖</span>
          </h2>
        </div>
        <p className="iching-lead">
          Sự tinh tế của "Tam quyền phân lập" (Nhật, Nguyệt, Hào động) khi xét Lục Hợp và Lục Xung.
        </p>
        <div className="iching-card">
          <p>
            <b style={{ color: "var(--gold-soft)" }}>Hợp Xứ Phùng Xung (Đang hợp gặp xung):</b><br/>
            Quẻ Lục Hợp, hoặc Hào Dụng thần đang được hợp (thuận lợi, gắn kết). Bỗng bị Nhật, Nguyệt hoặc một hào động đến <b>Xung</b> vào Dụng thần. Tượng là: Việc đang êm ấm bỗng vỡ lở, làm ăn đang tốt bỗng đứt gánh, tình duyên đang mặn nồng bỗng chia tay.
          </p>
          <hr className="iching-rule" style={{ opacity: 0.1, margin: "16px 0" }} />
          <p>
            <b style={{ color: "var(--jade)" }}>Xung Trung Phùng Hợp (Đang xung gặp hợp):</b><br/>
            Quẻ Lục Xung, hoặc hào đang bị xung khắc tơi bời (bất lợi, tan vỡ). Bỗng được Nhật, Nguyệt hoặc một hào động mạnh đến <b>Hợp</b> lại. Tượng là: Tưởng chừng thất bại, cãi vã, chia ly, nhưng phút chót được dàn xếp êm thấm, hàn gắn lại.
          </p>
        </div>
      </section>

      {/* 5. TAM HOP CUC */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">伍</span>
          <h2>
            Tam Hợp Cục<span className="han">三合局</span>
          </h2>
        </div>
        <p className="iching-lead">
          Sức mạnh của 3 hào hợp lại thành một "Thế lực" khổng lồ. Cách tạo cục: phải có ít nhất 1 hào động và 2 chi còn lại (từ hào động khác, hào ám động, hoặc mượn Nhật/Nguyệt).
        </p>
        <div className="iching-card">
          <div className="iching-chips">
            <span className="iching-chip cuc"><span className="han">申子辰</span> Thủy cục</span>
            <span className="iching-chip cuc"><span className="han">寅午戌</span> Hỏa cục</span>
            <span className="iching-chip cuc"><span className="han">亥卯未</span> Mộc cục</span>
            <span className="iching-chip cuc"><span className="han">巳酉丑</span> Kim cục</span>
          </div>
          <p style={{ marginTop: 16 }}>
            <b>Ứng dụng:</b> Tam hợp cục có sức quy tụ. Nếu hợp thành cục <b>Sinh</b> Dụng thần, thì thành công rực rỡ, được bè phái/nhiều người xúm lại giúp sức. Nếu hợp thành cục <b>Khắc</b> Dụng thần (Kỵ thần kết cục), thì tai họa khôn lường, bị hội đồng vây đánh.
          </p>
        </div>
      </section>

      {/* 6. UNG KY */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">陸</span>
          <h2>
            Ứng Kỳ (Hẹn Ngày)<span className="han">應期</span>
          </h2>
        </div>
        <p className="iching-lead">
          Đỉnh cao bốc dịch là đoán đúng <b>khi nào</b> sự việc xảy ra.
        </p>
        <div className="iching-card">
          <ul style={{ listStyleType: "circle", paddingLeft: 20, lineHeight: 1.8 }}>
            <li><b>Hào Tĩnh:</b> Chờ ngày bị <b>Xung</b> (để động lên) hoặc ngày <b>Trực</b> (chính ngày mang địa chi đó).</li>
            <li><b>Hào Động:</b> Chờ ngày <b>Hợp</b> lại (động thì phải trói lại mới kết), hoặc ngày <b>Trực</b>.</li>
            <li><b>Không Vong:</b> Chờ ngày <b>Xuất Không</b> (qua tuần không đó) hoặc ngày <b>Điền Thực</b> (đến đúng ngày chi Không Vong).</li>
            <li><b>Nhập Mộ:</b> Chờ ngày <b>Xung Mộ</b> (để mở cửa mộ).</li>
            <li><b>Nguyệt Phá:</b> Chờ ngày <b>Xung</b> kẻ đang phá, hoặc ngày <b>Hợp</b> hào phá.</li>
            <li><b>Suy yếu:</b> Chờ ngày/tháng được <b>Sinh Phù</b> vượng lên.</li>
          </ul>
        </div>
      </section>

      <footer className="iching-footer mastery">
        <div className="han">易</div>
        Lục Hào · Tầng 3 — Đạt đến "Thần triệu cơ ở động" và thấu tỏ lẽ "Vượng Suy".
      </footer>
    </ArticleLayout>
  );
}
