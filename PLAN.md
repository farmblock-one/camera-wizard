# Camera Wizard — Plan build app gợi ý dáng chụp (kiểu SnapPose) cho du lịch cá nhân

> Mục tiêu: một app chạy trên điện thoại, đứng ở đâu cũng gợi ý được dáng chụp hợp cảnh,
> rồi hiện **viền dáng (outline) đè lên camera** để người chụp/người được chụp căn theo.
> Dùng cá nhân, không phát hành lên store.

---

## 0. Bối cảnh chuyến đi đầu tiên (ưu tiên cao nhất, ghi đè các mục bên dưới nếu mâu thuẫn)

- **Máy:** iPhone. **Người chụp:** người đi cùng. **Kiểu ảnh:** 1 người + cặp đôi.
- **Điểm đến:** Thành Đô & Trùng Khánh (Trung Quốc), tháng 11–12. Còn nhiều thời gian trước khi bay.
- **Đã chốt:** chỉ làm web app (PWA), **không làm app iPhone native**. Ảnh thật chụp bằng **Camera gốc của iPhone**, rồi upload lên app.
- **Mạng:** mua eSIM Trung Quốc.

### 0.1 Đi Trung Quốc ảnh hưởng gì
| Vấn đề | Hệ quả | Cách xử lý |
|---|---|---|
| Tường lửa (GFW) | Mạng Trung Quốc (Wi-Fi khách sạn, SIM nội địa) **không vào được** Claude API, Google (MediaPipe model mặc định tải từ `storage.googleapis.com`), và có thể chặn `*.pages.dev` | **Offline-first bắt buộc**: mọi thứ tải sẵn ở Việt Nam trước khi bay |
| Model MediaPipe tải từ CDN Google | Không tải được ở TQ | Tự host file `.wasm` + `.task` cùng app, precache bằng service worker |
| Font/CDN bên ngoài | Lỗi/treo | Không dùng Google Fonts / CDN; bundle tất cả |
| iOS xoá cache web | Mất dữ liệu | **Bắt buộc "Add to Home Screen"**; app cài trên màn hình chính không bị iOS xoá storage sau 7 ngày |
| eSIM Trung Quốc | eSIM du lịch bán cho khách nước ngoài thường đi qua Hong Kong nên vẫn vào được Google/Claude; eSIM của nhà mạng nội địa TQ thì bị chặn | Hỏi người bán: "có vào được Google/Facebook không?". Có → dùng AI tại chỗ. Không → vẫn chạy offline |
| VPN | Về kỹ thuật thì dùng được. Nhưng: VPN không được cấp phép là trái quy định ở TQ (ít khi xử lý khách du lịch); nhiều VPN bị chặn hoặc chập chờn; App Store vùng TQ không có app VPN nên phải cài và test trước khi đi | Không cần cho phần chính, vì phần chính chạy offline. Chỉ ảnh hưởng phần AI tại chỗ |
| Khu vực Anthropic hỗ trợ | Trung Quốc đại lục không nằm trong danh sách khu vực Claude hỗ trợ | Thiết kế để phần AI (đọc số liệu, gắn tag, phân tích địa điểm) **làm xong ở Việt Nam trước khi bay**. Trong chuyến chỉ cần các tính năng offline |

→ Phân tích cảnh bằng AI chuyển sang làm **trước chuyến đi**: cho AI phân tích ảnh tham khảo của từng địa điểm, rồi lưu sẵn kết quả + dáng vào máy.

### 0.2 Nguồn dáng: mạng xã hội, ưu tiên bài viral

**Nguồn:** Xiaohongshu (小红书), Douyin (抖音), TikTok, Instagram. Unsplash/Pexels chỉ là nguồn phụ.

**Vì sao bạn tự lướt, app không tự cào:** các nền tảng này không có API công khai, chặn bot, cần đăng nhập, và cấm cào trong điều khoản. iOS cũng không cho web app nhận "Chia sẻ" từ app khác. Vì vậy:
**bạn lướt và lọc bài hot → chụp màn hình (hoặc quay màn hình video) → import hàng loạt vào app → app tự làm phần còn lại.**

