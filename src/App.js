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

  const lines = [];

  if (nodeDatum.attributes?.đời) {
    lines.push({
      text: `Đời Thứ ${nodeDatum.attributes.đời}`,
      style: { fill: "#1f2937", fontSize: 15 },
    });
  }
  if (nodeDatum.attributes?.vai_tro) {
    lines.push({
      text: nodeDatum.attributes.vai_tro,
      style: { fill: "#111827", fontSize: 15, fontStyle: "italic" },
    });
  }
  lines.push({
    text: nodeDatum.name.toUpperCase(),
    style: { fill: "#000", fontSize: 16 },
  });

  if (nodeDatum.attributes?.ten_that) {
    lines.push({
      text: nodeDatum.attributes.ten_that,
      style: { fill: "#6b7280", fontSize: 16 },
    });
  }
  if (nodeDatum.attributes?.chuc_vu) {
    // Tách chuỗi theo dấu "-"
    const roles = nodeDatum.attributes.chuc_vu.split("-").map((s) => s.trim());
    console.log("roles: " + roles);
    roles.forEach((role) => {
      lines.push({
        text: role,
        style: { fill: "#1e3a8a", fontSize: 14 },
      });
    });
  }
  if (nodeDatum.attributes?.nam_sinh) {
    const text =
      `Sinh: ${nodeDatum.attributes.nam_sinh}` +
      (nodeDatum.attributes?.nam_mat
        ? ` - Mất: ${nodeDatum.attributes.nam_mat}`
        : "");
    lines.push({ text, style: { fill: "#374151", fontSize: 14 } });
  }
  if (nodeDatum.attributes?.ngay_ky) {
    lines.push({
      text: `Ngày kỵ: ${nodeDatum.attributes.ngay_ky}`,
      style: { fill: "#6b7280", fontSize: 14 },
    });
  }
  if (nodeDatum.attributes?.vai_tro_1) {
    lines.push({
      text: nodeDatum.attributes.vai_tro_1,
      style: { fill: "#111827", fontSize: 15, fontStyle: "italic" },
    });
  }
  if (nodeDatum.attributes?.hon_phoi) {
    lines.push({
      text: nodeDatum.attributes.hon_phoi.toUpperCase(),
      style: { fill: "#6b7280", fontSize: 14 },
    });
  }
  if (nodeDatum.attributes?.hon_phoi_1) {
    lines.push({
      text: nodeDatum.attributes.hon_phoi_1.toUpperCase(),
      style: { fill: "#6b7280", fontSize: 14 },
    });
  }
  if (nodeDatum.attributes?.nam_sinh_1) {
    const text =
      `Sinh: ${nodeDatum.attributes.nam_sinh_1}` +
      (nodeDatum.attributes?.nam_mat_1
        ? ` - Mất: ${nodeDatum.attributes.nam_mat_1}`
        : "");
    lines.push({ text, style: { fill: "#374151", fontSize: 14 } });
  }
  if (nodeDatum.attributes?.ngay_ky_1) {
    lines.push({
      text: `Ngày kỵ: ${nodeDatum.attributes.ngay_ky_1}`,
      style: { fill: "#6b7280", fontSize: 14 },
    });
  }

  const totalHeight = lines.length * 21 + 30;

  return (
    <g transform={`translate(0, -${totalHeight / 2})`}>
      <rect
        width="220"
        height={totalHeight}
        x="-110"
        y={-totalHeight / 2}
        fill={fillColor}
        stroke="#444"
        strokeWidth="2"
        rx="10"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x="0"
          y={-totalHeight / 2 + 20 + i * 22}
          textAnchor="middle"
          dominantBaseline="central"
          alignmentBaseline="central"
          fill={line.style.fill}
          fontSize={line.style.fontSize}
          fontStyle={line.style.fontStyle || "normal"}
          letterSpacing="0.3px"
        >
          {line.text}
        </text>
      ))}
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

