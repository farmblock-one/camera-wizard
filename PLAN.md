# Camera Wizard — Plan build app gợi ý dáng chụp (kiểu SnapPose) cho du lịch cá nhân

> Mục tiêu: một app chạy trên điện thoại, đứng ở đâu cũng gợi ý được dáng chụp hợp cảnh,
> rồi hiện **viền dáng (outline) đè lên camera** để người chụp/người được chụp căn theo.
> Dùng cá nhân, không phát hành lên store.

---

## 0. Bối cảnh chuyến đi đầu tiên (ưu tiên cao nhất, ghi đè các mục bên dưới nếu mâu thuẫn)

- **Máy:** iPhone. **Người chụp:** người đi cùng. **Kiểu ảnh:** 1 người + cặp đôi.
- **Điểm đến:** Thành Đô & Trùng Khánh (Trung Quốc), tháng 11–12.

### 0.1 Đi Trung Quốc ảnh hưởng gì
| Vấn đề | Hệ quả | Cách xử lý |
|---|---|---|
| Tường lửa (GFW) | Mạng Trung Quốc (Wi-Fi khách sạn, SIM nội địa) **không vào được** Claude API, Google (MediaPipe model mặc định tải từ `storage.googleapis.com`), và có thể chặn `*.pages.dev` | **Offline-first bắt buộc**: mọi thứ tải sẵn ở Việt Nam trước khi bay |
| Model MediaPipe tải từ CDN Google | Không tải được ở TQ | Tự host file `.wasm` + `.task` cùng app, precache bằng service worker |
| Font/CDN bên ngoài | Lỗi/treo | Không dùng Google Fonts / CDN; bundle tất cả |
| iOS xoá cache web | Mất dữ liệu | **Bắt buộc "Add to Home Screen"**; app cài trên màn hình chính không bị iOS xoá storage sau 7 ngày |
| eSIM roaming quốc tế | Dữ liệu đi qua gateway nước ngoài nên thường vẫn gọi được API | Coi là “có thì tốt”, app không phụ thuộc |

→ Phân tích cảnh bằng AI chuyển sang làm **trước chuyến đi**: cho AI phân tích ảnh tham khảo của từng địa điểm, rồi lưu sẵn kết quả + dáng vào máy.

### 0.2 Nguồn dáng tốt nhất cho Thành Đô/Trùng Khánh: Xiaohongshu (小红书)
- Ảnh "打卡" (check-in) tại đúng các điểm này nhiều hơn Unsplash rất nhiều.
- Luồng: chụp màn hình bài 小红书 → import vào app → **công cụ crop** (bỏ UI/chữ) → tách viền tự động.
- Unsplash/Pexels hạ xuống nguồn phụ.

### 0.3 Danh sách địa điểm soạn sẵn (thay cho tính năng GPS)
**Thành Đô:** Khoan Trách hạng tử (宽窄巷子), Cẩm Lý (锦里), Vũ Hầu Từ (武侯祠), Xuân Hy Lộ/Thái Cổ Lý (春熙路/太古里) + gấu trúc leo tòa IFS, Văn Thù Viện (文殊院), Cơ sở gấu trúc (熊猫基地), cầu An Thuận về đêm (安顺廊桥), Nhân Dân Công Viên quán trà (人民公园), Đô Giang Yển / Thanh Thành Sơn.
**Trùng Khánh:** Hồng Nhai Động về đêm (洪崖洞), ga monorail xuyên nhà Lý Tử Bá (李子坝), Giải Phóng Bi (解放碑), cáp treo sông Trường Giang (长江索道), Từ Khí Khẩu (磁器口), Thập Bát Thê (十八梯), công viên Nga Lĩnh / Nhị Hán (鹅岭二厂), Khôi Tinh Lâu (魁星楼), Triều Thiên Môn / Lai Phúc Sĩ (朝天门/来福士).

Mỗi địa điểm: ~10–20 dáng (1 người + cặp đôi), mẹo góc máy, giờ đẹp. Đi tháng 11–12 thường trời âm u/sương, ánh sáng dịu, mặc áo khoác.