**Bạn lọc độ viral khi lướt:**
| Nền tảng | Cách tìm | Ngưỡng gợi ý ban đầu (chỉnh dần) |
|---|---|---|
| 小红书 | Gõ từ khoá → sắp xếp **最热** (hot nhất) | 收藏 (lưu) ≥ 1.000 |
| 抖音 | Gõ từ khoá → bộ lọc **最多点赞** (nhiều like nhất) | 点赞 ≥ 10.000 |
| TikTok | Tìm từ khoá tiếng Anh, xem tab Top | ≥ 10.000 like |
| Instagram | Hashtag/địa điểm → bài Top | ≥ 1.000 like |

Chụp màn hình **cả phần hiện số like/lưu/bình luận** để app đọc được.

**App xử lý khi import:**
1. **Đọc số liệu từ screenshot** (Claude đọc ảnh, cần mạng nên làm ở Việt Nam): nền tảng, like, lưu, bình luận, chia sẻ (hiểu cả "1.2万" = 12.000), tag địa điểm, caption, ngày đăng, số người trong ảnh. Không có mạng thì nhập tay.
2. **Điểm viral** = log₁₀(1 + like + 3×lưu + 2×bình luận + 2×chia sẻ), quy về **phần trăm xếp hạng trong cùng nền tảng** (vì quy mô Douyin khác hẳn Instagram), cộng điểm nếu đăng trong 12 tháng gần nhất (địa điểm hay thay đổi). Lượt **lưu** được nhân cao vì người ta lưu bài để bắt chước dáng.
3. **Crop** bỏ giao diện app, chữ, sticker → tách viền + khung xương.
4. **Video (抖音/TikTok):** upload bản quay màn hình → app tự trích các khung hình có người rõ và đứng yên → bạn chọn khung đẹp nhất.
5. Gợi ý dáng **sắp theo điểm viral** (lọc được theo địa điểm / 1 người / cặp đôi).

**Từ khoá tìm kiếm** (thêm 情侣 vào để tìm dáng cặp đôi, thêm 冬天 để tìm ảnh mùa đông):
- Chung: 成都拍照姿势 · 重庆拍照姿势 · 成都拍照机位 · 重庆拍照机位 · 情侣拍照姿势
- Trùng Khánh: 洪崖洞拍照 · 李子坝轻轨拍照 · 解放碑拍照 · 长江索道拍照 · 磁器口拍照 · 十八梯拍照 · 鹅岭二厂拍照 · 魁星楼拍照 · 来福士拍照
- Thành Đô: 宽窄巷子拍照 · 锦里拍照 · 太古里拍照 · 文殊院拍照 · 熊猫基地拍照 · 安顺廊桥拍照 · 人民公园拍照
- TikTok/Instagram: `chongqing photo spots` · `chengdu photo ideas` · #hongyadong · #chongqing · #chengdu · #kuanzhaixiangzi

Khối lượng: ~15 địa điểm × 10–20 dáng ≈ 150–300 ảnh, khoảng 2–3 buổi lướt.

### 0.3 Danh sách địa điểm soạn sẵn (thay cho tính năng GPS)
**Thành Đô:** Khoan Trách hạng tử (宽窄巷子), Cẩm Lý (锦里), Vũ Hầu Từ (武侯祠), Xuân Hy Lộ/Thái Cổ Lý (春熙路/太古里) + gấu trúc leo tòa IFS, Văn Thù Viện (文殊院), Cơ sở gấu trúc (熊猫基地), cầu An Thuận về đêm (安顺廊桥), Nhân Dân Công Viên quán trà (人民公园), Đô Giang Yển / Thanh Thành Sơn.
**Trùng Khánh:** Hồng Nhai Động về đêm (洪崖洞), ga monorail xuyên nhà Lý Tử Bá (李子坝), Giải Phóng Bi (解放碑), cáp treo sông Trường Giang (长江索道), Từ Khí Khẩu (磁器口), Thập Bát Thê (十八梯), Nga Lĩnh Nhị Xưởng (鹅岭二厂), Khôi Tinh Lâu (魁星楼), Triều Thiên Môn / Lai Phúc Sĩ (朝天门/来福士).

Mỗi địa điểm: ~10–20 dáng (1 người + cặp đôi), mẹo góc máy, giờ đẹp. Đi tháng 11–12 thường trời âm u/sương, ánh sáng dịu, mặc áo khoác.

