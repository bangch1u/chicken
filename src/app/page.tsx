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
  const canvas = useRef<HTMLCanvasElement>(null),
    input = useRef<HTMLInputElement>(null),
    close = useRef<HTMLButtonElement>(null),
    spinRef = useRef<HTMLButtonElement>(null);
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const names = parseNames(text),
    valid = names.length > 0 && names.length <= 400;
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
      setNotice("KhĂ´ng thá»ƒ Ä‘á»c dá»¯ liá»‡u Ä‘Ă£ lÆ°u.");
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
          "KhĂ´ng thá»ƒ tá»± Ä‘á»™ng lÆ°u. HĂ£y táº£i danh sĂ¡ch Ä‘á»ƒ giá»¯ láº¡i dá»¯ liá»‡u.",
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
        ctx.font = `600 ${Math.max(5, Math.min(26, 1900 / count))}px Arial`;
        ctx.fillText(entries[i], 460, 0, 340);
        ctx.restore();
      }
    }
  }, [text]);
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
          <span className="brand-icon">âœ³</span>
          <div>
            lucky<span>wheel</span>
            <small>VĂ’NG QUAY MAY Máº®N</small>
          </div>
        </Link>
        <nav>
          <button disabled={busy} onClick={() => input.current?.click()}>
            <Upload size={16} />
            Nháº­p danh sĂ¡ch
          </button>
          <button onClick={save}>
            <Download size={16} />
            LÆ°u
          </button>
          <button
            aria-label="ToĂ n mĂ n hĂ¬nh"
            onClick={() => {
              const p = document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen();
              p.catch(() =>
                setNotice("TrĂ¬nh duyá»‡t khĂ´ng há»— trá»£ toĂ n mĂ n hĂ¬nh."),
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
            <div className="eyebrow">â— Má»˜T VĂ’NG QUAY, NGĂ€N NIá»€M VUI</div>
            <h1>Ai sáº½ lĂ  ngÆ°á»i may máº¯n?</h1>
            <p>
              ThĂªm nhá»¯ng cĂ¡i tĂªn. Quay má»™t vĂ²ng. ÄĂ³n Ä‘iá»u báº¥t ngá».
            </p>
          </div>
          <span className="badge">
            <Users size={16} />
            LĂªn Ä‘áº¿n 400 ngÆ°á»i
          </span>
        </div>
        <div className="workspace">
          <section className="wheel-panel">
            <div className="wheel-top">
              <span>â— Sáºµn sĂ ng cho khoáº£nh kháº¯c cá»§a báº¡n</span>
              <div>
                LÆ¯á»¢T QUAY{" "}
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
                  aria-label={`VĂ²ng quay gá»“m ${names.length} ngÆ°á»i`}
                />
                <button
                  className="wheel-center"
                  onClick={spin}
                  disabled={busy || !valid || !ready}
                  aria-label="Quay vĂ²ng quay"
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
              {busy ? "Äang tĂ¬m ngÆ°á»i may máº¯nâ€¦" : "Quay ngay"}
              <span>â†—</span>
            </button>
            <p className="hint">
              Nháº¥n nĂºt hoáº·c tĂ¢m vĂ²ng quay Ä‘á»ƒ báº¯t Ä‘áº§u
            </p>
          </section>
          <aside>
            <div className="tabs">
              <button
                className={tab === "names" ? "active" : ""}
                onClick={() => setTab("names")}
              >
                <Users size={17} />
                Danh sĂ¡ch <b>{names.length}</b>
              </button>
              <button
                className={tab === "results" ? "active" : ""}
                onClick={() => setTab("results")}
              >
                <Trophy size={17} />
                Káº¿t quáº£ <b>{results.length}</b>
              </button>
            </div>
            {tab === "names" ? (
              <>
                <div className="entry-heading">
                  <h2>Nhá»¯ng ngÆ°á»i tham gia</h2>
                  <p>
                    Má»—i dĂ²ng lĂ  má»™t ngÆ°á»i. May máº¯n dĂ nh cho táº¥t
                    cáº£!
                  </p>
                </div>
                <div className="tools">
                  <button disabled={busy || !valid} onClick={shuffle}>
                    <Shuffle size={14} />
                    Trá»™n tĂªn
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
                    Aâ€“Z Sáº¯p xáº¿p
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => input.current?.click()}
                  >
                    <Upload size={14} />
                    Nháº­p
                  </button>
                </div>
                <textarea
                  aria-label="Danh sĂ¡ch ngÆ°á»i tham gia"
                  disabled={busy}
                  spellCheck={false}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nháº­p tĂªn, má»—i ngÆ°á»i má»™t dĂ²ngâ€¦"
                />
                <div className="entry-footer">
                  <span>
                    â—{" "}
                    {ready
                      ? "Tá»± Ä‘á»™ng lÆ°u trĂªn thiáº¿t bá»‹"
                      : "Äang táº£iâ€¦"}
                  </span>
                  <span>{names.length}/400</span>
                </div>
                <div className="tip">
                  â“˜{" "}
                  <span>
                    Báº¡n cĂ³ thá»ƒ dĂ¡n trá»±c tiáº¿p má»™t cá»™t tĂªn tá»«
                    Excel hoáº·c nháº­p tá»‡p .txt.
                  </span>
                </div>
              </>
            ) : (
              <div className="results">
                <h2>Khoáº£nh kháº¯c may máº¯n</h2>
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
                      NgÆ°á»i may máº¯n Ä‘áº§u tiĂªn
                      <br />
                      sáº½ xuáº¥t hiá»‡n á»Ÿ Ä‘Ă¢y.
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
                  ? "Danh sĂ¡ch vÆ°á»£t quĂ¡ 400 ngÆ°á»i. HĂ£y giáº£m sá»‘ tĂªn trÆ°á»›c khi quay."
                  : "ThĂªm Ă­t nháº¥t má»™t tĂªn Ä‘á»ƒ báº¯t Ä‘áº§u.")}
            </p>
          )}
        </div>
        <footer>
          <span>
            <Sparkles size={15} />
            Má»™t chĂºt há»“i há»™p. Má»™t niá»m vui lá»›n.
          </span>
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Báº¯t Ä‘áº§u láº¡i tá»« lÆ°á»£t 1 vĂ  xĂ³a lá»‹ch sá»­ káº¿t quáº£?",
                )
              ) {
                setResults([]);
                setAngle(0);
                setNotice("ÄĂ£ báº¯t Ä‘áº§u phiĂªn má»›i.");
              }
            }}
          >
            <RotateCcw size={14} />
            Báº¯t Ä‘áº§u phiĂªn má»›i
          </button>
        </footer>
        <details>
          <summary>Ká»‹ch báº£n sá»± kiá»‡n</summary>
          <p>
            LÆ°á»£t quay thá»© 6 Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh cho{" "}
            <strong>Khoa Anthony</strong>. CĂ¡c lÆ°á»£t khĂ¡c chá»n ngáº«u
            nhiĂªn. TĂªn nĂ y pháº£i cĂ³ trong danh sĂ¡ch á»Ÿ lÆ°á»£t 6. Báº¯t
            Ä‘áº§u phiĂªn má»›i Ä‘á»ƒ Ä‘áº·t láº¡i bá»™ Ä‘áº¿m.
          </p>
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm("Thay danh sĂ¡ch hiá»‡n táº¡i báº±ng 400 tĂªn máº«u?")
              )
                setText(
                  Array.from({ length: 400 }, (_, i) =>
                    i === 5
                      ? "Khoa Anthony"
                      : `NgÆ°á»i tham gia ${String(i + 1).padStart(3, "0")}`,
                  ).join("\n"),
                );
            }}
          >
            DĂ¹ng danh sĂ¡ch máº«u 400 ngÆ°á»i
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
            setNotice("Vui lĂ²ng chá»n tá»‡p dÆ°á»›i 1 MB.");
            return;
          }
          try {
            const value = await file.text();
            if (!lock.current) setText(value.replace(/^\uFEFF/, ""));
          } catch {
            setNotice("KhĂ´ng thá»ƒ Ä‘á»c tá»‡p.");
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
              aria-label="ÄĂ³ng"
              onClick={() => dismiss()}
            >
              <X />
            </button>
            <div className="trophy">đŸ†</div>
            <div className="eyebrow">CHĂC Má»ªNG NGÆ¯á»œI MAY Máº®N</div>
            <h2 id="winner-title">{winner.name}</h2>
            <p>NgÆ°á»i chiáº¿n tháº¯ng á»Ÿ lÆ°á»£t quay #{winner.turn}</p>
            <button className="primary" onClick={() => dismiss()}>
              Tiáº¿p tá»¥c quay
              <Sparkles size={18} />
            </button>
            <button className="remove" onClick={() => dismiss(true)}>
              XĂ³a tĂªn khá»i danh sĂ¡ch
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
