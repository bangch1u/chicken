export const defaults = [
  "Minh Anh",
  "Hoàng Nam",
  "Ngọc Linh",
  "Tuấn Kiệt",
  "Thảo Nhi",
  "Khoa Anthony",
  "Gia Hân",
  "Đức Huy",
  "Bảo Ngọc",
  "Quang Minh",
  "Hà My",
  "Phương Anh",
];
export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}
export function pickWinner(names: string[], turn: number): number {
  if (!names.length || names.length > 400)
    throw new Error("Danh sách phải có từ 1 đến 400 người.");
  if (turn === 6) {
    const index = names.findIndex(
      (name) => name.toLocaleLowerCase() === "khoa anthony",
    );
    if (index < 0)
      throw new Error(
        "Thêm Khoa Anthony vào danh sách để thực hiện lượt quay thứ 6.",
      );
    return index;
  }
  const limit = Math.floor(0x100000000 / names.length) * names.length;
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return value % names.length;
}
export function targetRotation(
  current: number,
  index: number,
  count: number,
): number {
  const target = (360 - ((index + 0.5) * 360) / count) % 360;
  return current + 360 * 7 + ((target - (current % 360) + 360) % 360);
}
