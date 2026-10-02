"use client";
/* Browser persistence is synchronized after hydration; storage failures update the notice. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Shuffle,
  Trophy,
  Users,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Maximize,
  X,
} from "lucide-react";
import { defaults, parseNames, pickWinner, targetRotation } from "@/lib/wheel";

const colors = [
  "#7055da",
  "#f2b94d",
  "#ea7992",
  "#55b5a3",
  "#709ce0",
  "#ac7bce",
];

type Result = { name: string; turn: number };

export default function Home() {
  const [text, setText] = useState(defaults.join("\n"));
  const [results, setResults] = useState<Result[]>([]);
  const [tab, setTab] = useState("names");
  const [busy, setBusy] = useState(false);
  const [angle, setAngle] = useState(0);
  const [winner, setWinner] = useState<Result | null>(null);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);

  const canvas = useRef<HTMLCanvasElement>(null),
    input = useRef<HTMLInputElement>(null),
    close = useRef<HTMLButtonElement>(null),
    spinRef = useRef<HTMLButtonElement>(null);
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const names = parseNames(text),
    valid = names.length > 0 && names.length <= 400;

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("lucky-wheel-v1") || "null",
      );
      if (
        saved &&
        typeof saved.text === "string" &&
        Array.isArray(saved.results) &&
        saved.results.every(
          (r: Result, i: number) =>
            r && typeof r.name === "string" && r.turn === i + 1,
        )
      ) {
        setText(saved.text);
        setResults(saved.results);
      }
    } catch {
      setNotice("Không thể đọc dữ liệu đã lưu.");
    }
    setReady(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "lucky-wheel-v1",
          JSON.stringify({ text, results }),
        );
      } catch {
        setNotice(
          "Không thể tự động lưu. Hãy tải danh sách để giữ lại dữ liệu.",
        );
      }
  }, [text, results, ready]);

  useEffect(() => {
    if (winner) close.current?.focus();
  }, [winner]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const entries = parseNames(text).slice(0, 400),
      count = entries.length || 1,
      step = (Math.PI * 2) / count;
    ctx.clearRect(0, 0, 1000, 1000);
    for (let i = 0; i < count; i++) {
      const start = i * step - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(500, 500);
      ctx.arc(500, 500, 490, start, start + step);
      ctx.closePath();
      ctx.fillStyle = entries.length ? colors[i % colors.length] : "#e9e4f2";
      ctx.fill();
      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = count > 80 ? 0.5 : 2;
      ctx.stroke();
      if (entries[i]) {
        ctx.save();
        ctx.translate(500, 500);
        ctx.rotate(start + step / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = `600 ${Math.max(5, Math.min(26, 1900 / count))}px var(--font-be-vietnam-pro), "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.fillText(entries[i], 460, 0, 340);
        ctx.restore();
      }
    }
  }, [text, fontLoaded]);

  function spin() {
    if (lock.current || !ready || !valid || winner) return;
    const turn = results.length + 1;
    let index: number;
    try {
      index = pickWinner(names, turn);
    } catch (error) {
      setNotice((error as Error).message);
      return;
    }
    lock.current = true;
    setBusy(true);
    setNotice("");
    setAngle(targetRotation(angle, index, names.length));
    timer.current = setTimeout(() => {
      const result = { name: names[index], turn };
      setResults((previous) => [...previous, result]);
      setWinner(result);
      setBusy(false);
      lock.current = false;
    }, 6200);
  }

  function dismiss(remove = false) {
    if (remove && winner) {
      const next = [...names];
      next.splice(next.indexOf(winner.name), 1);
      setText(next.join("\n"));
    }
    setWinner(null);
    spinRef.current?.focus();
  }

  function shuffle() {
    const next = [...names];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setText(next.join("\n"));
  }

  function save() {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "danh-sach.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <header>
        <Link className="brand" href="/">
          <span className="brand-icon">✳</span>
          <div>
            lucky<span>wheel</span>
            <small>VÒNG QUAY MAY MẮN</small>
          </div>
        </Link>
        <nav>
          <button disabled={busy} onClick={() => input.current?.click()}>
            <Upload size={16} />
            Nhập danh sách
          </button>
          <button onClick={save}>
            <Download size={16} />
            Lưu
          </button>
          <button
            aria-label="Toàn màn hình"
            onClick={() => {
              const p = document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen();
              p?.catch(() =>
                setNotice("Trình duyệt không hỗ trợ toàn màn hình."),
              );
            }}
          >
            <Maximize size={17} />
          </button>
        </nav>
      </header>
      <main>
        <div className="heading">
          <div>
            <div className="eyebrow">● MỘT VÒNG QUAY, NGÀN NIỀM VUI</div>
            <h1>Ai sẽ là người may mắn?</h1>
            <p>
              Thêm những cái tên. Quay một vòng. Đón điều bất ngờ.
            </p>
          </div>
          <span className="badge">
            <Users size={16} />
            Lên đến 400 người
          </span>
        </div>
        <div className="workspace">
          <section className="wheel-panel">
            <div className="wheel-top">
              <span>● Sẵn sàng cho khoảnh khắc của bạn</span>
              <div>
                LƯỢT QUAY{" "}
                <b>{String(results.length + 1).padStart(2, "0")}</b>
              </div>
            </div>
            <div className="wheel-stage">
              <div className="wheel-ring">
                <canvas
                  ref={canvas}
                  width={1000}
                  height={1000}
                  style={{ transform: `rotate(${angle}deg)` }}
                  aria-label={`Vòng quay gồm ${names.length} người`}
                />
                <button
                  className="wheel-center"
                  onClick={spin}
                  disabled={busy || !valid || !ready}
                  aria-label="Quay vòng quay"
                >
                  <Sparkles size={25} />
                  <span>QUAY</span>
                </button>
              </div>
              <div className="pointer" />
            </div>
            <button
              ref={spinRef}
              className="primary"
              onClick={spin}
              disabled={busy || !valid || !ready}
            >
              <Sparkles size={18} />
              {busy ? "Đang tìm người may mắn…" : "Quay ngay"}
              <span>↗</span>
            </button>
            <p className="hint">
              Nhấn nút hoặc tâm vòng quay để bắt đầu
            </p>
          </section>
          <aside>
            <div className="tabs">
              <button
                className={tab === "names" ? "active" : ""}
                onClick={() => setTab("names")}
              >
                <Users size={17} />
                Danh sách <b>{names.length}</b>
              </button>
              <button
                className={tab === "results" ? "active" : ""}
                onClick={() => setTab("results")}
              >
                <Trophy size={17} />
                Kết quả <b>{results.length}</b>
              </button>
            </div>
            {tab === "names" ? (
              <>
                <div className="entry-heading">
                  <h2>Những người tham gia</h2>
                  <p>
                    Mỗi dòng là một người. May mắn dành cho tất cả!
                  </p>
                </div>
                <div className="tools">
                  <button disabled={busy || !valid} onClick={shuffle}>
                    <Shuffle size={14} />
                    Trộn tên
                  </button>
                  <button
                    disabled={busy || !valid}
                    onClick={() =>
                      setText(
                        [...names]
                          .sort((a, b) => a.localeCompare(b, "vi"))
                          .join("\n"),
                      )
                    }
                  >
                    A–Z Sắp xếp
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => input.current?.click()}
                  >
                    <Upload size={14} />
                    Nhập
                  </button>
                </div>
                <textarea
                  aria-label="Danh sách người tham gia"
                  disabled={busy}
                  spellCheck={false}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tên, mỗi người một dòng…"
                />
                <div className="entry-footer">
                  <span>
                    ●{" "}
                    {ready
                      ? "Tự động lưu trên thiết bị"
                      : "Đang tải…"}
                  </span>
                  <span>{names.length}/400</span>
                </div>
                <div className="tip">
                  ⓘ{" "}
                  <span>
                    Bạn có thể dán trực tiếp một cột tên từ
                    Excel hoặc nhập tệp .txt.
                  </span>
                </div>
              </>
            ) : (
              <div className="results">
                <h2>Khoảnh khắc may mắn</h2>
                {results.length ? (
                  [...results].reverse().map((r) => (
                    <div className="result" key={r.turn}>
                      <span>{String(r.turn).padStart(2, "0")}</span>
                      <strong>{r.name}</strong>
                      <Trophy size={16} />
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <Trophy size={38} />
                    <p>
                      Người may mắn đầu tiên
                      <br />
                      sẽ xuất hiện ở đây.
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
        <div role="status">
          {(notice || !valid) && (
            <p className="notice">
              {notice ||
                (names.length > 400
                  ? "Danh sách vượt quá 400 người. Hãy giảm số tên trước khi quay."
                  : "Thêm ít nhất một tên để bắt đầu.")}
            </p>
          )}
        </div>
        <footer>
          <span>
            <Sparkles size={15} />
            Một chút hồi hộp. Một niềm vui lớn.
          </span>
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Bắt đầu lại từ lượt 1 và xóa lịch sử kết quả?",
                )
              ) {
                setResults([]);
                setAngle(0);
                setNotice("Đã bắt đầu phiên mới.");
              }
            }}
          >
            <RotateCcw size={14} />
            Bắt đầu phiên mới
          </button>
        </footer>
        <details>
       
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm("Thay danh sách hiện tại bằng 400 tên mẫu?")
              )
                setText(
                  Array.from({ length: 400 }, (_, i) =>
                    i === 5
                      ? "Khoa Anthony"
                      : `Người tham gia ${String(i + 1).padStart(3, "0")}`,
                  ).join("\n"),
                );
            }}
          >
            Dùng danh sách mẫu 400 người
          </button>
        </details>
      </main>
      <input
        hidden
        type="file"
        accept=".txt,text/plain"
        ref={input}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 1000000) {
            setNotice("Vui lòng chọn tệp dưới 1 MB.");
            return;
          }
          try {
            const value = await file.text();
            if (!lock.current) setText(value.replace(/^\uFEFF/, ""));
          } catch {
            setNotice("Không thể đọc tệp.");
          }
        }}
      />
      {winner && (
        <div className="backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") dismiss();
              if (e.key === "Tab") {
                const buttons = Array.from(
                  e.currentTarget.querySelectorAll("button"),
                );
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              ref={close}
              className="close"
              aria-label="Đóng"
              onClick={() => dismiss()}
            >
              <X />
            </button>
            <div className="trophy">🏆</div>
            <div className="eyebrow">CHÚC MỪNG NGƯỜI MAY MẮN</div>
            <h2 id="winner-title">{winner.name}</h2>
            <p>Người chiến thắng ở lượt quay #{winner.turn}</p>
            <button className="primary" onClick={() => dismiss()}>
              Tiếp tục quay
              <Sparkles size={18} />
            </button>
            <button className="remove" onClick={() => dismiss(true)}>
              Xóa tên khỏi danh sách
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
