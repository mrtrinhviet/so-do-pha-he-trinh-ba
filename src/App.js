import React, { useState, useMemo, useRef, useEffect } from "react";
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
    // console.log("roles: " + roles);
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
        width="230"
        height={totalHeight}
        x="-115"
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
  if (!ref.current) return null;

  const container = ref.current;
  const svg = container.querySelector("svg");
  const g = svg.querySelector("g");
  if (!svg || !g) return null;

  // Lưu lại trạng thái cũ của style để khôi phục sau
  const oldBg = container.style.background;
  const infoNode = container.querySelector(".info-node");
  const oldInfoBg = infoNode ? infoNode.style.background : undefined;
  const oldInfoBorder = infoNode ? infoNode.style.borderColor : undefined;

  // Đổi màu nền và info-node sang trắng/xám nhạt để tối ưu in ấn
  container.style.background = "#fff";
  if (infoNode) {
    infoNode.style.background = "#f3f4f6"; // xám nhạt
    infoNode.style.borderColor = "#d1d5db"; // xám nhạt
  }

  // Lưu lại trạng thái cũ của SVG/canvas
  const oldWidth = container.style.width;
  const oldHeight = container.style.height;
  const oldOverflow = container.style.overflow;
  const oldSvgWidth = svg.getAttribute("width");
  const oldSvgHeight = svg.getAttribute("height");
  const oldTransform = g.getAttribute("transform");

  // Padding cho các phía
  const paddingTop = 100;
  const paddingSides = 100;
  const paddingBottom = 320;

  const bbox = g.getBBox();
  const svgWidth = bbox.width + paddingSides * 2;
  const svgHeight = bbox.height + paddingTop + paddingBottom;

  container.style.width = `${svgWidth}px`;
  container.style.height = `${svgHeight}px`;
  container.style.overflow = "visible";
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  g.setAttribute(
    "transform",
    `translate(${-bbox.x + paddingSides},${-bbox.y + paddingTop})`
  );

  await new Promise((r) => setTimeout(r, 500));
  await document.fonts.ready;

  const canvas = await html2canvas(container, {
    useCORS: true,
    backgroundColor: "#fff",
    scale,
    width: svgWidth,
    height: svgHeight,
  });

  // Đổi màu RGB sang sRGB tối ưu trước khi xuất
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Giảm độ bão hòa và tinh chỉnh gam
      data[i] = Math.min(255, data[i] * 0.98); // Red
      data[i + 1] = Math.min(255, data[i + 1] * 0.97); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 0.98); // Blue
    }
    ctx.globalAlpha = 0.98;
    ctx.putImageData(imageData, 0, 0);

    // --- VẼ KHUNG VIỀN 4 CẠNH ---
    // ctx.save();
    // const borderPadding = 110;
    // ctx.strokeStyle = "#92400e";
    // ctx.lineWidth = 16;
    // const x = borderPadding;
    // const y = borderPadding;
    // const w = canvas.width - 2 * borderPadding;
    // const h = canvas.height - 2 * borderPadding;
    // ctx.strokeRect(
    //   x + ctx.lineWidth / 2,
    //   y + ctx.lineWidth / 2,
    //   w - ctx.lineWidth,
    //   h - ctx.lineWidth
    // );

    // const innerPadding = 24;
    // ctx.lineWidth = 6;
    // ctx.strokeStyle = "#fbbf24";
    // const x2 = borderPadding + innerPadding;
    // const y2 = borderPadding + innerPadding;
    // const w2 = canvas.width - 2 * (borderPadding + innerPadding);
    // const h2 = canvas.height - 2 * (borderPadding + innerPadding);
    // ctx.strokeRect(
    //   x2 + ctx.lineWidth / 2,
    //   y2 + ctx.lineWidth / 2,
    //   w2 - ctx.lineWidth,
    //   h2 - ctx.lineWidth
    // );
    // ctx.restore();
  }

  // Khôi phục lại trạng thái cũ
  container.style.width = oldWidth;
  container.style.height = oldHeight;
  container.style.overflow = oldOverflow;
  container.style.background = oldBg || "#fffbe9";
  if (infoNode) {
    infoNode.style.background = oldInfoBg || "#fffbe9";
    infoNode.style.borderColor = oldInfoBorder || "#fcd34d";
  }
  if (oldSvgWidth) svg.setAttribute("width", oldSvgWidth);
  else svg.removeAttribute("width");
  if (oldSvgHeight) svg.setAttribute("height", oldSvgHeight);
  else svg.removeAttribute("height");
  if (oldTransform) g.setAttribute("transform", oldTransform);
  else g.removeAttribute("transform");

  if (typeof setZoom === "function") {
    setZoom((z) => z + 0.0001);
  }

  return canvas;
};

