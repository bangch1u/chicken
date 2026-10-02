export type WheelConfig = {
  scheduledTurn: number;
  winnerName: string;
  names: string[];
};

function normalizeName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

export function validateConfig(value: unknown): WheelConfig {
  const config = value as Partial<WheelConfig> | null;
  if (!config || !Number.isSafeInteger(config.scheduledTurn) || (config.scheduledTurn ?? 0) < 1 ||
      typeof config.winnerName !== "string" || !config.winnerName.trim() || /[\r\n]/.test(config.winnerName) ||
      !Array.isArray(config.names) || config.names.length > 400 ||
      !config.names.every(name => typeof name === "string" && name.trim() && !/[\r\n]/.test(name))) {
    throw new Error("wheel-config.json không hợp lệ: cần scheduledTurn > 0, winnerName và tối đa 400 tên trong names.");
  }
  const result = {
    scheduledTurn: config.scheduledTurn!,
    winnerName: config.winnerName.trim(),
    names: config.names.map(name => name.trim()),
  };
  return result;
}

export function configStorageKey(config: WheelConfig): string {
  return 'lucky-wheel-v2:' + JSON.stringify(config);
}

export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}
export function pickWinner(names: string[], turn: number, config: WheelConfig): number {
  if (!names.length || names.length > 400)
    throw new Error("Danh sách phải có từ 1 đến 400 người.");
  if (turn === config.scheduledTurn) {
    const index = names.findIndex(
      (name) => normalizeName(name) === normalizeName(config.winnerName),
    );
    if (index >= 0) return index;
  }
  const candidates = names
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => turn >= config.scheduledTurn || normalizeName(name) !== normalizeName(config.winnerName));
  if (!candidates.length) {
    throw new Error("Hãy thêm người tham gia khác để quay các lượt trước lượt được chỉ định.");
  }
  const limit = Math.floor(0x100000000 / candidates.length) * candidates.length;
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return candidates[value % candidates.length].index;
}
export function targetRotation(
  current: number,
  index: number,
  count: number,
): number {
  const target = (360 - ((index + 0.5) * 360) / count) % 360;
  return current + 360 * 7 + ((target - (current % 360) + 360) % 360);
}
