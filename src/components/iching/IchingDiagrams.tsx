export function NguHanhDiagram() {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Vòng Ngũ Hành sinh khắc">
      <defs>
        <marker id="ag" markerWidth="9" markerHeight="9" refX="20.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5f9e7e" />
        </marker>
        <marker id="ar" markerWidth="9" markerHeight="9" refX="27.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#c0392b" />
        </marker>
      </defs>
      {/* KHAC (star, red) */}
      <g stroke="#c0392b" strokeWidth="1.6" opacity="0.78" markerEnd="url(#ar)" fill="none">
        <line x1="200" y1="50" x2="288" y2="321" />
        <line x1="288" y1="321" x2="57" y2="154" />
        <line x1="57" y1="154" x2="343" y2="154" />
        <line x1="343" y1="154" x2="112" y2="321" />
        <line x1="112" y1="321" x2="200" y2="50" />
      </g>
      {/* SINH (pentagon, green) */}
      <g stroke="#5f9e7e" strokeWidth="2.4" opacity="0.92" markerEnd="url(#ag)" fill="none">
        <path d="M200,50 Q300,70 343,154" />
        <path d="M343,154 Q350,250 288,321" />
        <path d="M288,321 Q200,370 112,321" />
        <path d="M112,321 Q50,250 57,154" />
        <path d="M57,154 Q100,70 200,50" />
      </g>
      {/* NODES */}
      <g fontFamily="'Noto Serif TC','Noto Serif SC',serif" textAnchor="middle">
        <g>
          <circle cx="200" cy="50" r="34" fill="#1f1813" stroke="#5f9e7e" strokeWidth="2" />
          <text x="200" y="48" fontSize="26" fill="#84c2a2" fontWeight="700">木</text>
          <text x="200" y="66" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Mộc</text>
        </g>
        <g>
          <circle cx="343" cy="154" r="34" fill="#1f1813" stroke="#c0392b" strokeWidth="2" />
          <text x="343" y="152" fontSize="26" fill="#d9543f" fontWeight="700">火</text>
          <text x="343" y="170" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Hỏa</text>
        </g>
        <g>
          <circle cx="288" cy="321" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="288" y="319" fontSize="26" fill="#e0c178" fontWeight="700">土</text>
          <text x="288" y="337" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Thổ</text>
        </g>
        <g>
          <circle cx="112" cy="321" r="34" fill="#1f1813" stroke="#dcd2bb" strokeWidth="2" />
          <text x="112" y="319" fontSize="26" fill="#ece0c8" fontWeight="700">金</text>
          <text x="112" y="337" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Kim</text>
        </g>
        <g>
          <circle cx="57" cy="154" r="34" fill="#1f1813" stroke="#6f9bc0" strokeWidth="2" />
          <text x="57" y="152" fontSize="26" fill="#a8c6e0" fontWeight="700">水</text>
          <text x="57" y="170" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Thủy</text>
        </g>
      </g>
    </svg>
  );
}

export function LucThanDiagram() {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Vòng Lục Thân sinh khắc">
      <defs>
        <marker id="ag-lt" markerWidth="9" markerHeight="9" refX="20.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5f9e7e" />
        </marker>
        <marker id="ar-lt" markerWidth="9" markerHeight="9" refX="27.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#c0392b" />
        </marker>
      </defs>
      {/* KHAC (star, red) */}
      <g stroke="#c0392b" strokeWidth="1.6" opacity="0.78" markerEnd="url(#ar-lt)" fill="none">
        <line x1="200" y1="50" x2="288" y2="321" />
        <line x1="288" y1="321" x2="57" y2="154" />
        <line x1="57" y1="154" x2="343" y2="154" />
        <line x1="343" y1="154" x2="112" y2="321" />
        <line x1="112" y1="321" x2="200" y2="50" />
      </g>
      {/* SINH (pentagon, green) */}
      <g stroke="#5f9e7e" strokeWidth="2.4" opacity="0.92" markerEnd="url(#ag-lt)" fill="none">
        <path d="M200,50 Q300,70 343,154" />
        <path d="M343,154 Q350,250 288,321" />
        <path d="M288,321 Q200,370 112,321" />
        <path d="M112,321 Q50,250 57,154" />
        <path d="M57,154 Q100,70 200,50" />
      </g>
      {/* NODES */}
      <g fontFamily="'Noto Serif TC','Noto Serif SC',serif" textAnchor="middle">
        <g>
          <circle cx="200" cy="50" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="200" y="46" fontSize="20" fill="#e0c178" fontWeight="700">兄弟</text>
          <text x="200" y="66" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Huynh Đệ</text>
        </g>
        <g>
          <circle cx="343" cy="154" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="343" y="150" fontSize="20" fill="#e0c178" fontWeight="700">子孫</text>
          <text x="343" y="170" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Tử Tôn</text>
        </g>
        <g>
          <circle cx="288" cy="321" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="288" y="317" fontSize="20" fill="#e0c178" fontWeight="700">妻財</text>
          <text x="288" y="337" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Thê Tài</text>
        </g>
        <g>
          <circle cx="112" cy="321" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="112" y="317" fontSize="20" fill="#e0c178" fontWeight="700">官鬼</text>
          <text x="112" y="337" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Quan Quỷ</text>
        </g>
        <g>
          <circle cx="57" cy="154" r="34" fill="#1f1813" stroke="#c9a24a" strokeWidth="2" />
          <text x="57" y="150" fontSize="20" fill="#e0c178" fontWeight="700">父母</text>
          <text x="57" y="170" fontSize="11" fill="#b9ab8e" fontFamily="'Noto Serif','Times New Roman',serif">Phụ Mẫu</text>
        </g>
      </g>
    </svg>
  );
}
