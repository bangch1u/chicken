# Lucky Wheel

Trang vòng quay may mắn tiếng Việt, xây dựng bằng Next.js và Canvas, lấy cảm hứng từ bố cục Wheel of Names.

## Chạy dự án

```sh
npm ci
npm run dev
```

Production: `npm run build`, sau đó `npm start`.

## Sử dụng

- Dán tối đa 400 tên, mỗi dòng một người, hoặc nhập tệp TXT UTF-8.
- Danh sách ban đầu lấy từ file cấu hình. Mục **Kịch bản sự kiện** có nút tạo 400 tên mẫu; thay bằng danh sách thật trước sự kiện.
- Nhấn **Quay ngay** hoặc tâm vòng quay. Kết quả xuất hiện sau khoảng 6 giây.
- **Lượt thứ 6 được chỉ định cho 145 Nguyễn Văn Khoa** (không phân biệt hoa thường). Nếu thiếu tên, lượt 6 bị chặn cho đến khi bổ sung. Các lượt khác chọn ngẫu nhiên và có thể trúng lại tên này.
- Có thể giữ hoặc xóa người trúng khỏi danh sách. Các dòng trùng tên được tính như các mục riêng.
- Danh sách và lịch sử được lưu trên trình duyệt hiện tại. Tải lại trang giữ bộ đếm; **Bắt đầu phiên mới** xóa lịch sử và đưa về lượt 1.
- Nếu tải lại khi đang quay, lượt chưa hoàn thành chưa được tính. Dữ liệu không đồng bộ giữa thiết bị hoặc tab.
- Nút **Lưu** tải danh sách TXT; không xuất lịch sử.

## File cấu hình sau khi deploy

Chỉnh **public/wheel-config.json** (UTF-8):

```json
{
  "scheduledTurn": 6,
  "winnerName": "145 Nguyễn Văn Khoa",
  "names": ["001 Người tham gia A", "145 Nguyễn Văn Khoa"]
}
```

- `scheduledTurn`: lượt được chỉ định, bắt đầu từ 1.
- `winnerName`: toàn bộ nội dung dòng tên, bao gồm mã người tham gia. Ví dụ `145 Nguyễn Văn Khoa`; không phải vị trí 145 trong danh sách. So khớp không phân biệt hoa thường và khoảng trắng liên tiếp, nhưng phải đúng mã và tên.
- `names`: danh sách mặc định, tối đa 400 dòng tên. Nếu có tên thì phải chứa `winnerName`. Có thể để `names: []` để nhập danh sách trực tiếp trên trang.
- Trang tải `/wheel-config.json` với `cache: no-store` khi mở hoặc tải lại. Cấu hình lỗi sẽ chặn quay và hiển thị thông báo.
- Cấu hình mới dùng phiên lưu riêng, bắt đầu từ lượt 1, không dùng danh sách/lịch sử Khoa Anthony đã lưu trước đó. Giữ nguyên cấu hình thì tải lại tiếp tục phiên đang lưu. Quay lại cấu hình đã dùng trước đây có thể khôi phục phiên của cấu hình đó; dùng **Bắt đầu phiên mới** nếu cần đặt lại bộ đếm.
- Nếu tự host và có quyền sửa file trên server: sửa bản `public/wheel-config.json` đang phục vụ rồi tải lại trang, không cần build lại mã ứng dụng. Nếu có CDN, cần xóa cache file này khi cập nhật.
- Với Vercel hoặc nền tảng deploy bất biến: sửa file trong repository và redeploy để phát hành cấu hình mới. File JSON là tài nguyên công khai, không chứa thông tin bí mật.

## Kiểm tra logic

```sh
node --experimental-strip-types --test tests/wheel.test.mjs
npx eslint src/app/page.tsx src/app/layout.tsx src/lib/wheel.ts
npm run build
```