### 0.4 Luồng chụp chính: Camera gốc + upload (giữ Night mode, Portrait, chất lượng gốc)

```
① Chọn cảnh ──► ② Chọn dáng ──► ③ Thẻ hướng dẫn ──► ④ Chụp bằng Camera gốc ──► ⑤ Upload để chấm ──► chụp lại / xong
```

1. **Chọn cảnh:** chọn địa điểm trong danh sách soạn sẵn, **hoặc** chụp khung cảnh bằng Camera gốc rồi upload. App gợi ý dáng từ **thư viện của bạn**:
   - **Offline (chính):** MediaPipe `ImageEmbedder` chạy trên máy, tạo "dấu vân tay" hình ảnh cho ảnh cảnh và cho phông nền của từng ảnh mẫu (đã tính sẵn lúc import) → tìm ảnh mẫu có **khung cảnh giống nhất** (cùng địa điểm, cùng góc) → xếp hạng theo **độ giống cảnh × điểm viral**, lọc 1 người / cặp đôi.
   - Cộng thêm GPS trong ảnh (nếu có) để ưu tiên dáng của địa điểm gần nhất.
   - Có mạng thì thêm gợi ý của AI (Claude).
   - Gặp chỗ chưa chuẩn bị trước: vẫn tìm được ảnh mẫu có cảnh *trông giống* (cầu thang, tường cổ, phố đêm…). Nên chuẩn bị thêm một bộ **dáng chung** (đường phố, cầu thang, lan can, quán cà phê, phố đêm neon).
   - Nếu ảnh còn giữ GPS (EXIF) thì tự nhận ra đang ở địa điểm nào trong danh sách. Lưu ý iOS hay xoá vị trí khi chọn ảnh từ web; khi chọn ảnh bấm "Options → bật Location".
2. **Chọn dáng:** lọc theo `1 người` / `cặp đôi`, theo địa điểm, yêu thích.
3. **Thẻ hướng dẫn** (màn hình cho người đi cùng xem trước khi bấm máy):
   - Ảnh mẫu + viền dáng, mẫu và viền xếp cạnh nhau hoặc đè lên nhau.
   - **Cho người chụp:** ống kính (0.5x / 1x / 2x / 3x), độ cao máy (ngang mắt / ngực / hông / sát đất), dọc hay ngang, vị trí người trong khung (1/3 trái…), khoảng cách.
   - **Cho người tạo dáng:** 2–3 gạch đầu dòng ("tay trái chạm mũ", "nhìn ra xa, không nhìn máy").
4. **Chụp bằng Camera gốc** (Night mode cho Hồng Nhai Động, Portrait…).
5. **Upload ảnh vừa chụp để chấm:**
   - Offline: MediaPipe so khung xương với dáng mẫu → điểm 0–100, ảnh đè viền mẫu lên ảnh thật, chỉ ra khớp nào lệch.
   - Có mạng: thêm nhận xét của Claude (so 2 ảnh): sửa dáng, bố cục, ánh sáng, bằng tiếng Việt.
   - Nút "Chụp lại", hoặc lưu ảnh vào nhật ký chuyến đi.

**Tính năng phụ (thử nghiệm ở Giai đoạn 0):**
- **Cửa sổ mẫu nổi (Picture-in-Picture):** vẽ dáng mẫu thành video, bật PiP, rồi mở Camera gốc. Nếu iOS cho phép cửa sổ PiP nổi trên Camera, người chụp vừa nhìn mẫu vừa chụp. Không được thì bỏ.
- **Căn khung trực tiếp trong app:** viền đè lên camera web, chỉ để xem trước và căn khung (chất lượng ảnh thấp hơn, không có Night mode).

Kỹ thuật upload: `<input type="file" accept="image/*">`; iOS tự chuyển ảnh HEIC sang JPEG khi upload. Ảnh resize trên máy trước khi phân tích/gửi AI.

