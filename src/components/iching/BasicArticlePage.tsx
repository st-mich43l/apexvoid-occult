import { ArticleLayout } from "../shared/ArticleLayout";
import { NguHanhDiagram, LucThanDiagram } from "./IchingDiagrams";

export default function BasicArticlePage() {
  return (
    <ArticleLayout title="Lục Hào Căn Bản">
      <header className="iching-header">
        <div className="iching-seal han">六爻</div>
        <h1>
          Lục Hào · <em>Luận Giải Căn Bản</em>
        </h1>
        <div className="iching-sub">
          Cheat sheet tầng nền — từ gieo quẻ tới luận đoán vượng suy
        </div>
        <div className="iching-rule"></div>
      </header>

      {/* 1. GIEO QUE */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">壹</span>
          <h2>
            Cách Gieo Quẻ<span className="han">起卦</span>
          </h2>
        </div>
        <p className="iching-lead">
          Để lập một quẻ Lục Hào, phổ biến nhất là dùng <b>3 đồng xu</b> gieo 6 lần (từ dưới lên trên). Hai mặt đồng xu được quy ước: mặt có chữ/Hình là <b>Ngửa</b> (Dương), mặt trơn/Quốc huy là <b>Sấp</b> (Âm).
        </p>
        <div className="iching-card">
          <table className="iching-table">
            <thead>
              <tr>
                <th>Kết quả gieo</th>
                <th>Ký hiệu</th>
                <th>Tên gọi</th>
                <th>Tính chất</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="iching-coin sap">S</span>
                  <span className="iching-coin sap">S</span>
                  <span className="iching-coin sap">S</span> (3 Sấp)
                </td>
                <td>
                  <b style={{ fontSize: "1.2rem", letterSpacing: 2 }}>✕</b>
                </td>
                <td><span className="han">老陰</span> Lão Âm</td>
                <td><span className="iching-bad">Hào Động</span> (Âm động biến Dương)</td>
              </tr>
              <tr>
                <td>
                  <span className="iching-coin ngua">N</span>
                  <span className="iching-coin ngua">N</span>
                  <span className="iching-coin ngua">N</span> (3 Ngửa)
                </td>
                <td>
                  <b style={{ fontSize: "1.2rem", letterSpacing: 2 }}>〇</b>
                </td>
                <td><span className="han">老陽</span> Lão Dương</td>
                <td><span className="iching-bad">Hào Động</span> (Dương động biến Âm)</td>
              </tr>
              <tr>
                <td>
                  <span className="iching-coin ngua">N</span>
                  <span className="iching-coin sap">S</span>
                  <span className="iching-coin sap">S</span> (1 Ngửa 2 Sấp)
                </td>
                <td>
                  <b style={{ fontSize: "1.2rem", letterSpacing: 2 }}>—</b>
                </td>
                <td><span className="han">少陽</span> Thiếu Dương</td>
                <td>Hào Tĩnh (Dương đứng yên)</td>
              </tr>
              <tr>
                <td>
                  <span className="iching-coin sap">S</span>
                  <span className="iching-coin ngua">N</span>
                  <span className="iching-coin ngua">N</span> (1 Sấp 2 Ngửa)
                </td>
                <td>
                  <b style={{ fontSize: "1.2rem", letterSpacing: 2 }}>- -</b>
                </td>
                <td><span className="han">少陰</span> Thiếu Âm</td>
                <td>Hào Tĩnh (Âm đứng yên)</td>
              </tr>
            </tbody>
          </table>
          <p className="iching-note">
            Ghi nhớ: Cứ mặt nào <b>số ít</b> thì đó là tính chất của hào. 1 Ngửa (ít) → Dương. 1 Sấp (ít) → Âm. Riêng 3 mặt giống nhau là <b>cực</b> (quá mù ra mưa) nên nó sẽ <b>động</b> và biến thành cái ngược lại.
          </p>
        </div>
      </section>

      {/* 2. NGU HANH */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">貳</span>
          <h2>
            Ngũ Hành sinh khắc<span className="han">五行</span>
          </h2>
        </div>
        <p className="iching-lead">
          Đây là "bộ máy tính" của Lục Hào. Mọi luận đoán đều quy về hai vòng:{" "}
          <b style={{ color: "var(--jade-soft)" }}>sinh</b> (nuôi dưỡng) và{" "}
          <b style={{ color: "var(--cinnabar-bright)" }}>khắc</b> (chế ngự). Thuộc
          nằm lòng trước đã.
        </p>
        <div className="iching-card iching-nguhanh">
          <NguHanhDiagram />
          <div className="iching-legend">
            <div className="row">
              <span className="iching-dot iching-sinh" style={{ background: "var(--jade)" }}></span>
              <div>
                <h4 className="iching-sinh-t" style={{ color: "var(--jade-soft)" }}>
                  Tương Sinh — vòng nuôi
                </h4>
                <code>木→火→土→金→水→木</code>
                <small>
                  Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc.
                </small>
              </div>
            </div>
            <div className="row">
              <span className="iching-dot iching-khac" style={{ background: "var(--cinnabar)" }}></span>
              <div>
                <h4 className="iching-khac-t" style={{ color: "var(--cinnabar-bright)" }}>
                  Tương Khắc — vòng chế
                </h4>
                <code>木→土→水→火→金→木</code>
                <small>
                  Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LUC THAN */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">叁</span>
          <h2>
            Lục Thân<span className="han">六親</span>
          </h2>
        </div>
        <p className="iching-lead">
          6 "vai diễn" trong quẻ. Cách xác định: lấy <b>ngũ hành của Cung</b> làm{" "}
          <b style={{ color: "var(--gold-soft)" }}>"Ta"</b>, rồi so từng hào với Ta
          theo sinh–khắc. Học theo công thức, không học vẹt.
        </p>
        <div className="iching-card iching-nguhanh">
          <LucThanDiagram />
          <div>
            <table className="iching-table">
              <thead>
                <tr>
                  <th>Lục Thân</th>
                  <th>Quan hệ với "Ta" (Cung)</th>
                  <th>Đại diện cho điều gì</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="han">兄弟</span> Huynh Đệ
                  </td>
                  <td>Đồng hành với Ta</td>
                  <td>Anh em, bạn bè, đối thủ, cạnh tranh — hao tài</td>
                </tr>
                <tr>
                  <td>
                    <span className="han">父母</span> Phụ Mẫu
                  </td>
                  <td>
                    <b>Sinh</b> ra Ta
                  </td>
                  <td>Cha mẹ, nhà cửa, giấy tờ, văn bằng, che chở</td>
                </tr>
                <tr>
                  <td>
                    <span className="han">子孫</span> Tử Tôn
                  </td>
                  <td>
                    Ta <b>sinh</b> ra
                  </td>
                  <td>Con cháu, phúc lành, thuốc men, giải tai ách</td>
                </tr>
                <tr>
                  <td>
                    <span className="han">妻財</span> Thê Tài
                  </td>
                  <td>
                    Ta <b>khắc</b>
                  </td>
                  <td>Vợ, tiền tài, của cải, vật chất nắm được</td>
                </tr>
                <tr>
                  <td>
                    <span className="han">官鬼</span> Quan Quỷ
                  </td>
                  <td>
                    <b>Khắc</b> Ta
                  </td>
                  <td>Công danh, chồng, bệnh tật, tai họa, kẻ địch</td>
                </tr>
              </tbody>
            </table>
            <p className="iching-note">
              Mẹo nhớ "Ta" = ngũ hành của Cung quẻ: cái <i>sinh ra ta</i> là cha mẹ, cái{" "}
              <i>ta sinh</i> là con cháu, cái <i>ta khắc</i> được là tiền tài (nắm
              trong tay), cái <i>khắc ta</i> là quan/quỷ (áp chế ta), cái{" "}
              <i>cùng loại</i> là anh em.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE UNG */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">肆</span>
          <h2>
            Thế &amp; Ứng<span className="han">世應</span>
          </h2>
        </div>
        <div className="iching-card">
          <p style={{ marginBottom: 10 }}>
            <b style={{ color: "var(--cinnabar-bright)" }} className="han">
              世
            </b>{" "}
            <b>Thế</b> — là <b>mình</b>, là chủ thể đang hỏi. Là trục để mọi phân
            tích quy chiếu về.
          </p>
          <p>
            <b style={{ color: "var(--gold-soft)" }} className="han">
              應
            </b>{" "}
            <b>Ứng</b> — là <b>đối phương / việc</b> đang hỏi, hoặc môi trường ngoài.
            Thế–Ứng luôn cách nhau 3 hào.
          </p>
          <p className="iching-note">
            Quan hệ căn bản: Ứng sinh Thế → ngoại cảnh thuận; Ứng khắc Thế → có trở
            lực; Thế khắc Ứng → mình chủ động nắm được việc.
          </p>
        </div>
      </section>

      {/* 5. DUNG THAN & HE SINH THAI */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">伍</span>
          <h2>
            Dụng Thần &amp; Hệ Sinh Thái<span className="han">用神</span>
          </h2>
        </div>
        <p className="iching-lead">
          Bước <b>quan trọng nhất</b>: chọn đúng hào Lục Thân đại diện cho điều mình
          hỏi. Chọn sai Dụng Thần → luận sai từ gốc. Sau khi có Dụng Thần, phải tìm ngay "đồng minh" và "kẻ thù" của nó.
        </p>
        <div className="iching-card">
          <h3 className="iching-mini-header" style={{ marginTop: 0 }}>1. Cách chọn Dụng Thần</h3>
          <table className="iching-table">
            <thead>
              <tr>
                <th>Hỏi về…</th>
                <th>Dụng Thần</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền bạc, làm ăn, cầu tài, vợ</td>
                <td>
                  <span className="han">妻財</span> Thê Tài{" "}
                  <span className="iching-tag iching-t-self">Tài</span>
                </td>
              </tr>
              <tr>
                <td>Công danh, thi cử đỗ đạt, công việc, chồng, bệnh</td>
                <td>
                  <span className="han">官鬼</span> Quan Quỷ
                </td>
              </tr>
              <tr>
                <td>Con cái, sức khỏe, bình an, vật nuôi, giải hạn</td>
                <td>
                  <span className="han">子孫</span> Tử Tôn
                </td>
              </tr>
              <tr>
                <td>Cha mẹ, nhà đất, xe, giấy tờ, hợp đồng, học hành</td>
                <td>
                  <span className="han">父母</span> Phụ Mẫu
                </td>
              </tr>
              <tr>
                <td>Anh em, bạn bè, đồng nghiệp, hùn hạp</td>
                <td>
                  <span className="han">兄弟</span> Huynh Đệ
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="iching-mini-header" style={{ marginTop: 24 }}>2. Vệ tinh xoay quanh Dụng Thần</h3>
          <p style={{ fontSize: "0.95rem", marginBottom: 12 }}>
            Sự việc thành bại không chỉ do bản thân Dụng Thần, mà còn do các thế lực xung quanh tác động:
          </p>
          <div className="iching-grid2">
            <div className="iching-tcard gd">
              <h4>
                <span className="han">原神</span>Nguyên Thần
              </h4>
              <div className="eff" style={{ marginTop: 6 }}>
                Là hào <b>SINH cho Dụng Thần</b>. Đây là đồng minh, nguồn lực tiếp sức nuôi dưỡng sự việc. Nguyên Thần vượng động thì việc rất dễ thành.
              </div>
            </div>
            <div className="iching-tcard bd">
              <h4>
                <span className="han">忌神</span>Kỵ Thần
              </h4>
              <div className="eff" style={{ marginTop: 6 }}>
                Là hào <b>KHẮC Dụng Thần</b>. Đây là kẻ thù, yếu tố cản trở, phá hoại. Kỵ Thần động là điềm báo có hung hiểm, trắc trở xảy ra.
              </div>
            </div>
            <div className="iching-tcard bd" style={{ gridColumn: "1 / -1", borderColor: "rgba(201,162,74,.45)" }}>
              <h4>
                <span className="han">仇神</span>Cừu Thần
              </h4>
              <div className="eff" style={{ marginTop: 6 }}>
                Là hào <b>Sinh cho Kỵ Thần, Khắc Nguyên Thần</b>. Dù không trực tiếp đánh Dụng Thần, nhưng nó triệt hạ "nguồn sống" (Nguyên) và bơm sức mạnh cho "kẻ thù" (Kỵ). Rất độc ác ngầm!
              </div>
            </div>
          </div>
          <p className="iching-note">
            Quy tắc Sinh Khắc Liên Hoàn: Nếu Dụng Thần bị Kỵ Thần khắc, mà Nguyên Thần lúc đó lại ĐỘNG, thì Kỵ Thần thay vì đi khắc Dụng Thần sẽ quay sang sinh Nguyên Thần, Nguyên Thần lại sinh Dụng Thần (tham sinh quên khắc). Đó gọi là chuyển Hung thành Cát!
          </p>
        </div>
      </section>

      {/* 6. VUONG SUY */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">陸</span>
          <h2>
            Đo mạnh yếu<span className="han">旺衰</span>
          </h2>
        </div>
        <p className="iching-lead">
          Đo độ mạnh yếu của Dụng Thần dựa vào <b>Nguyệt lệnh</b> (tháng)
          và <b>Nhật thần</b> (ngày gieo). Đây là thước đo thành bại căn bản.
        </p>
        <div className="iching-card">
          <div className="iching-vsbar">
            <div className="item strong">
              <span className="han">旺</span>
              <b>Vượng</b>
              <small>Cùng hành với tháng — mạnh nhất</small>
            </div>
            <div className="item strong">
              <span className="han">相</span>
              <b>Tướng</b>
              <small>Được tháng sinh — đang lên</small>
            </div>
            <div className="item">
              <span className="han">休</span>
              <b>Hưu</b>
              <small>Sinh ra tháng — nghỉ, hơi yếu</small>
            </div>
            <div className="item weak">
              <span className="han">囚</span>
              <b>Tù</b>
              <small>Bị tháng khắc — bị giam, yếu</small>
            </div>
            <div className="item weak">
              <span className="han">死</span>
              <b>Tử</b>
              <small>Khắc tháng — kiệt, yếu nhất</small>
            </div>
          </div>
          <p className="iching-note">
            Nguyên tắc gọn: hào được <b>Nguyệt sinh / Nhật sinh</b> hoặc đồng hành thì
            vượng → việc thành; bị <b>khắc</b>, lại gặp Tù/Tử thì suy → việc khó.
          </p>
        </div>
      </section>

      {/* 7. WORKED EXAMPLE */}
      <section className="iching-section">
        <div className="iching-sec-head">
          <span className="iching-sec-num">柒</span>
          <h2>
            Ráp lại: một quẻ thật<span className="han">實例</span>
          </h2>
        </div>
        <p className="iching-lead">
          <b>Tình huống:</b> Gieo hỏi <i>"Tháng này cầu tài có lợi không?"</i> — gieo
          được quẻ <b>Càn vi Thiên</b> (乾為天), 6 hào tĩnh (không có hào động). Giả
          định: <b>tháng Dần</b> (Nguyệt lệnh = Mộc), <b>ngày Tý</b> (Nhật thần =
          Thủy).
        </p>

        <div className="iching-card iching-qua">
          <div className="iching-hexcol">
            <h4 className="han">乾為天</h4>
            <div className="iching-qname">Càn vi Thiên · Cung Càn (金)</div>

            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                壬戌<small>Tuất · Thổ</small>
              </div>
              <div className="iching-relrole">
                <span className="han">父母</span> Phụ Mẫu
                <span className="iching-badge iching-b-the">Thế</span>
              </div>
            </div>
            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                壬申<small>Thân · Kim</small>
              </div>
              <div className="iching-relrole">
                <span className="han">兄弟</span> Huynh Đệ
              </div>
            </div>
            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                壬午<small>Ngọ · Hỏa</small>
              </div>
              <div className="iching-relrole">
                <span className="han">官鬼</span> Quan Quỷ
              </div>
            </div>
            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                甲辰<small>Thìn · Thổ</small>
              </div>
              <div className="iching-relrole">
                <span className="han">父母</span> Phụ Mẫu
                <span className="iching-badge iching-b-ung">Ứng</span>
              </div>
            </div>
            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                甲寅<small>Dần · Mộc</small>
              </div>
              <div className="iching-relrole">
                <span className="han">妻財</span> Thê Tài
                <span className="iching-badge iching-b-use">Dụng</span>
              </div>
            </div>
            <div className="iching-hexrow">
              <div className="iching-yao iching-yang">
                <div className="bar"></div>
              </div>
              <div className="iching-najia">
                甲子<small>Tý · Thủy</small>
              </div>
              <div className="iching-relrole">
                <span className="han">子孫</span> Tử Tôn
              </div>
            </div>
          </div>

          <div>
            <ol className="iching-steps">
              <li>
                <b>Xác định Cung &amp; "Ta".</b> Quẻ thuộc Cung Càn → ngũ hành Cung là{" "}
                <b>Kim</b>. Vậy "Ta" = Kim, mọi Lục Thân tính theo Kim.
              </li>
              <li>
                <b>An Lục Thân.</b> Ví dụ hào 2 nạp Dần (Mộc): Kim khắc Mộc → Mộc là{" "}
                <i>cái Ta khắc</i> → <b>Thê Tài</b>. Làm tương tự cho 6 hào (xem cột
                bên trái).
              </li>
              <li>
                <b>Định Thế–Ứng.</b> Quẻ Bát Thuần (8 quẻ thuần) luôn có Thế ở hào 6,
                Ứng ở hào 3.
              </li>
              <li>
                <b>Chọn Dụng Thần.</b> Hỏi cầu tài → Dụng Thần là <b>Thê Tài</b> = hào
                2 (Dần Mộc). Nguyên Thần (Tử Tôn - sinh Tài) ở hào 1. Kỵ Thần (Huynh Đệ - khắc Tài) ở hào 5.
              </li>
              <li>
                <b>Đo mạnh yếu Dụng Thần.</b> Tháng Dần là Mộc → Dụng Thần (Mộc){" "}
                <b>lâm Nguyệt lệnh</b> → cực vượng. Ngày Tý là Thủy → Thủy sinh Mộc →{" "}
                <b>Nhật thần lại sinh</b> Dụng Thần. Tài tinh vừa vượng vừa được sinh
                phù.
              </li>
            </ol>
            <div className="iching-verdict">
              <b>Luận:</b> Thê Tài lâm Nguyệt, được Nhật sinh →{" "}
              <b>tài khí vượng tướng</b>. Ở tầng căn bản, đây là quẻ{" "}
              <b>cầu tài thuận lợi</b>, nên tiến hành — tiền tài sung túc trong tháng.
            </div>
            <p className="iching-note">
              Đây mới là tầng nền (an quẻ → chọn Dụng Thần → đo vượng suy). Các lớp
              sâu hơn — hào động sinh biến quái, Tuần Không, Lục Thú, Lục Xung — để dành cho bài sau.
            </p>
          </div>
        </div>
      </section>

      <footer className="iching-footer">
        <div className="han">易</div>
        Lục Hào · Cheat Sheet Luận Giải Căn Bản — luyện bằng số quẻ đã luận, không
        bằng số sách đã đọc.
      </footer>
    </ArticleLayout>
  );
}
