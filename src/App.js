import React, { useState, useMemo, useRef } from "react";
import "./TreeChart.css";
import Tree from "react-d3-tree";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import treeData from "./treeData.json";

const renderCustomNode = ({ nodeDatum }) => {
  const doi = parseInt(nodeDatum.attributes?.đời);
  const colorByDoi = [
    "#fde68a",
    "#fcd34d",
    "#fbbf24",
    "#f59e0b",
    "#d97706",
    "#bef264",
    "#86efac",
    "#5eead4",
    "#93c5fd",
    "#c4b5fd",
    "#f9a8d4",
    "#fca5a5",
    "#f87171",
    "#facc15",
    "#34d399",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
    "#fb923c",
    "#4ade80",
  ];
  const fillColor = colorByDoi[(doi - 1) % colorByDoi.length] || "#fef3c7";

  return (
    <g transform="translate(0, -20)">
      <rect
        width="200"
        height="220"
        x="-100"
        y="-95"
        fill={fillColor}
        stroke="#444"
        strokeWidth="2"
        rx="10"
      />

      {nodeDatum.attributes?.đời && (
        <text
          fill="#1f2937"
          x="0"
          y="-70"
          textAnchor="middle"
          fontSize="15"
          letterSpacing="0.5px"
        >
          Đời Thứ {nodeDatum.attributes.đời}
        </text>
      )}

      {(nodeDatum.attributes?.vai_tro || nodeDatum.attributes?.chuc_vu) && (
        <>
          {nodeDatum.attributes?.vai_tro && (
            <text
              fill="#111827"
              x="0"
              y="-50"
              textAnchor="middle"
              fontSize="15"
              letterSpacing="0.4px"
              fontStyle="italic"
            >
              {nodeDatum.attributes.vai_tro}
            </text>
          )}
        </>
      )}

      <text
        fill="#000000"
        x="0"
        y="-30"
        textAnchor="middle"
        fontSize="20"
        letterSpacing="0.5px"
      >
        {nodeDatum.name}
      </text>
      {nodeDatum.attributes?.ten_that && (
        <text
          fill="#6b7280"
          x="0"
          y="-10"
          textAnchor="middle"
          fontSize="16"
          letterSpacing="0.3px"
        >
          {nodeDatum.attributes.ten_that}
        </text>
      )}
      {nodeDatum.attributes?.chuc_vu && (
        <text
          fill="#1e3a8a"
          x="0"
          y="-10"
          textAnchor="middle"
          fontSize="14"
          letterSpacing="0.4px"
        >
          {nodeDatum.attributes.chuc_vu}
        </text>
      )}
      {nodeDatum.attributes?.nam_sinh && (
        <text
          fill="#374151"
          x="0"
          y="10"
          textAnchor="middle"
          fontSize="14"
          letterSpacing="0.3px"
        >
          Sinh: {nodeDatum.attributes.nam_sinh}{" "}
          {nodeDatum.attributes?.nam_mat
            ? `- Mất: ${nodeDatum.attributes.nam_mat}`
            : ""}
        </text>
      )}
      {nodeDatum.attributes?.ngay_ky && (
        <text
          fill="#6b7280"
          x="0"
          y="30"
          textAnchor="middle"
          fontSize="14"
          letterSpacing="0.3px"
        >
          Ngày kỵ: {nodeDatum.attributes.ngay_ky}
        </text>
      )}
      {nodeDatum.attributes?.vai_tro_1 && (
        <text
          fill="#111827"
          x="0"
          y="50"
          textAnchor="middle"
          fontSize="15"
          letterSpacing="0.4px"
          fontStyle="italic"
        >
          {nodeDatum.attributes.vai_tro_1}
        </text>
      )}
      {nodeDatum.attributes?.hon_the && (
        <text
          fill="#6b7280"
          x="0"
          y="70"
          textAnchor="middle"
          fontSize="16"
          letterSpacing="0.3px"
        >
          {nodeDatum.attributes.hon_the}
        </text>
      )}
      {nodeDatum.attributes?.hon_the_1 && (
        <text
          fill="#6b7280"
          x="0"
          y="90"
          textAnchor="middle"
          fontSize="16"
          letterSpacing="0.3px"
        >
          {nodeDatum.attributes.hon_the_1}
        </text>
      )}
      {nodeDatum.attributes?.nam_sinh_1 && (
        <text
          fill="#374151"
          x="0"
          y="90"
          textAnchor="middle"
          fontSize="14"
          letterSpacing="0.3px"
        >
          Sinh: {nodeDatum.attributes.nam_sinh_1}{" "}
          {nodeDatum.attributes?.nam_mat_1
            ? `- Mất: ${nodeDatum.attributes.nam_mat_1}`
            : ""}
        </text>
      )}
      {nodeDatum.attributes?.ngay_ky_1 && (
        <text
          fill="#6b7280"
          x="0"
          y="110"
          textAnchor="middle"
          fontSize="14"
          letterSpacing="0.3px"
        >
          Ngày kỵ: {nodeDatum.attributes.ngay_ky_1}
        </text>
      )}
      {nodeDatum.attributes?.hon_tu && (
        <text
          fill="#6b7280"
          x="0"
          y="70"
          textAnchor="middle"
          fontSize="16"
          letterSpacing="0.3px"
        >
          {nodeDatum.attributes.hon_tu}
        </text>
      )}
    </g>
  );
};