### 0.5 Thứ tự ưu tiên cho chuyến này
1. **Nền móng:** PWA cài lên màn hình chính, chạy offline, tự host model MediaPipe; test PiP.
2. **Thư viện + import từ 小红书:** crop, tách viền, tag `1 người` / `cặp đôi`, tag theo địa điểm.
3. **Thẻ hướng dẫn** cho người chụp + người tạo dáng.
4. **Upload ảnh đã chụp → chấm điểm + đè viền** (offline), hỗ trợ 2 người (`numPoses: 2`).
5. **Chế độ chuyến đi Thành Đô – Trùng Khánh:** địa điểm soạn sẵn, dáng tải sẵn.
6. **AI:** phân tích cảnh từ ảnh upload, nhận xét ảnh đã chụp, tự gắn tag khi import.
7. (Phụ) Căn khung trực tiếp trong app, cửa sổ mẫu PiP.
- Hoãn: tìm địa danh qua GPS/Overpass, Unsplash/Pexels, tự chụp khi khớp dáng.

---

## Tiến độ

| Giai đoạn | Trạng thái |
|---|---|
| 0. Nền móng (PWA, offline, tự host AI) | ✅ Xong |
| 1. Thư viện dáng (import, crop, tách viền, số liệu viral, tag, địa điểm) | ✅ Xong |
| Gợi ý theo ảnh khung cảnh (so phông nền, offline) | ✅ Bản đầu |
| 2. Thẻ hướng dẫn cho người chụp + người tạo dáng | ⏳ Tiếp theo |
| 3. Upload ảnh đã chụp → chấm điểm khớp dáng | ⏳ |
| 4. Chuyến đi, đọc GPS từ ảnh, nhật ký | ⏳ |
| 5. AI (Claude): đọc số liệu từ screenshot, tự gắn tag | ⏳ |
| 6. Import video (trích khung hình), sao lưu thư viện ra file, PiP | ⏳ |

Code ở `apps/web` (xem `apps/web/README.md` để chạy, deploy, cài lên iPhone).

---

## 1. SnapPose làm gì (để biết mình cần clone cái gì)

| Tính năng SnapPose | Mô tả |
|---|---|
| Đưa cảnh vào | 3 cách: chụp ảnh khung cảnh xung quanh, chọn địa danh gần đó (GPS), hoặc gõ mô tả ("hồ lúc hoàng hôn") |
| AI đọc cảnh | Phân tích ánh sáng, phông nền, bề mặt (bậc thang, lan can, tường…). AI chỉ chạy trên cảnh, không chạy trên người |
| Gợi ý dáng | Trả về dáng từ **ảnh thật** chụp ở nơi tương tự |
| Pose Outline Camera | Vẽ viền dáng đã chọn lên camera để căn theo |
| Giá | Free, 3 lượt tìm/ngày, không cần tài khoản |

Bản cá nhân của mình sẽ làm đủ những thứ trên, **cộng thêm** vài thứ hữu ích khi đi du lịch:
- Chấm điểm khớp dáng realtime + **tự bấm chụp** khi khớp (đi một mình, đặt tripod vẫn chụp được).
- **Chế độ chuyến đi (offline)**: tải sẵn dáng cho các điểm đến trước khi bay, ra nước ngoài mạng yếu vẫn dùng được.
- **Thư viện dáng riêng**: import ảnh đã lưu từ Pinterest/Instagram, app tự tách viền.
- Không giới hạn lượt.

---

## 2. Quyết định nền tảng: PWA (web app) trước, native sau nếu cần

> **Đã chốt (xem mục 0):** chỉ PWA, không làm native. Chụp bằng Camera gốc rồi upload, nên phần "chất lượng ảnh iPhone" bên dưới không còn là rủi ro.

| | PWA (khuyến nghị) | Native (Expo / React Native) |
|---|---|---|
| Cài lên máy | Mở link → "Add to Home Screen" | iPhone cần Apple Developer ($99/năm) hoặc ký lại app mỗi 7 ngày |
| Tốc độ build | Nhanh nhất | Chậm hơn |
| Chất lượng ảnh | Android: tốt (`ImageCapture.takePhoto()` full res). **iPhone: lấy frame từ video, thấp hơn camera gốc** (không có Smart HDR/Deep Fusion) | Chất lượng camera gốc |
| Nút âm lượng để chụp | Không làm được | Làm được |
| AI on-device (MediaPipe) | Có (WASM/WebGL) | Có |

**Đề xuất:** làm PWA. Ngày đầu tiên làm một spike nhỏ để test chất lượng ảnh trên chính điện thoại của bạn.
Nếu thấy ảnh iPhone không đạt → giữ nguyên logic, port phần camera sang Expo + `react-native-vision-camera` (Giai đoạn 7, tuỳ chọn).

