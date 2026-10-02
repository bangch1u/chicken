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
- Danh sách ban đầu gồm 12 tên minh họa. Mục **Kịch bản sự kiện** có nút tạo 400 tên mẫu; thay bằng danh sách thật trước sự kiện.
- Nhấn **Quay ngay** hoặc tâm vòng quay. Kết quả xuất hiện sau khoảng 6 giây.
- **Lượt thứ 6 được chỉ định cho Khoa Anthony** (không phân biệt hoa thường). Nếu thiếu tên, lượt 6 bị chặn cho đến khi bổ sung. Các lượt khác chọn ngẫu nhiên và có thể trúng lại tên này.
- Có thể giữ hoặc xóa người trúng khỏi danh sách. Các dòng trùng tên được tính như các mục riêng.
- Danh sách và lịch sử được lưu trên trình duyệt hiện tại. Tải lại trang giữ bộ đếm; **Bắt đầu phiên mới** xóa lịch sử và đưa về lượt 1.
- Nếu tải lại khi đang quay, lượt chưa hoàn thành chưa được tính. Dữ liệu không đồng bộ giữa thiết bị hoặc tab.
- Nút **Lưu** tải danh sách TXT; không xuất lịch sử.

## Kiểm tra logic

```sh
node --experimental-strip-types --test tests/wheel.test.mjs
npx eslint src/app/page.tsx src/app/layout.tsx src/lib/wheel.ts
npm run build
```
