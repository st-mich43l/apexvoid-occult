export interface StarVector {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

// Minimal placeholder catalog for RC1.
// Actual production catalog would be derived from the calculation core facts.
export const RC1_STAR_CATALOG: Record<string, StarVector> = {
  // Principal Stars
  "Tử Vi": { support: 1.0, pressure: 0.0, stability: 1.0, activation: 1.0 },
  "Thiên Cơ": { support: 0.8, pressure: 0.0, stability: 0.5, activation: 0.8 },
  "Thái Dương": { support: 0.9, pressure: 0.0, stability: 0.7, activation: 1.0 },
  "Vũ Khúc": { support: 0.8, pressure: 0.0, stability: 0.9, activation: 0.9 },
  "Thiên Đồng": { support: 0.7, pressure: 0.0, stability: 0.6, activation: 0.5 },
  "Liêm Trinh": { support: 0.5, pressure: 0.5, stability: 0.2, activation: 1.0 },
  "Thiên Phủ": { support: 1.0, pressure: 0.0, stability: 1.0, activation: 0.8 },
  "Thái Âm": { support: 0.9, pressure: 0.0, stability: 0.8, activation: 0.7 },
  "Tham Lang": { support: 0.5, pressure: 0.3, stability: 0.1, activation: 1.0 },
  "Cự Môn": { support: 0.4, pressure: 0.5, stability: 0.3, activation: 0.9 },
  "Thiên Tướng": { support: 0.8, pressure: 0.0, stability: 0.8, activation: 0.7 },
  "Thiên Lương": { support: 0.9, pressure: 0.0, stability: 0.9, activation: 0.6 },
  "Thất Sát": { support: 0.2, pressure: 0.6, stability: -0.2, activation: 1.0 },
  "Phá Quân": { support: 0.1, pressure: 0.7, stability: -0.5, activation: 1.0 },
  
  // Minor Stars (Auxiliary)
  "Tả Phù": { support: 0.5, pressure: 0.0, stability: 0.5, activation: 0.5 },
  "Hữu Bật": { support: 0.5, pressure: 0.0, stability: 0.5, activation: 0.5 },
  "Thiên Khôi": { support: 0.6, pressure: 0.0, stability: 0.4, activation: 0.4 },
  "Thiên Việt": { support: 0.6, pressure: 0.0, stability: 0.4, activation: 0.4 },
  "Văn Xương": { support: 0.4, pressure: 0.0, stability: 0.2, activation: 0.4 },
  "Văn Khúc": { support: 0.4, pressure: 0.0, stability: 0.2, activation: 0.4 },
  "Lộc Tồn": { support: 0.8, pressure: 0.0, stability: 0.8, activation: 0.5 },
  "Thiên Mã": { support: 0.4, pressure: 0.0, stability: -0.2, activation: 0.8 },

  // Minor Stars (Malefic)
  "Kình Dương": { support: 0.0, pressure: 0.8, stability: -0.5, activation: 0.8 },
  "Đà La": { support: 0.0, pressure: 0.7, stability: -0.4, activation: 0.5 },
  "Hỏa Tinh": { support: 0.0, pressure: 0.8, stability: -0.6, activation: 0.9 },
  "Linh Tinh": { support: 0.0, pressure: 0.8, stability: -0.6, activation: 0.7 },
  "Địa Không": { support: 0.0, pressure: 0.9, stability: -0.8, activation: 0.8 },
  "Địa Kiếp": { support: 0.0, pressure: 0.9, stability: -0.8, activation: 0.9 },
};