Mẹo bù cho iPhone ngay trong PWA: chế độ **"Hướng dẫn"** — app chỉ hiện dáng + viền để căn, người chụp xem xong rồi chụp bằng camera gốc.

---

## 3. Kiến trúc

```
┌──────────────────────────── Điện thoại (PWA) ────────────────────────────┐
│  React UI                                                                 │
│   ├─ Camera (getUserMedia) + lớp overlay SVG/Canvas (viền dáng, lưới)     │
│   ├─ MediaPipe Tasks Vision (chạy trên máy, không tốn tiền):              │
│   │    • ImageSegmenter  → tách người khỏi ảnh mẫu → viền (outline)       │
│   │    • PoseLandmarker  → 33 điểm khớp → so dáng realtime                │
│   ├─ IndexedDB (Dexie): thư viện dáng, chuyến đi, ảnh đã chụp             │
│   └─ Service Worker: cache app + model + dáng → chạy offline              │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ HTTPS (chỉ khi có mạng)
┌───────────────▼────────── Backend nhỏ (Cloudflare Worker) ───────────────┐
│  POST /api/analyze-scene  → Claude (vision) → JSON gợi ý                  │
│  GET  /api/search-photos  → Unsplash / Pexels (ảnh dáng mẫu)              │
│  GET  /api/nearby         → OpenStreetMap Overpass (địa danh quanh GPS)   │
│  Giữ API key bí mật + khoá bằng passcode cá nhân                          │
└───────────────────────────────────────────────────────────────────────────┘
```

**Tech stack**
- Frontend: Vite + React + TypeScript, Tailwind, Zustand (state), Dexie (IndexedDB), `vite-plugin-pwa`, `@mediapipe/tasks-vision`.
- Backend: Cloudflare Workers (free tier) + `@anthropic-ai/sdk`.
- Hosting: Cloudflare Pages (camera bắt buộc HTTPS — Pages có sẵn).

---

## 4. Tính năng chi tiết & cách làm

### 4.1 Tách viền dáng từ ảnh mẫu (lõi của app)
1. Ảnh mẫu (import hoặc tải từ Unsplash) → `ImageSegmenter` (model selfie/multiclass) → mask người.
2. Mask → dò đường viền (marching squares) → làm mượt + giảm điểm (Douglas–Peucker) → **SVG path** (nhẹ, scale thoải mái).
3. Song song chạy `PoseLandmarker` → lưu 33 điểm khớp (toạ độ chuẩn hoá 0–1) để chấm điểm khớp dáng.
4. Lưu cả ảnh thumbnail + outline + landmarks + tag vào IndexedDB.
5. Fallback khi nền quá rối, tách viền xấu: hiển thị dạng **người que** (skeleton) thay cho viền.

### 4.2 Camera + overlay
- Camera sau, xin độ phân giải cao nhất (`ideal: 4096x3072`).
- Overlay: kéo để di chuyển, pinch để phóng to/thu nhỏ, chỉnh độ mờ, **lật gương** dáng, đổi tỉ lệ khung 3:4 / 9:16 / 1:1.
- Lưới 1/3, đường chân trời (DeviceOrientation) để giữ máy thẳng.
- Chụp: nút bấm, hẹn giờ 3/5/10s, chụp liên tiếp (burst 3 tấm).
- Lưu ảnh: IndexedDB + nút "Lưu vào Ảnh" qua Web Share API (trên iOS sẽ mở share sheet → Save Image).

### 4.3 Chấm điểm khớp dáng + tự chụp
- Chạy `PoseLandmarker` (bản lite) trên camera ~10–15 fps.
- Chuẩn hoá hai bộ khung (gốc ở hông, scale theo chiều dài thân) → so **góc** các đoạn: vai–khuỷu, khuỷu–cổ tay, hông–gối, gối–cổ chân, độ nghiêng thân, hướng đầu.
- Cộng thêm điểm vị trí/kích thước người trong khung so với viền.
- Điểm 0–100; viền đổi màu đỏ → vàng → xanh. Xanh liên tục ~1s → **tự chụp burst**.
- Gợi ý bằng chữ: "giơ tay trái cao hơn", "bước sang phải".

