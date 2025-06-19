# Sơ Đồ Phả Hệ Trịnh Bá Tộc

Ứng dụng React hiển thị sơ đồ phả hệ của Trịnh Bá Tộc bằng thư viện `react-d3-tree`, có hỗ trợ xuất PDF và màu sắc phân đời.

## 🚀 Chức năng chính

- Hiển thị cây phả hệ từ file `treeData.json`
- Tô màu theo từng đời (tự động)
- Hiển thị thông tin như: vai trò, chức vụ, năm sinh, năm mất, ngày kỵ, hôn thê, hôn thú...
- Có thể xuất file PDF trực tiếp từ trình duyệt

## 📁 Cấu trúc thư mục

```
so-do-pha-he-trinh-ba/
├── public/
├── src/
│   ├── App.js
│   ├── TreeChart.css
│   ├── treeData.json
│   └── index.js
├── package.json
└── README.md
```

## 📦 Cài đặt

```bash
npm install
```

## ▶️ Chạy thử local

```bash
npm start
```

## 🏗 Build (nếu muốn deploy lên GitHub Pages, Vercel, Netlify...)

```bash
npm run build
```

## 🚀 Triển khai trên Vercel

1. Tạo tài khoản tại [https://vercel.com](https://vercel.com)
2. Kết nối GitHub repository của bạn
3. Khi được hỏi:
   - **Framework Preset**: chọn **React**
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Nhấn **Deploy** để bắt đầu triển khai

👉 Sau vài phút, bạn sẽ có một đường link dạng `https://ten-du-an.vercel.app`

### 🌐 Gắn tên miền riêng trên Vercel

1. Mở dashboard dự án trên Vercel
2. Chọn **Settings** → **Domains** → nhấn **Add**
3. Nhập tên miền bạn muốn dùng (ví dụ: `trinhbatoc.com`)
4. Làm theo hướng dẫn để cập nhật DNS:
   - Trỏ bản ghi `A` hoặc `CNAME` từ nhà cung cấp tên miền (GoDaddy, Namecheap...) về `cname.vercel-dns.com`
5. Chờ DNS cập nhật (5–30 phút), rồi làm mới Vercel

🔒 Nếu muốn dùng HTTPS, Vercel sẽ cấp tự động SSL từ Let's Encrypt cho tên miền của bạn.

## 📄 treeData.json

Toàn bộ dữ liệu sơ đồ được tách riêng để dễ cập nhật, theo dạng:

```json
{
  "name": "Trịnh Công Thành",
  "attributes": {
    "đời": "1",
    "vai_tro": "Đức Thuỷ Tổ"
  },
  "children": [
    {
      "name": "Trịnh Quang",
      "attributes": { "đời": "2" },
      "children": [
        // ...
      ]
    }
  ]
}
```

## 👥 Đóng góp & nâng cấp

Bạn có thể cập nhật `treeData.json` theo các nhánh mới, thêm chức vụ, tên hôn thê, năm sinh... Dự án hoàn toàn có thể mở rộng ra nhiều họ khác nếu cần.

---

Chúc bạn sử dụng ứng dụng hiệu quả để lưu giữ gia phả cho thế hệ sau! 🙏