### 0.4 iPhone + ảnh đêm: điểm quyết định PWA hay native
- Camera qua web trên iPhone **không có Night mode, Smart HDR, Deep Fusion**. Trùng Khánh nổi tiếng chụp đêm (Hồng Nhai Động, đèn neon), nên đây là rủi ro lớn nhất.
- Giai đoạn 0 sẽ chụp thử ban ngày **và** ban đêm trên chính iPhone của bạn, so với camera gốc.
- Nếu không đạt thì làm app native iOS (Expo + `react-native-vision-camera`, giữ lại logic TypeScript). Cần một trong hai:
  - Có máy Mac (Xcode, dùng Apple ID miễn phí, nhưng **phải ký lại app mỗi 7 ngày**, bất tiện nếu chuyến đi dài hơn 7 ngày), hoặc
  - Apple Developer $99/năm (cài qua TestFlight, không cần Mac nếu build bằng EAS).
- Phương án dự phòng khi vẫn dùng PWA: chế độ "Xem mẫu" (người chụp xem dáng + viền, rồi chụp đêm bằng camera gốc).

### 0.5 Thứ tự ưu tiên mới cho chuyến này
1. **Giai đoạn 0:** spike chụp thử ngày/đêm trên iPhone, chốt PWA hay native.
2. **Overlay + chế độ người chụp hộ** (người đi cùng là người cầm máy): viền to, mẹo góc máy 1 dòng, nút chụp to.
3. **Thư viện + import từ 小红书** (crop, tag `1 người` / `cặp đôi`, tag theo địa điểm).
4. **Chế độ chuyến đi Thành Đô – Trùng Khánh, offline hoàn toàn** (danh sách địa điểm ở 0.3).
5. **Cặp đôi:** viền 2 người; khi cả hai cùng vào hình thì đặt tripod + hẹn giờ + tự chụp khi cả 2 khớp dáng (`numPoses: 2`).
6. **AI phân tích cảnh:** chạy ở nhà trước chuyến đi; tại chỗ chỉ dùng khi có eSIM roaming.
- Hoãn: tìm địa danh qua GPS/Overpass, Unsplash/Pexels.

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
Pose      { id, source: 'import'|'unsplash'|'pexels', imageThumb: Blob, outlineSvg: string,
            landmarks: number[33][3], people: number, tags: string[], favorite: boolean,
            credit?: string, createdAt }
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
| 0. Spike | Khung Vite/React/PWA, mở camera, chụp thử, **đo chất lượng ảnh trên máy bạn**, deploy lên Pages | 0.5 ngày | — |
| 1. MVP overlay | Import 1 ảnh mẫu → tách viền → đè lên camera (kéo/pinch/mờ/lật) → chụp, hẹn giờ, lưu | 2–3 ngày | ✅ Đủ dùng cho chuyến đi |
| 2. Thư viện dáng | Import hàng loạt, tag, lọc, yêu thích, fallback skeleton | 2 ngày | ✅ |
| 3. Gợi ý AI | Worker + Claude phân tích cảnh/text, Unsplash/Pexels, xếp hạng, mẹo chụp | 2–3 ngày | ✅ Ngang SnapPose |
| 4. Khớp dáng | Pose realtime, chấm điểm, đổi màu viền, tự chụp | 2–3 ngày | ✅ Hơn SnapPose |
| 5. Địa danh + Offline | GPS + Overpass, chế độ chuyến đi, prefetch, cache model | 2 ngày | ✅ |
| 6. Hoàn thiện | Chế độ người chụp hộ, test ngoài đường thật, sửa lỗi hiệu năng | 1–2 ngày | ✅ |
| 7. (Tuỳ chọn) Native | Port camera sang Expo nếu ảnh iPhone qua web không đạt | 3–5 ngày | — |

**Tổng: ~2–3 tuần part-time.** Nếu chuyến đi gần, làm xong Giai đoạn 1–2 là đã mang đi dùng được.

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

Đã chốt: iPhone · người đi cùng chụp · Thành Đô & Trùng Khánh tháng 11–12 · 1 người + cặp đôi.

Còn lại:
1. **Ngày bay cụ thể?** Từ đó cắt scope: < 2 tuần thì chỉ làm mục 1–4 ở 0.5.
2. Có **máy Mac** không? Có sẵn sàng trả **$99 Apple Developer** nếu phải làm native không?
3. Có mua **eSIM roaming** quốc tế không? (quyết định có dùng AI tại chỗ được hay không)
4. OK với chi phí Claude API khoảng vài USD (phân tích trước chuyến) không?
