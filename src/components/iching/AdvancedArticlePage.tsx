import { ArticleLayout } from "../shared/ArticleLayout";

export default function AdvancedArticlePage() {
  return (
    <ArticleLayout title="Lục Hào Nâng Cao" className="advanced-bg">
      <header className="iching-header advanced">
        <div className="iching-seal advanced han">變</div>
        <h1>
          Lục Hào · <em>Luận Giải Nâng Cao</em>
        </h1>
        <div className="iching-sub">
          Phần làm quẻ "sống" — biến hóa, hư thực, hợp xung
        </div>
        <div className="iching-tier tier">Tầng 2 · tiếp nối cheat sheet căn bản</div>
        <div className="iching-rule"></div>
      </header>

      {/* 1. DONG HAO & BIEN QUAI */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">壹</span>
          <h2>
            Hào động &amp; Biến quái<span className="han">動爻 · 變卦</span>
          </h2>
        </div>
        <p className="iching-lead">
          Hào tĩnh chỉ "đứng yên chịu trận". Hào <b>động</b> mới là cái sinh chuyện — nó
          vừa tác động ra ngoài, vừa tự biến thành một hào mới (biến hào), tạo ra{" "}
          <b>biến quái</b>.
        </p>
        <div className="iching-card">
          <table className="iching-table">
            <thead>
              <tr>
                <th>Khi gieo</th>
                <th>Tên</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  3 đồng <b>ngửa</b> (〇)
                </td>
                <td>
                  <span className="han">老陽</span> Lão dương
                </td>
                <td>
                  <span className="iching-bad">Động</span> → biến thành hào <b>âm</b>
                </td>
              </tr>
              <tr>
                <td>
                  3 đồng <b>sấp</b> (✕)
                </td>
                <td>
                  <span className="han">老陰</span> Lão âm
                </td>
                <td>
                  <span className="iching-bad">Động</span> → biến thành hào <b>dương</b>
                </td>
              </tr>
              <tr>
                <td>2 ngửa 1 sấp</td>
                <td>
                  <span className="han">少陰</span> Thiếu âm
                </td>
                <td>Tĩnh — đứng yên</td>
              </tr>
              <tr>
                <td>1 ngửa 2 sấp</td>
                <td>
                  <span className="han">少陽</span> Thiếu dương
                </td>
                <td>Tĩnh — đứng yên</td>
              </tr>
            </tbody>
          </table>
          <div className="iching-warn">
            <b>2 luật vàng về biến hào:</b>
            <br />
            • <b>Động hào</b> tác động (sinh/khắc) tới các hào tĩnh khác trong quẻ
            chính — đây là cách Nguyên thần / Kỵ thần động đụng tới Dụng thần.
            <br />
            • <b>Biến hào</b> thì <u>chỉ "đối thoại" riêng với động hào sinh ra nó</u>,
            không sinh/khắc hào nào khác trong quẻ. Nhưng Nhật–Nguyệt vẫn tác động
            được lên biến hào (biến hào cũng bị không vong, nguyệt phá như thường).
          </div>
        </div>
      </section>

      {/* 2. 6 KIEU HOA */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">貳</span>
          <h2>
            Động hào hóa gì?<span className="han">化象</span>
          </h2>
        </div>
        <p className="iching-lead">
          Quan hệ giữa <b>động hào</b> và <b>biến hào</b> của nó quyết định động hào
          mạnh lên hay yếu đi. Đây là tầng luận quan trọng nhất của hào động.
        </p>
        <div className="iching-grid2">
          <div className="iching-tcard gd">
            <h4>
              <span className="han">回頭生</span>Hồi đầu sinh
            </h4>
            <div className="cond">
              Biến hào <b>sinh</b> lại động hào (vd Hỏa biến Thổ thì... ngược: biến Hỏa
              sinh động Thổ).
            </div>
            <div className="eff iching-good">
              Động hào được nuôi → mạnh, bền, "thật". Tốt nếu là Dụng/Nguyên thần.
            </div>
          </div>
          <div className="iching-tcard bd">
            <h4>
              <span className="han">回頭克</span>Hồi đầu khắc
            </h4>
            <div className="cond">
              Biến hào <b>khắc</b> lại động hào.
            </div>
            <div className="eff iching-bad">
              Động hào tự chuốc hại → suy bại, hỏng việc. Rất xấu nếu là Dụng thần.
            </div>
          </div>
          <div className="iching-tcard gd">
            <h4>
              <span className="han">化進神</span>Hóa tiến thần
            </h4>
            <div className="cond">
              <b>Cùng ngũ hành</b>, địa chi <b>tiến</b>: Dần→Mão, Tỵ→Ngọ, Thân→Dậu,
              Hợi→Tý, Sửu→Thìn→Mùi→Tuất.
            </div>
            <div className="eff iching-good">
              Tiến tới, tăng trưởng — việc phát triển, càng lúc càng mạnh.
            </div>
          </div>
          <div className="iching-tcard bd">
            <h4>
              <span className="han">化退神</span>Hóa thoái thần
            </h4>
            <div className="cond">
              <b>Cùng ngũ hành</b>, địa chi <b>lui</b> (ngược chiều tiến): Mão→Dần,
              Ngọ→Tỵ, Dậu→Thân, Tý→Hợi…
            </div>
            <div className="eff iching-bad">
              Lui dần, co lại — việc rút, giảm sút, không giữ được.
            </div>
          </div>
          <div className="iching-tcard nu">
            <h4>
              <span className="han">化墓</span>Hóa mộ
            </h4>
            <div className="cond">
              Biến hào là <b>mộ khố</b> của động hào (Mộc mộ Mùi · Hỏa/Thổ mộ Tuất ·
              Kim mộ Sửu · Thủy mộ Thìn).
            </div>
            <div className="eff">
              Bị giam vào mộ → mờ tối, đình trệ, người thì u mê / khó hiện ra.
            </div>
          </div>
          <div className="iching-tcard nu">
            <h4>
              <span className="han">化空/絕</span>Hóa không · hóa tuyệt
            </h4>
            <div className="cond">
              Biến hào rơi vào <b>tuần không</b> hoặc đất <b>tuyệt</b> của nó.
            </div>
            <div className="eff">
              Hư hao, hụt hơi, mất lực — chờ thời điểm "điền/xuất" mới luận tiếp.
            </div>
          </div>
        </div>
        <p className="iching-note">
          Lưu ý: Tiến/Thoái thần <b>bắt buộc cùng một ngũ hành</b>, chỉ khác chi. Khác
          hành (vd Sửu-Thổ biến Ngọ-Hỏa) thì <b>không phải</b> tiến/thoái — phải xét
          sinh/khắc (ở ví dụ đó là hồi đầu sinh: Hỏa sinh Thổ).
        </p>
      </section>

      {/* 3. TUAN KHONG */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">叁</span>
          <h2>
            Tuần Không (Không vong)<span className="han">旬空</span>
          </h2>
        </div>
        <p className="iching-lead">
          Mỗi "tuần" 10 ngày (từ một can Giáp) đều dư ra <b>2 địa chi</b> không được
          ghép can — đó là 2 chi <b>không vong</b>. Tra theo <b>Nhật thần</b> đang nằm
          ở tuần nào.
        </p>
        <div className="iching-card">
          <table className="iching-table iching-void">
            <thead>
              <tr>
                <th>Tuần (khởi từ)</th>
                <th>2 chi Không vong</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>甲子 Giáp Tý</td>
                <td>
                  <span className="vchi">Tuất · Hợi</span>
                </td>
              </tr>
              <tr>
                <td>甲戌 Giáp Tuất</td>
                <td>
                  <span className="vchi">Thân · Dậu</span>
                </td>
              </tr>
              <tr>
                <td>甲申 Giáp Thân</td>
                <td>
                  <span className="vchi">Ngọ · Mùi</span>
                </td>
              </tr>
              <tr>
                <td>甲午 Giáp Ngọ</td>
                <td>
                  <span className="vchi">Thìn · Tỵ</span>
                </td>
              </tr>
              <tr>
                <td>甲辰 Giáp Thìn</td>
                <td>
                  <span className="vchi">Dần · Mão</span>
                </td>
              </tr>
              <tr>
                <td>甲寅 Giáp Dần</td>
                <td>
                  <span className="vchi">Tý · Sửu</span>
                </td>
              </tr>
            </tbody>
          </table>
          <h3 className="iching-mini-header">Luận không vong cho đúng</h3>
          <p style={{ fontSize: "0.95rem" }}>
            <b>Chân không</b> (thật rỗng, vô dụng): hào <b>tĩnh + hưu tù suy</b> mà
            gặp không → coi như không có, việc bất thành.
            <br />
            <b>Giả không</b> (sẽ "đầy" lại): hào <b>vượng tướng</b>, hoặc <b>động</b>,
            hoặc <b>được Nhật–Nguyệt sinh</b> → chỉ tạm vắng, sẽ{" "}
            <b>xuất không / điền thực</b> vào ngày trùng chi đó hoặc ngày xung nó →
            khi ấy việc mới ứng.
          </p>
          <p className="iching-note">
            Mẹo: "Vượng không thì không phải không, động không thì không phải không."
            Chỉ hào suy mà tĩnh gặp không mới là rỗng thật.
          </p>
        </div>
      </section>

      {/* 4. PHUC THAN */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">肆</span>
          <h2>
            Phục thần &amp; Phi thần<span className="han">伏神 · 飛神</span>
          </h2>
        </div>
        <p className="iching-lead">
          Khi <b>Dụng thần không xuất hiện</b> trong 6 hào của quẻ chính (vd hỏi tài
          mà không có hào Thê Tài), phải tìm nó <b>ẩn</b> bên dưới — gọi là Phục
          thần.
        </p>
        <div className="iching-card">
          <p style={{ fontSize: "0.95rem", marginBottom: 6 }}>
            <b style={{ color: "var(--gold-soft)" }}>Tìm ở đâu:</b> lấy{" "}
            <b>quẻ Bát Thuần (quẻ thủ)</b> của cùng Cung, đối chiếu từng vị trí hào.
            Hào Lục Thân còn thiếu nằm trong quẻ thủ chính là{" "}
            <b className="iching-hl-han">Phục thần</b> (ẩn); hào đang hiện đè lên nó
            trong quẻ hiện tại là <b className="iching-hl-han">Phi thần</b> (nổi).
          </p>
          <div className="iching-grid2" style={{ marginTop: 14 }}>
            <div className="iching-tcard gd">
              <h4 style={{ fontSize: "1.1rem" }}>Phục thần XUẤT được (hữu dụng)</h4>
              <div className="eff iching-good" style={{ marginTop: 6 }}>
                • Phi thần <b>sinh</b> Phục thần
                <br />
                • Phục thần được <b>Nhật/Nguyệt sinh phù</b>, vượng tướng
                <br />
                • Phi thần <b>không vong / hưu tù</b> (không đè nổi)
                <br />
                • Phục thần <b>được Nhật/Nguyệt</b> hoặc chính nó <b>vượng</b> → có
                thể "thấu xuất"
              </div>
            </div>
            <div className="iching-tcard bd">
              <h4 style={{ fontSize: "1.1rem" }}>Phục thần BỊ chôn (vô dụng)</h4>
              <div className="eff iching-bad" style={{ marginTop: 6 }}>
                • Phi thần <b>khắc</b> Phục thần
                <br />
                • Phục thần <b>hưu tù vô khí</b>, lại bị Nhật–Nguyệt khắc
                <br />
                • Phục thần nhập <b>mộ</b> / gặp <b>không vong</b>
                <br />→ việc cầu khó hiện, đối tượng "ẩn mặt", chưa tới.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NHAT NGUYET */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">伍</span>
          <h2>
            Quyền lực Nhật &amp; Nguyệt<span className="han">日月</span>
          </h2>
        </div>
        <p className="iching-lead">
          Nguyệt lệnh và Nhật thần là hai "quan tòa" của quẻ. Hào trong quẻ mạnh yếu,
          phá hay động ngầm — đều do hai ông này định.
        </p>
        <div className="iching-card">
          <table className="iching-table">
            <thead>
              <tr>
                <th>Hiện tượng</th>
                <th>Điều kiện</th>
                <th>Ý nghĩa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="han">月破</span> Nguyệt phá
                </td>
                <td>
                  Hào bị <b>Nguyệt lệnh xung</b> (vd tháng Tý → Ngọ phá)
                </td>
                <td>
                  Hào "vỡ". Tĩnh + suy + phá ={" "}
                  <span className="iching-bad">phá thật, bỏ</span>. Vượng/động + phá =
                  chờ <b>xuất phá</b> ngày hợp/điền.
                </td>
              </tr>
              <tr>
                <td>
                  <span className="han">暗動</span> Ám động
                </td>
                <td>
                  Hào <b>tĩnh + vượng tướng</b>, bị <b>Nhật thần xung</b>
                </td>
                <td>
                  <span className="iching-good">Ngầm động</span> — tác động được lên
                  hào khác như hào động, nhưng kín đáo, "việc tới mà chưa lộ".
                </td>
              </tr>
              <tr>
                <td>
                  <span className="han">日破/沖散</span> Xung tán
                </td>
                <td>
                  Hào <b>tĩnh + hưu tù suy</b>, bị Nhật xung
                </td>
                <td>
                  <span className="iching-bad">Tan rã</span> — hào yếu bị đánh bay,
                  càng vô lực.
                </td>
              </tr>
              <tr>
                <td>
                  <span className="han">合住</span> Hợp trụ
                </td>
                <td>
                  Hào bị Nhật/Nguyệt hoặc hào động <b>hợp</b> giữ
                </td>
                <td>
                  Bị "níu chân", tạm bất động — chờ ngày <b>xung khai</b> mới chạy
                  được.
                </td>
              </tr>
            </tbody>
          </table>
          <p className="iching-note">
            Nhật thần là "đại chủ tể": sinh – khắc – xung – hợp được mọi hào, kể cả
            hào tĩnh và biến hào. Khi luận, luôn hỏi Nhật–Nguyệt đang đứng về phe nào
            trước.
          </p>
        </div>
      </section>

      {/* 6. HOP XUNG */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">陸</span>
          <h2>
            Hợp · Xung · Hội cục<span className="han">合 · 沖 · 局</span>
          </h2>
        </div>
        <div className="iching-card">
          <h3 className="iching-mini-header">
            Lục Hợp <span className="han" style={{ fontSize: "0.8em", color: "var(--jade)" }}>六合</span> —
            hòa, thành, kết dính
          </h3>
          <div className="iching-chips">
            <span className="iching-chip hop">
              <span className="han">子丑</span> <b>Tý–Sửu</b>
            </span>
            <span className="iching-chip hop">
              <span className="han">寅亥</span> <b>Dần–Hợi</b>
            </span>
            <span className="iching-chip hop">
              <span className="han">卯戌</span> <b>Mão–Tuất</b>
            </span>
            <span className="iching-chip hop">
              <span className="han">辰酉</span> <b>Thìn–Dậu</b>
            </span>
            <span className="iching-chip hop">
              <span className="han">巳申</span> <b>Tỵ–Thân</b>
            </span>
            <span className="iching-chip hop">
              <span className="han">午未</span> <b>Ngọ–Mùi</b>
            </span>
          </div>

          <h3 className="iching-mini-header">
            Lục Xung <span className="han" style={{ fontSize: "0.8em", color: "var(--cinnabar-bright)" }}>六沖</span> —
            tan, động, phản phúc
          </h3>
          <div className="iching-chips">
            <span className="iching-chip xung">
              <span className="han">子午</span> <b>Tý–Ngọ</b>
            </span>
            <span className="iching-chip xung">
              <span className="han">丑未</span> <b>Sửu–Mùi</b>
            </span>
            <span className="iching-chip xung">
              <span className="han">寅申</span> <b>Dần–Thân</b>
            </span>
            <span className="iching-chip xung">
              <span className="han">卯酉</span> <b>Mão–Dậu</b>
            </span>
            <span className="iching-chip xung">
              <span className="han">辰戌</span> <b>Thìn–Tuất</b>
            </span>
            <span className="iching-chip xung">
              <span className="han">巳亥</span> <b>Tỵ–Hợi</b>
            </span>
          </div>

          <h3 className="iching-mini-header">
            Tam Hợp Cục <span className="han" style={{ fontSize: "0.8em", color: "var(--gold-soft)" }}>三合局</span> — 3 chi
            hợp thành một hành lớn
          </h3>
          <div className="iching-chips">
            <span className="iching-chip cuc">
              <span className="han">申子辰</span> <b>→ Thủy cục</b>
            </span>
            <span className="iching-chip cuc">
              <span className="han">寅午戌</span> <b>→ Hỏa cục</b>
            </span>
            <span className="iching-chip cuc">
              <span className="han">亥卯未</span> <b>→ Mộc cục</b>
            </span>
            <span className="iching-chip cuc">
              <span className="han">巳酉丑</span> <b>→ Kim cục</b>
            </span>
          </div>

          <div
            className="iching-warn"
            style={{ borderLeftColor: "var(--gold)", background: "rgba(201,162,74,.07)" }}
          >
            <b style={{ color: "var(--gold-soft)" }}>Đọc cả quẻ:</b> quẻ thành{" "}
            <b>Lục Hợp</b> → việc thuận, hòa hợp, dễ thành, dây dưa khó dứt. Quẻ
            thành <b>Lục Xung</b> → tan vỡ, biến động, khó giữ. Tinh tế:{" "}
            <b>hợp xứ phùng xung</b> (đang êm gặp xung → vỡ) và{" "}
            <b>xung trung phùng hợp</b> (đang loạn gặp hợp → cứu lại).
          </div>
        </div>
      </section>

      {/* 7. CO BAO XAU */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">柒</span>
          <h2>
            Cờ báo nặng đô<span className="han">凶象</span>
          </h2>
        </div>
        <p className="iching-lead">
          Vài "tượng" nâng cao, gặp là phải dè chừng — thường báo việc trắc trở, lặp
          đi lặp lại hoặc đảo lộn.
        </p>
        <div className="iching-grid2">
          <div className="iching-tcard nu">
            <h4 style={{ fontSize: "1.15rem" }}>
              <span className="han">入墓</span>Nhập mộ
            </h4>
            <div className="eff" style={{ marginTop: 6 }}>
              Dụng thần vào đất mộ (theo ngày, do động, hoặc hóa mộ) → bị{" "}
              <b>giam, mờ tối</b>; người thì u mê/bệnh/lẩn tránh, việc thì kẹt. Chờ
              ngày <b>xung mộ</b> mới mở.
            </div>
          </div>
          <div className="iching-tcard bd">
            <h4 style={{ fontSize: "1.15rem" }}>
              <span className="han">伏吟</span>Phục ngâm
            </h4>
            <div className="eff iching-bad" style={{ marginTop: 6 }}>
              Động hào biến ra <b>y hệt chính nó</b> (hoặc nội/ngoại quái lặp) →{" "}
              <b>rên rỉ, trì trệ</b>, ôm sầu, dậm chân tại chỗ không thoát.
            </div>
          </div>
          <div className="iching-tcard bd">
            <h4 style={{ fontSize: "1.15rem" }}>
              <span className="han">反吟</span>Phản ngâm
            </h4>
            <div className="eff iching-bad" style={{ marginTop: 6 }}>
              Biến hào <b>xung</b> động hào (hoặc quái phản) →{" "}
              <b>đảo lộn, phản phúc</b>, làm rồi hỏng, hối tiếc, thay đổi liên tục.
            </div>
          </div>
          <div className="iching-tcard nu">
            <h4 style={{ fontSize: "1.15rem" }}>
              <span className="han">獨發</span>Độc phát
            </h4>
            <div className="eff" style={{ marginTop: 6 }}>
              Cả quẻ chỉ <b>một hào động</b> → "độc phát chi hào" là tiêu điểm, manh
              mối chính của sự việc nằm ở đó — soi kỹ nó trước.
            </div>
          </div>
        </div>
      </section>

      <footer className="iching-footer advanced">
        <div className="han">易</div>
        Lục Hào · Tầng 2 — luật là khung, quẻ thật mới dạy nghề. Gieo nhiều, ghi lại, đối chiếu.
      </footer>
    </ArticleLayout>
  );
}