const filterTree = (tree, filterFn) => {
  const match = filterFn(tree);
  const children =
    tree.children
      ?.map((child) => filterTree(child, filterFn))
      .filter(Boolean) || [];
  if (match || children.length > 0) {
    return { ...tree, children };
  }
  return null;
};

const PAPER_SIZES = [
  { label: "A0 (rất lớn)", value: "a0" },
  { label: "A1 (lớn)", value: "a1" },
  { label: "A2", value: "a2" },
  { label: "A3", value: "a3" },
  { label: "A4 (chuẩn)", value: "a4" },
];

const downloadPDF = async (ref, paperSize = "a0", filteredTreeData = null) => {
  // Lưu lại kích thước cũ
  const oldWidth = ref.current.style.width;
  const oldHeight = ref.current.style.height;

  // Đặt kích thước lớn tạm thời để toàn bộ cây hiện ra (ví dụ 4000x3000px)
  ref.current.style.width = "4000px";
  ref.current.style.height = "4000px";

  // Đợi cây vẽ lại (nếu cần)
  await new Promise((resolve) => setTimeout(resolve, 500));

  html2canvas(ref.current, { useCORS: true }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", paperSize);
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("so-do-pha-he-trinh-ba.pdf");

    // Khôi phục lại kích thước cũ
    ref.current.style.width = oldWidth;
    ref.current.style.height = oldHeight;
  });
};

const downloadImage = async (ref, filteredTreeData = null) => {
  // Lưu lại kích thước cũ
  const oldWidth = ref.current.style.width;
  const oldHeight = ref.current.style.height;

  // Đặt kích thước lớn tạm thời để toàn bộ cây hiện ra
  ref.current.style.width = "3000px";
  ref.current.style.height = "4000px";

  await new Promise((resolve) => setTimeout(resolve, 500));

  html2canvas(ref.current, { useCORS: true }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "so-do-pha-he-trinh-ba.png";
    link.click();

    // Khôi phục lại kích thước cũ
    ref.current.style.width = oldWidth;
    ref.current.style.height = oldHeight;
  });
};

