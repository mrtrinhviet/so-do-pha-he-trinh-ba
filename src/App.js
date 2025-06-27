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

const generatePDFCanvas = async (ref, scale = 1.2, setZoom) => {
  if (!ref.current) return null;

  // Lấy các thông số cần thiết
  const container = ref.current;
  const svg = container.querySelector("svg");
  const g = svg.querySelector("g");
  if (!svg || !g) return null;

  // Padding cho các phía
  const paddingTop = 80;
  const paddingSides = 120;
  const paddingBottom = 380;

  const bbox = g.getBBox();
  const svgWidth = bbox.width + paddingSides * 2;
  const svgHeight = bbox.height + paddingTop + paddingBottom;

  // Clone node để render ngoài body, tránh bị crop bởi viewport
  const clone = container.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.zIndex = "-9999";
  clone.style.width = `${svgWidth}px`;
  clone.style.height = `${svgHeight}px`;
  clone.style.overflow = "visible";
  clone.style.background = "#fff";
  document.body.appendChild(clone);

  // Chỉnh svg/g trong clone
  const cloneSvg = clone.querySelector("svg");
  const cloneG = cloneSvg.querySelector("g");
  cloneSvg.setAttribute("width", svgWidth);
  cloneSvg.setAttribute("height", svgHeight);
  cloneG.setAttribute(
    "transform",
    `translate(${-bbox.x + paddingSides},${-bbox.y + paddingTop})`
  );

  // Đổi màu info-node trong clone (nếu có)
  const infoNode = clone.querySelector(".info-node");
  if (infoNode) {
    infoNode.style.background = "#f3f4f6";
    infoNode.style.borderColor = "#d1d5db";
  }

  await new Promise((r) => setTimeout(r, 500));
  await document.fonts.ready;

  // Render canvas từ clone
  const canvas = await html2canvas(clone, {
    useCORS: true,
    backgroundColor: "#fff",
    scale,
    width: svgWidth,
    height: svgHeight,
  });

  // Xóa clone khỏi DOM
  document.body.removeChild(clone);

  // Tối ưu màu sắc
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 0.98); // Red
      data[i + 1] = Math.min(255, data[i + 1] * 0.97); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 0.98); // Blue
    }
    ctx.globalAlpha = 0.98;
    ctx.putImageData(imageData, 0, 0);

    // --- VẼ KHUNG VIỀN 4 CẠNH ---
    // ctx.save();
    // const borderPadding = 60;
    // ctx.strokeStyle = "#92400e";
    // ctx.lineWidth = 16;
    // const halfLine = ctx.lineWidth / 2;
    // const x = Math.round(borderPadding + halfLine);
    // const y = Math.round(borderPadding + halfLine);
    // const w = Math.round(canvas.width - 2 * borderPadding - ctx.lineWidth);
    // const h = Math.round(canvas.height - 2 * borderPadding - ctx.lineWidth);
    // ctx.strokeRect(x, y, w, h);

    // const innerPadding = 24;
    // ctx.lineWidth = 6;
    // ctx.strokeStyle = "#fbbf24";
    // const x2 = Math.round(borderPadding + innerPadding + ctx.lineWidth / 2);
    // const y2 = Math.round(borderPadding + innerPadding + ctx.lineWidth / 2);
    // const w2 = Math.round(
    //   canvas.width - 2 * (borderPadding + innerPadding) - ctx.lineWidth
    // );
    // const h2 = Math.round(
    //   canvas.height - 2 * (borderPadding + innerPadding) - ctx.lineWidth
    // );
    // ctx.strokeRect(x2, y2, w2, h2);
    // ctx.restore();
  }

  // Trả về canvas để xử lý tiếp (tải về hoặc mở tab mới)
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
    const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
    let scale;
    let win;
    if (isMobile) {
      // Mở tab mới NGAY khi click và hiển thị thông báo đang tải
      win = window.open();
      if (!win) {
        alert(
          "Trình duyệt đã chặn popup. Vui lòng cho phép mở tab mới để xem ảnh."
        );
        return;
      }
      win.document.write(`
        <html>
          <head><title>Đang tải ảnh...</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#fffbe9;">
            <div style="color:#92400e;font-size:20px;font-family:Georgia,serif;">
              Đang tải ảnh, vui lòng chờ...
            </div>
          </body>
        </html>
      `);
      scale = 0.5;
    } else {
      scale = 2;
    }
    const canvas = await generatePDFCanvas(ref, scale, setZoom);

    // Xuất ảnh từ canvas
    if (isMobile) {
      const img = canvas.toDataURL("image/png");
      win.document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fffbe9;">
          <img src="${img}" style="max-width:100vw;max-height:80vh;display:block;margin:auto"/>
          <div style="color:#92400e;font-size:18px;margin:8px 0 0 0;text-align:center">
            Nhấn giữ vào ảnh để lưu về máy
          </div>
        </div>
      `;
    } else {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "so-do-pha-he.png";
      link.click();
    }
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
  // Thêm biến kiểm tra thiết bị di động
  // const isMobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
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
      <div className="tree-actions-bar">
        {/* Thêm input tìm kiếm nhánh */}
        <input
          type="text"
          placeholder="Tìm nhánh theo tên, vai trò, năm sinh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="tree-search-input"
        />
        <label style={{ marginRight: 8, fontWeight: 500 }}>
          Chọn khổ giấy:
        </label>
        <select
          value={paperSize}
          onChange={(e) => setPaperSize(e.target.value)}
        >
          {PAPER_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <button
          className="tree-actions-btn preview"
          disabled={exportingPreview}
          style={{}}
          onClick={() =>
            previewPDF(treeContainer, paperSize, setExportingPreview, setZoom)
          }
        >
          {exportingPreview ? "Đang xử lý..." : "Xem trước PDF"}
        </button>
        <button
          className="tree-actions-btn export-img"
          style={{}}
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
          className="tree-actions-btn zoom"
          onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
        >
          Phóng to +
        </button>
        <button
          className="tree-actions-btn zoom"
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