const generatePDFCanvas = async (ref, scale = 2, setZoom) => {
  const oldWidth = ref.current.style.width;
  const oldHeight = ref.current.style.height;

  const svg = ref.current.querySelector("svg");
  if (!svg) return null;

  const bbox = svg.getBBox();
  const svgWidth = bbox.x + bbox.width + 40;
  const svgHeight = bbox.y + bbox.height + 40;

  ref.current.style.width = `${svgWidth}px`;
  ref.current.style.height = `${svgHeight}px`;
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);

  await new Promise((resolve) => setTimeout(resolve, 500));

  await document.fonts.ready; // Đảm bảo font đã load
  const canvas = await html2canvas(ref.current, { useCORS: true, scale });

  // Khôi phục lại kích thước cũ
  ref.current.style.width = oldWidth || "";
  ref.current.style.height = oldHeight || "";
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  // Trigger lại render nếu cần
  if (typeof setZoom === "function") {
    setZoom((z) => z + 0.0001); // Thay đổi rất nhỏ để React-D3-Tree render lại
  }

  return canvas;
};

const previewPDF = async (ref, paperSize = "a4", setExporting, setZoom) => {
  if (setExporting) setExporting(true);
  try {
    const scale = 2;
    const canvas = await generatePDFCanvas(ref, scale, setZoom);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdf = new jsPDF("landscape", "pt", paperSize);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ratio = 96 / 72;
    const pageWidthPx = pageWidth * ratio;
    const pageHeightPx = pageHeight * ratio;

    const cols = Math.ceil(imgWidth / pageWidthPx);
    const rows = Math.ceil(imgHeight / pageHeightPx);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = col * pageWidthPx;
        const sy = row * pageHeightPx;
        const sWidth = Math.min(pageWidthPx, imgWidth - sx);
        const sHeight = Math.min(pageHeightPx, imgHeight - sy);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = sWidth;
        pageCanvas.height = sHeight;
        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        // Kiểm tra trang trống
        const imageData = ctx.getImageData(0, 0, sWidth, sHeight).data;
        let hasContent = false;
        for (let i = 0; i < imageData.length; i += 4) {
          if (
            imageData[i] !== 255 ||
            imageData[i + 1] !== 255 ||
            imageData[i + 2] !== 255 ||
            imageData[i + 3] !== 255
          ) {
            hasContent = true;
            break;
          }
        }
        if (!hasContent) continue;

        const scaleW = pageWidth / sWidth;
        const scaleH = pageHeight / sHeight;
        const scaleRatio = Math.min(scaleW, scaleH, 1);

        const drawWidth = sWidth * scaleRatio;
        const drawHeight = sHeight * scaleRatio;
        const offsetX = (pageWidth - drawWidth) / 2;
        const offsetY = (pageHeight - drawHeight) / 2;

        const pageImg = pageCanvas.toDataURL("image/png");
        if (row > 0 || col > 0) pdf.addPage();

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        pdf.addImage(pageImg, "PNG", offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    const blob = await pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);

    if (isMobile) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "so-do-pha-he-trinh-ba.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(
        "PDF đã được tạo và tải về. Vui lòng mở file bằng ứng dụng đọc PDF trên thiết bị của bạn."
      );
    } else {
      const previewWindow = window.open();
      if (previewWindow) {
        previewWindow.document.write(`
          <html><head><title>Preview PDF</title></head>
          <body style='margin:0'>
            <iframe src='${blobUrl}' style='width:100vw; height:100vh; border:none'></iframe>
          </body></html>
        `);
      }
    }
  } catch (err) {
    alert("Có lỗi khi xuất PDF. Vui lòng thử lại!");
  } finally {
    if (setExporting) setExporting(false);
  }
};