### 4.4 Gợi ý dáng theo cảnh (AI)
Input: ảnh cảnh (resize ~1024px trước khi gửi), hoặc text mô tả, hoặc tên địa danh.

Claude trả về JSON có cấu trúc (structured output), ví dụ:
```json
{
  "scene": "bậc thang đá trước nhà thờ, nắng chiều",
  "landmark": "Nhà thờ Đức Bà Sài Gòn",
  "lighting": { "time": "golden_hour", "direction": "back_left" },
  "elements": ["stairs", "arch", "pillars"],
  "pose_tags": ["sitting_on_stairs", "walking_away", "leaning_on_pillar"],
  "search_queries": ["woman sitting on church stairs travel photo"],
  "tips_vi": ["Đứng lệch trái để tránh ngược sáng", "Hạ máy ngang hông, chụp hắt lên"]
}
```
Sau đó:
1. Xếp hạng dáng trong **thư viện riêng** theo `pose_tags` (khớp tag).
2. Dùng `search_queries` gọi Unsplash/Pexels lấy thêm ảnh thật → tách viền ngay trên máy.
3. Hiện lưới gợi ý; chạm vào → mở camera kèm viền + mẹo chụp.

Model: mặc định `claude-opus-5-5`. Có thể đổi sang `claude-haiku-5-5` nếu muốn rẻ hơn nhiều (xem mục Chi phí).

### 4.5 Địa danh gần đây
- Geolocation → Overpass API (OpenStreetMap, miễn phí) tìm `tourism=attraction`, `historic=*`, `viewpoint` trong bán kính ~500m.
- Chọn địa danh → sinh query tìm ảnh "<địa danh> photo pose" + dùng làm ngữ cảnh cho Claude.

### 4.6 Thư viện dáng riêng
- Import nhiều ảnh một lúc (screenshot Pinterest/Instagram, ảnh từng chụp).
- Tự tách viền + tự gắn tag (dùng Claude: đứng/ngồi/đi bộ/dựa tường/quay lưng/cặp đôi/nhóm, đạo cụ: mũ, ô, vali…).
- Lọc theo tag, số người (1/2/nhóm), yêu thích.

### 4.7 Chế độ chuyến đi (offline)
- Tạo chuyến đi: danh sách điểm đến (vd: Đà Lạt → Hồ Xuân Hương, Ga Đà Lạt…).
- Bấm "Chuẩn bị offline": với từng điểm, gọi AI + tìm ảnh + tách viền, lưu tất cả vào máy.
- Service worker cache app + file model MediaPipe (~10–30MB) → ra nước ngoài không mạng vẫn dùng overlay + chấm điểm.

### 4.8 Chế độ người chụp hộ
- Khi đưa máy cho bạn đồng hành/người lạ: màn hình gọn, viền to, 1 dòng hướng dẫn ("Hạ máy ngang ngực, để người ở 1/3 bên phải"), nút chụp to.

---

## 5. Data model (IndexedDB)

```ts
Pose      { id, platform: 'xiaohongshu'|'douyin'|'tiktok'|'instagram'|'unsplash'|'other',
            imageThumb: Blob, outlineSvg: string, landmarks: number[people][33][3], people: number,
            tags: string[], destinationId?, favorite: boolean,
            engagement?: { likes, saves, comments, shares }, postedAt?, viralScore?: number,
            caption?, author?, createdAt }
Trip      { id, name, startDate, destinations: Destination[] }
Destination { id, tripId, name, lat?, lng?, sceneAnalysis?: SceneJSON, poseIds: string[] }
Shot      { id, poseId?, destinationId?, photo: Blob, matchScore?, takenAt }
```

---

## 6. Cấu trúc thư mục dự kiến

```
camera-wizard/
├─ apps/web/                 # PWA
│  ├─ src/camera/            # getUserMedia, capture, timer
│  ├─ src/overlay/           # vẽ viền, gesture kéo/pinch/lật
│  ├─ src/vision/            # MediaPipe: segment → outline, landmarks, matching
│  ├─ src/library/           # thư viện dáng, import, tag
│  ├─ src/suggest/           # gọi API phân tích cảnh, xếp hạng
│  ├─ src/trips/             # chuyến đi, prefetch offline
│  └─ src/db/                # Dexie schema
└─ apps/worker/              # Cloudflare Worker: analyze-scene, search-photos, nearby
```

---

