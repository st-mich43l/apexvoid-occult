# Lưu Nguyệt Nam Phái V0.2 Expert Review Workbook

## Cần thầy duyệt (Updated for Event-Driven Scorer)

1. **Annual Envelope Radius:** Dùng giá trị `30` hay giá trị khác?
2. **Role Weights (Tứ Hóa):** Hệ số tọa thủ `1.0` / xung chiếu `0.80` / tam hợp `0.65` đã chuẩn chưa?
3. **Dominant-event Secondary Factor:** Hệ số cho các hoá thứ cấp dùng `0.5` có phù hợp không?
4. **Tie-break Tứ Hóa:** Thứ tự ưu tiên Kỵ > Lộc > Quyền > Khoa khi đồng hạng cường độ?
5. **Transformation Cap:** Giới hạn tổng Tứ Hóa ở `[-35, 35]`?
6. **Ji Collision (`-50`):** Loại trùng Kỵ (collision kind) chính xác nào được phép đổi thành `-50` (same-star-natal, same-palace...)?
7. **Domain Projection Cap:** Mức độ thay đổi (delta) khi chiếu điểm tổng tháng sang từng domain cụ thể bị giới hạn tối đa bao nhiêu?
8. **Distribution Targets:** Có được dùng các targets kỹ thuật (ví dụ median range 20..40, tuyệt đối clamp < 5%) làm soft calibration gate hay không?
9. **Hai chính tinh đồng cung:** Khi tính `mainStarQualityDelta`, tổng hợp 2 sao đồng cung thế nào (lấy mạnh nhất, yếu nhất, hay trung bình)?
10. **Cát/hung bucket:** Bucket kích hoạt chỉ cần 1 sao là đủ (vd 1 Khôi đã kích +15), hay cần hội tụ (cả Khôi Việt)?
