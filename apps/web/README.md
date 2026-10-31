# Camera Wizard — web app (PWA)

App gợi ý dáng chụp ảnh du lịch. Chạy hoàn toàn trên điện thoại, kể cả khi không có mạng.

## Đã có (Giai đoạn 0–1)

- **Thêm dáng mẫu:** chọn nhiều ảnh chụp màn hình → crop → nhập số like/lưu (hiểu "1.2万", "3.4w", "12K") → AI tách viền + khung xương từng người → lưu vào máy.
- **Thư viện:** lọc 1 người / cặp đôi / nhóm, theo địa điểm, yêu thích; sắp theo điểm viral hoặc mới nhất.
- **Chi tiết dáng:** xem ảnh + viền, chỉ viền (silhouette), khung xương; sửa thông tin, xoá.
- **Gợi ý:** chọn ảnh khung cảnh vừa chụp → app tìm ảnh mẫu có phông nền giống nhất, kết hợp độ viral.
- **Địa điểm:** Thành Đô, Trùng Khánh và nhóm dáng chung; chạm để copy từ khoá tìm trên 小红书 / 抖音 / TikTok / Instagram.
- **Offline:** AI (MediaPipe) và model được đóng gói cùng app, không gọi Google CDN.

Mọi dữ liệu nằm trong IndexedDB của trình duyệt trên điện thoại, không gửi lên server.

## Chạy trên máy

```bash
cd apps/web
npm install
npm run dev        # tự tải model AI vào public/models lần đầu
npm test           # unit test
npm run build      # build production vào dist/
```

## Đưa lên mạng (Cloudflare Pages, miễn phí)

1. Đăng nhập Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → chọn repo này.
2. Cấu hình build:
   - **Root directory:** `apps/web`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION` = `22`
3. Deploy. Cloudflare cho link dạng `https://<tên>.pages.dev`.

## Cài lên iPhone

1. Mở link bằng **Safari** (khi có Wi-Fi).
2. Bấm nút **Chia sẻ** → **Thêm vào MH chính** (Add to Home Screen).
3. Mở app từ màn hình chính, vào tab **Địa điểm**, chờ dòng "✓ AI đã tải về máy".

Phải cài ra màn hình chính: nếu chỉ mở trong Safari, iOS có thể xoá dữ liệu sau một thời gian không dùng.

## Ghi chú kỹ thuật

- MediaPipe chạy bằng CPU. Ảnh đưa vào AI luôn có chiều rộng là bội số của 4, vì bản CPU bị crash với các chiều rộng khác (xem `visionInput` trong `src/vision/analyze.ts`).
- Model: `pose_landmarker_full` (tìm người + khung xương + mask), `mobilenet_v3_small` (dấu vân tay khung cảnh).
- Viền dáng: mask → lấy vùng lớn nhất → dò biên (Moore) → giảm điểm (Douglas–Peucker) → làm mượt (Chaikin). Xem `src/vision/outline.ts`.
- Điểm viral: xem `src/lib/viral.ts`.