const downloadPDF = async (ref, paperSize = "a4", setExporting, setZoom) => {
  if (setExporting) setExporting(true);
  try {
    const scale = 2;
    const canvas = await generatePDFCanvas(ref, scale, setZoom);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdf = new jsPDF("landscape", "pt", paperSize);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Chuyển đổi đơn vị pt của PDF sang px (96dpi màn hình / 72dpi PDF)
    const ratio = 96 / 72;
    const pageWidthPx = pageWidth * ratio;
    const pageHeightPx = pageHeight * ratio;

    const cols = Math.ceil(imgWidth / pageWidthPx);
    const rows = Math.ceil(imgHeight / pageHeightPx);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = col * pageWidthPx;
        const sy = row * pageHeightPx;
        const sWidth = Math.min(pageWidthPx, imgWidth - sx);
        const sHeight = Math.min(pageHeightPx, imgHeight - sy);

        // Tạo canvas nhỏ cho từng trang
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = sWidth;
        pageCanvas.height = sHeight;
        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        // Kiểm tra trang trống
        const imageData = ctx.getImageData(0, 0, sWidth, sHeight).data;
        let hasContent = false;
        for (let i = 0; i < imageData.length; i += 4) {
          if (
            imageData[i] !== 255 ||
            imageData[i + 1] !== 255 ||
            imageData[i + 2] !== 255 ||
            imageData[i + 3] !== 255
          ) {
            hasContent = true;
            break;
          }
        }
        if (!hasContent) continue;

        // Tính tỷ lệ scale để vừa chiều rộng hoặc chiều cao, giữ nguyên tỷ lệ gốc
        const scaleW = pageWidth / sWidth;
        const scaleH = pageHeight / sHeight;
        const scaleRatio = Math.min(scaleW, scaleH, 1);

        const drawWidth = sWidth * scaleRatio;
        const drawHeight = sHeight * scaleRatio;
        const offsetX = (pageWidth - drawWidth) / 2;
        const offsetY = (pageHeight - drawHeight) / 2;

        const pageImg = pageCanvas.toDataURL("image/png");
        if (row > 0 || col > 0) pdf.addPage();

        // Tô nền trắng cho trang PDF trước khi vẽ ảnh (tránh bị trong suốt)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        pdf.addImage(pageImg, "PNG", offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    pdf.save("so-do-pha-he-trinh-ba.pdf");
  } catch (err) {
    alert("Có lỗi khi xuất PDF. Vui lòng thử lại!");
  } finally {
    if (setExporting) setExporting(false);
  }
};

const downloadImage = async (ref, setExportingImage) => {
  if (setExportingImage) setExportingImage(true);
  try {
    if (!ref.current) return;

    const svg = ref.current.querySelector("svg");
    if (!svg) {
      alert("Không tìm thấy SVG để xuất ảnh!");
      return;
    }

    const bbox = svg.getBBox();
    const svgWidth = bbox.x + bbox.width + 40;
    const svgHeight = bbox.y + bbox.height + 40;

    const oldWidth = ref.current.style.width;
    const oldHeight = ref.current.style.height;
    const oldOverflow = ref.current.style.overflow;

    ref.current.style.width = `${svgWidth}px`;
    ref.current.style.height = `${svgHeight}px`;
    ref.current.style.overflow = "visible";
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);

    await new Promise((resolve) => setTimeout(resolve, 500));
    await document.fonts.ready;

    const canvas = await html2canvas(ref.current, {
      useCORS: true,
      backgroundColor: null,
      scale: 3,
      scrollX: 0,
      scrollY: 0,
      windowWidth: svgWidth,
      windowHeight: svgHeight,
    });

    ref.current.style.width = oldWidth || "";
    ref.current.style.height = oldHeight || "";
    ref.current.style.overflow = oldOverflow || "";
    svg.removeAttribute("width");
    svg.removeAttribute("height");

    if (!canvas || !canvas.toDataURL) {
      alert("Không thể tạo canvas từ cây phả hệ!");
      return;
    }
    const img = canvas.toDataURL("image/png");
    if (!img || img.length < 100) {
      alert("Ảnh xuất ra bị lỗi, vui lòng thử lại hoặc thu nhỏ cây.");
      return;
    }
    const link = document.createElement("a");
    link.href = img;
    link.download = "so-do-pha-he-trinh-ba.png";
    link.click();
  } finally {
    if (setExportingImage) setExportingImage(false);
  }
};