const previewPDF = async (ref, paperSize = "a4", setExporting, setZoom) => {
  if (setExporting) setExporting(true);
  try {
    const scale = 1.2;
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

        const pageImg = pageCanvas.toDataURL("image/jpeg", 0.85);
        if (row > 0 || col > 0) pdf.addPage();

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        pdf.addImage(pageImg, "JPEG", offsetX, offsetY, drawWidth, drawHeight);
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
    const scale = 1.2;
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

        const pageImg = pageCanvas.toDataURL("image/jpeg", 0.85);
        if (row > 0 || col > 0) pdf.addPage();

        // Tô nền trắng cho trang PDF trước khi vẽ ảnh (tránh bị trong suốt)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        pdf.addImage(pageImg, "JPEG", offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    pdf.save("so-do-pha-he-trinh-ba.pdf");
  } catch (err) {
    alert("Có lỗi khi xuất PDF. Vui lòng thử lại!");
  } finally {
    if (setExporting) setExporting(false);
  }
};

function fitTreeToViewport(ref, setTranslate, setZoom, padding = 40) {
  const container = ref.current;
  if (!container) return;
  const g = container.querySelector("svg g");
  if (!g) return;
  const bbox = g.getBBox();
  if (bbox.width === 0 || bbox.height === 0) return;

  const containerWidth = container.offsetWidth - padding * 2;
  const containerHeight = container.offsetHeight - padding * 2;

  // Tính tỉ lệ zoom nhỏ nhất để vừa cả chiều ngang và dọc
  const zoomX = containerWidth / bbox.width;
  const zoomY = containerHeight / bbox.height;
  const zoom = Math.min(zoomX, zoomY, 1); // Không phóng to quá 100%

  // Tính lại translate để căn giữa
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  const x = container.offsetWidth / 2 - centerX * zoom;
  const y = container.offsetHeight / 2 - centerY * zoom;

  setZoom(zoom);
  setTranslate({ x, y });
}

const exportToSizedImage = async (
  ref,
  setIsExporting,
  setTranslate,
  setZoom
) => {
  if (setIsExporting) setIsExporting(true);
  try {
    const scale = 2;
    const canvas = await generatePDFCanvas(ref, scale, setZoom);

    // Xuất ảnh từ canvas
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "so-do-pha-he.png";
    link.click();
  } finally {
    fitTreeToViewport(ref, setTranslate, setZoom);
    if (setIsExporting) setIsExporting(false);
  }
};

export const useRestoreTranslate = (ref, setTranslate, setZoom, deps = []) => {
  useEffect(() => {
    // let tries = 0;
    const tryFit = () => {
      fitTreeToViewport(ref, setTranslate, setZoom);
    };
    setTimeout(tryFit, 300);
    // eslint-disable-next-line
  }, deps);
};