export default function SoDoPhaHeTrinhBaToc() {
  const treeContainer = useRef(null);
  const [paperSize, setPaperSize] = useState("a0");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [infoExpanded, setInfoExpanded] = useState(true); // Thêm state cho expand/collapse

  // Hàm lọc nhánh theo tên hoặc thuộc tính
  const filterFn = (node) => {
    if (!search.trim()) return true;
    const lower = search.trim().toLowerCase();
    if (node.name?.toLowerCase().includes(lower)) return true;
    if (
      node.attributes &&
      Object.values(node.attributes).join(" ").toLowerCase().includes(lower)
    )
      return true;
    return false;
  };

  // Dữ liệu đã lọc theo nhánh
  const filteredData = useMemo(() => {
    if (!search.trim()) return treeData;
    const filtered = filterTree(treeData, filterFn);
    return filtered ? filtered : { name: "Không tìm thấy nhánh phù hợp" };
  }, [search]);

  // Thông tin về gia phả (có thể chỉnh sửa nội dung này tuỳ ý)
  const info = (
    <div
      style={{
        background: "#fffbe9",
        border: "1px solid #fcd34d",
        borderRadius: 8,
        padding: infoExpanded ? "16px 20px" : "6px 20px",
        marginBottom: 20,
        color: "#92400e",
        fontSize: 16,
        maxWidth: 900,
        marginLeft: "auto",
        marginRight: "auto",
        boxShadow: "0 2px 8px #fbbf2433",
        transition: "padding 0.2s",
        position: "relative",
        minHeight: 0,
      }}
    >
      <button
        onClick={() => setInfoExpanded((v) => !v)}
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          background: "#f59e0b",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "2px 10px",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
          zIndex: 2,
        }}
        aria-label={infoExpanded ? "Thu gọn ghi chú" : "Mở rộng ghi chú"}
        title={infoExpanded ? "Thu gọn ghi chú" : "Mở rộng ghi chú"}
      >
        {infoExpanded ? "Ẩn ghi chú ▲" : "Hiện ghi chú ▼"}
      </button>
      {infoExpanded && (
        <>
          <b>Thông tin gia phả Trịnh Bá Tộc:</b>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <b>
                Làng Thượng Phúc, xã Xuân Thượng, huyện Xuân Trường, tỉnh Nam
                Định.
              </b>
            </li>
            <li style={{ marginBottom: 10 }}>
              <b>TẠO LẬP:</b> HẬU DUỆ VIỄN TÔN - TRỊNH BÁ CHÍ TRUNG ĐỜI THỨ 18.
            </li>
            <li style={{ marginBottom: 10 }}>
              <b>TUẾ THỨ:</b> ẤT TỴ NIÊN - SƠ TỨ NGUYỆT - NHỊ THẬP NGŨ NHẬT -
              2025.
            </li>
            <li style={{ marginBottom: 10 }}>
              <b>
                "CON NGƯỜI SINH TRƯỞNG BỞI ĐÂU,GỐC LÀ TIÊN TỔ-ƠN SÂU RÕ RÀNG…"
              </b>
            </li>
            <li style={{ marginBottom: 10 }}>
              <b>Ý nghĩa:</b> Sơ đồ giúp con cháu hiểu về nguồn cội, kết nối các
              thế hệ, lưu giữ truyền thống gia đình.
            </li>
          </ul>
        </>
      )}
    </div>
  );

  return (
    <div className="tree-wrapper">
      <h1 className="tree-title">Phả hệ Trịnh Bá Tộc-Chi 2</h1>
      {info}
      <div style={{ marginBottom: 16 }}>
        {/* Thêm input tìm kiếm nhánh */}
        <input
          type="text"
          placeholder="Tìm nhánh theo tên, vai trò, năm sinh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            marginRight: 16,
            border: "1px solid #ccc",
            minWidth: 220,
          }}
        />
        <label style={{ marginRight: 8, fontWeight: 500 }}>
          Chọn khổ giấy:
        </label>
        <select
          value={paperSize}
          onChange={(e) => setPaperSize(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 4, marginRight: 16 }}
        >
          {PAPER_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <button
          style={{
            padding: "8px 20px",
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            marginRight: 8,
          }}
          onClick={() => downloadPDF(treeContainer, paperSize)}
        >
          Xuất PDF
        </button>
        <button
          style={{
            padding: "8px 20px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => downloadImage(treeContainer)}
        >
          Xuất ảnh PNG
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            margin: "0 8px",
          }}
          onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
        >
          Phóng to +
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            marginRight: 16,
          }}
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.2))}
        >
          Thu nhỏ -
        </button>
      </div>
      <div
        ref={treeContainer}
        className="tree-canvas"
        style={{
          width: "100%",
          height: "80vh",
          overflow: "auto",
          border: "1px solid #e5e7eb",
          background: "#fffbe9",
        }}
      >
        <Tree
          data={filteredData}
          orientation="vertical"
          translate={{ x: window.innerWidth / 2, y: 100 }}
          zoom={zoom}
          zoomable={true}
          shouldCollapseNeighborNodes={false}
          separation={{ siblings: 4, nonSiblings: 5 }}
          nodeSize={{ x: 60, y: 280 }}
          renderCustomNodeElement={renderCustomNode}
        />
      </div>
    </div>
  );
}

// Dữ liệu treeData được định nghĩa bên ngoài để dễ bảo trì