## 7. Lộ trình (làm cùng Claude Code, part-time)

| Giai đoạn | Nội dung | Ước lượng | Dùng được khi xong? |
|---|---|---|---|
> Bảng này đã được cập nhật theo mục 0 (chụp bằng Camera gốc + upload).

| Giai đoạn | Nội dung | Ước lượng | Dùng được khi xong? |
|---|---|---|---|
| 0. Nền móng | Vite/React/PWA, cài lên màn hình chính, chạy offline, tự host model MediaPipe, deploy; thử PiP | 1 ngày | — |
| 1. Thư viện dáng | Import ảnh (screenshot 小红书), crop, tách viền, khung xương, tag 1 người/cặp đôi/địa điểm, fallback skeleton | 2–3 ngày | ✅ Xem mẫu được |
| 2. Thẻ hướng dẫn | Mẫu + viền, hướng dẫn cho người chụp (ống kính, độ cao, bố cục) và người tạo dáng | 1–2 ngày | ✅ Đủ dùng cho chuyến đi |
| 3. Chấm ảnh đã chụp | Upload ảnh từ Camera gốc → so khung xương (1–2 người) → điểm, đè viền, chỉ khớp lệch | 2–3 ngày | ✅ Hơn SnapPose |
| 4. Chuyến đi | Địa điểm Thành Đô/Trùng Khánh soạn sẵn, gom dáng theo địa điểm, đọc GPS từ ảnh, nhật ký ảnh | 1–2 ngày | ✅ |
| 5. AI | Worker + Claude: phân tích ảnh cảnh, nhận xét ảnh đã chụp, tự gắn tag khi import | 2–3 ngày | ✅ |
| 6. Phụ + hoàn thiện | Căn khung trực tiếp trong app, cửa sổ PiP (nếu iOS cho), test ngoài đường thật | 2 ngày | ✅ |

**Tổng: ~2–3 tuần part-time.** Bay còn lâu nên làm đủ cả 6 giai đoạn, và có thời gian đi chụp thử ở Việt Nam trước.

---

## 8. Chi phí ước tính

| Hạng mục | Chi phí |
|---|---|
| Hosting (Cloudflare Pages + Workers) | $0 (free tier) |
| MediaPipe (chạy trên máy) | $0 |
| Unsplash / Pexels API | $0 (free tier, đủ cho cá nhân) |
| OpenStreetMap Overpass | $0 |
| Claude API — `claude-opus-5-5` ($4/$20 mỗi 1M token vào/ra) | ~2–4 cent/lần phân tích cảnh → chuyến 10 ngày × ~20 lần/ngày ≈ **$5–8** |
| Claude API — nếu đổi sang `claude-haiku-5-5` ($0.10/$0.50) | ~0.1 cent/lần → gần như $0 |
| Apple Developer | $0 (PWA không cần) |

---

## 9. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Ảnh chụp qua web trên iPhone kém hơn camera gốc | Test ở Giai đoạn 0; dùng chế độ "Hướng dẫn"; hoặc Giai đoạn 7 port native |
| Máy cũ chạy pose realtime bị lag | Model lite, giảm fps, chỉ bật chấm điểm khi cần |
| Tách viền xấu khi ảnh mẫu nền rối / nhiều người chồng nhau | Fallback skeleton; cho chọn ảnh khác |
| Mạng yếu ở nước ngoài | Chế độ chuyến đi tải sẵn; overlay + chấm điểm chạy offline |
| Bản quyền ảnh mẫu | Chỉ dùng cá nhân, không public; giữ credit tác giả Unsplash/Pexels |
| Lộ API key | Key chỉ nằm trong Worker; Worker yêu cầu passcode cá nhân |

---

## 10. Cần bạn chốt trước khi code

Đã chốt: iPhone · người đi cùng chụp · Thành Đô & Trùng Khánh tháng 11–12, còn lâu mới bay · 1 người + cặp đôi · chỉ PWA, chụp bằng Camera gốc rồi upload · eSIM Trung Quốc.

Cần chuẩn bị khi tới Giai đoạn 0 và Giai đoạn 5:
1. Tài khoản **Cloudflare** (miễn phí) để host app + Worker.
2. **API key Anthropic** (Claude) để dùng phần AI. Chi phí khoảng vài USD mỗi chuyến.