export default function SoDoPhaHeTrinhBaToc() {
  const treeContainer = useRef(null);
  const [paperSize, setPaperSize] = useState("a0");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  // const [infoExpanded, setInfoExpanded] = useState(true); // Thêm state cho expand/collapse
  const [exportingPreview, setExportingPreview] = useState(false);
  const [exportingDownload, setExportingDownload] = useState(false);
  // Thêm biến kiểm tra thiết bị di động
  const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
  // const treeContainer = useRef(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

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

  useRestoreTranslate(treeContainer, setTranslate, setZoom, [filteredData]);
  // Thông tin về gia phả (có thể chỉnh sửa nội dung này tuỳ ý)
  // const info = (
  //   <div
  //     style={{
  //       background: "#fffbe9",
  //       border: "1px solid #fcd34d",
  //       borderRadius: 8,
  //       padding: infoExpanded ? "16px 20px" : "6px 20px",
  //       marginBottom: 20,
  //       color: "#92400e",
  //       fontSize: 16,
  //       maxWidth: 900,
  //       marginLeft: "auto",
  //       marginRight: "auto",
  //       boxShadow: "0 2px 8px #fbbf2433",
  //       transition: "padding 0.2s",
  //       position: "relative",
  //       minHeight: 0,
  //     }}
  //   >
  //     <button
  //       onClick={() => setInfoExpanded((v) => !v)}
  //       style={{
  //         position: "absolute",
  //         top: 8,
  //         right: 12,
  //         background: "#f59e0b",
  //         color: "#fff",
  //         border: "none",
  //         borderRadius: 4,
  //         padding: "2px 10px",
  //         fontWeight: 600,
  //         cursor: "pointer",
  //         fontSize: 14,
  //         zIndex: 2,
  //       }}
  //       aria-label={infoExpanded ? "Thu gọn ghi chú" : "Mở rộng ghi chú"}
  //       title={infoExpanded ? "Thu gọn ghi chú" : "Mở rộng ghi chú"}
  //     >
  //       {infoExpanded ? "Ẩn ghi chú ▲" : "Hiện ghi chú ▼"}
  //     </button>
  //     {infoExpanded && (
  //       <>
  //         <b>Thông tin gia phả Trịnh Bá Tộc:</b>
  //         <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
  //           <li style={{ marginBottom: 10 }}>
  //             <b>
  //               Làng Thượng Phúc, xã Xuân Thượng, huyện Xuân Trường, tỉnh Nam
  //               Định.
  //             </b>
  //           </li>
  //           {/* <li style={{ marginBottom: 10 }}>
  //             <b>TẠO LẬP:</b> HẬU DUỆ VIỄN TÔN - TRỊNH BÁ CHÍ TRUNG ĐỜI THỨ 18.
  //           </li>
  //           <li style={{ marginBottom: 10 }}>
  //             <b>TUẾ THỨ:</b> ẤT TỴ NIÊN - SƠ TỨ NGUYỆT - NHỊ THẬP NGŨ NHẬT -
  //             2025.
  //           </li> */}
  //           <li style={{ marginBottom: 10 }}>
  //             <b>
  //               "CON NGƯỜI SINH TRƯỞNG BỞI ĐÂU,
  //               <br />
  //               GỐC LÀ TIÊN TỔ - ƠN SÂU RÕ RÀNG…"
  //             </b>
  //           </li>
  //           {/* <li style={{ marginBottom: 10 }}>
  //             <b>Ý nghĩa:</b> Sơ đồ giúp con cháu hiểu về nguồn cội, kết nối các
  //             thế hệ, lưu giữ truyền thống gia đình.
  //           </li> */}
  //         </ul>
  //       </>
  //     )}
  //   </div>
  // );

  return (
    <div className="tree-wrapper" style={{ position: "relative" }}>
      <h1 className="tree-title">Phả hệ Trịnh Bá Tộc - Chi 2</h1>
      {/* {info} */}
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
          onClick={() =>
            exportToSizedImage(
              treeContainer,
              setIsExporting,
              setTranslate,
              setZoom
            )
          }
        >
          {isExporting ? "Đang xuất ảnh..." : "Xuất ảnh"}
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
      {isExporting && (
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
          Đang xuất ảnh, vui lòng chờ...
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
        <div className="info-node">
          <b className="info-node-title">Phả hệ Trịnh Bá Tộc - Chi 2</b>
          <ul className="info-node-list">
            <li>
              <b>
                Làng Thượng Phúc, xã Xuân Thượng, huyện Xuân Trường, tỉnh Nam
                Định.
              </b>
            </li>

            <li>
              <b>
                "CON NGƯỜI SINH TRƯỞNG BỞI ĐÂU,
                <br />
                GỐC LÀ TIÊN TỔ - ƠN SÂU RÕ RÀNG…"
              </b>
            </li>
          </ul>
        </div>
        <Tree
          data={filteredData && filteredData.children ? filteredData : treeData}
          orientation="vertical"
          translate={translate}
          zoom={zoom}
          zoomable={true}
          shouldCollapseNeighborNodes={false}
          separation={{ siblings: 3, nonSiblings: 3 }}
          nodeSize={{ x: 80, y: 220 }}
          renderCustomNodeElement={renderCustomNode}
        />
      </div>
    </div>
  );
}