export default function SoDoPhaHeTrinhBaToc() {
  const treeContainer = useRef(null);
  const [paperSize, setPaperSize] = useState("a0");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [infoExpanded, setInfoExpanded] = useState(true); // Thêm state cho expand/collapse
  const [exportingPreview, setExportingPreview] = useState(false);
  const [exportingDownload, setExportingDownload] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  // Thêm biến kiểm tra thiết bị di động
  const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);

  // Dữ liệu đã lọc theo nhánh
  const filteredData = useMemo(() => {
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
            {/* <li style={{ marginBottom: 10 }}>
              <b>TẠO LẬP:</b> HẬU DUỆ VIỄN TÔN - TRỊNH BÁ CHÍ TRUNG ĐỜI THỨ 18.
            </li>
            <li style={{ marginBottom: 10 }}>
              <b>TUẾ THỨ:</b> ẤT TỴ NIÊN - SƠ TỨ NGUYỆT - NHỊ THẬP NGŨ NHẬT -
              2025.
            </li> */}
            <li style={{ marginBottom: 10 }}>
              <b>
                "CON NGƯỜI SINH TRƯỞNG BỞI ĐÂU,
                <br />
                GỐC LÀ TIÊN TỔ - ƠN SÂU RÕ RÀNG…"
              </b>
            </li>
            {/* <li style={{ marginBottom: 10 }}>
              <b>Ý nghĩa:</b> Sơ đồ giúp con cháu hiểu về nguồn cội, kết nối các
              thế hệ, lưu giữ truyền thống gia đình.
            </li> */}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <div className="tree-wrapper" style={{ position: "relative" }}>
      <h1 className="tree-title">Phả hệ Trịnh Bá Tộc - Chi 2</h1>
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
            margin: "0 16px ",
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
        {!isMobile && (
          <>
            <button
              style={{
                padding: "8px 20px",
                background: exportingPreview ? "#fbbf24" : "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: exportingPreview ? "not-allowed" : "pointer",
                marginRight: 8,
                opacity: exportingPreview ? 0.7 : 1,
              }}
              disabled={exportingPreview}
              onClick={() =>
                previewPDF(
                  treeContainer,
                  paperSize,
                  setExportingPreview,
                  setZoom
                )
              }
            >
              {exportingPreview ? "Đang xử lý..." : "Xem trước PDF"}
            </button>
            <button
              style={{
                padding: "8px 20px",
                background: exportingDownload ? "#fbbf24" : "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: exportingDownload ? "not-allowed" : "pointer",
                marginRight: 8,
                opacity: exportingDownload ? 0.7 : 1,
              }}
              disabled={exportingDownload}
              onClick={() =>
                downloadPDF(
                  treeContainer,
                  paperSize,
                  setExportingDownload,
                  setZoom
                )
              }
            >
              {exportingDownload ? "Đang xử lý..." : "Xuất PDF"}
            </button>
          </>
        )}
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
          onClick={() => downloadImage(treeContainer, setExportingImage)}
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
      {exportingImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color: "#f59e0b",
            fontWeight: 600,
            pointerEvents: "auto",
          }}
        >
          Đang xuất ảnh PNG, vui lòng chờ...
        </div>
      )}
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
        {/* <div className="info-node">
          <b className="info-node-title">Thông tin gia phả Trịnh Bá Tộc:</b>
          <ul className="info-node-list">
            <li>
              <b>
                Làng Thượng Phúc, xã Xuân Thượng, huyện Xuân Trường, tỉnh Nam
                Định.
              </b>
            </li>
            <li>
              <b>TẠO LẬP:</b> HẬU DUỆ VIỄN TÔN - TRỊNH BÁ CHÍ TRUNG ĐỜI THỨ 18.
            </li>
            <li>
              <b>TUẾ THỨ:</b> ẤT TỴ NIÊN - SƠ TỨ NGUYỆT - NHỊ THẬP NGŨ NHẬT -
              2025.
            </li>
            <li>
              <b>
                "CON NGƯỜI SINH TRƯỞNG BỞI ĐÂU,
                <br />
                GỐC LÀ TIÊN TỔ - ƠN SÂU RÕ RÀNG…"
              </b>
            </li>
            <li>
              <b>Ý nghĩa:</b> Sơ đồ giúp con cháu hiểu về nguồn cội, kết nối các
              thế hệ, lưu giữ truyền thống gia đình.
            </li>
          </ul>
        </div> */}
        <Tree
          data={filteredData}
          orientation="vertical"
          translate={{ x: window.innerWidth / 2, y: 320 }}
          zoom={zoom}
          zoomable={true}
          shouldCollapseNeighborNodes={false}
          separation={{ siblings: 4, nonSiblings: 5 }}
          nodeSize={{ x: 80, y: 240 }}
          renderCustomNodeElement={renderCustomNode}
        />
      </div>
    </div>
  );
}

// Dữ liệu treeData được định nghĩa bên ngoài để dễ bảo trì
