import { useCallback, useEffect, useRef, useState } from "react";
import { startBlinkDetection } from "./blink";
import "./App.css";

const CADANGAN = [
  {
    hewan: "Anjing",
    emoji: "🐶",
    suara: "guk guk guk!",
    komentar: "Matanya berbinar, setianya nggak diragukan lagi!",
  },
  {
    hewan: "Kucing",
    emoji: "🐱",
    suara: "meong meong!",
    komentar: "Anggun, mandiri, dan agak susah diajak matin-matin.",
  },
  {
    hewan: "Kelinci",
    emoji: "🐰",
    suara: "nguuut~",
    komentar: "Lucunya bikin pengen dipeluk terus!",
  },
  {
    hewan: "Singa",
    emoji: "🦁",
    suara: "RAAAWR!",
    komentar: "Aura pemimpinnya udah keliatan dari sini!",
  },
];

export default function App() {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const doneRef = useRef(false);

  const [status, setStatus] = useState("loading"); // loading | ready | error | done
  const [pesanError, setPesanError] = useState("");
  const [adaWajah, setAdaWajah] = useState(false);
  const [kedip, setKedip] = useState(0);
  const [hasil, setHasil] = useState(null);

  const tampilkanHasil = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus("done");

    let data = CADANGAN[Math.floor(Math.random() * CADANGAN.length)];
    try {
      const r = await fetch("/api/verdict"); // dari Python (Flask)
      data = await r.json();
    } catch {
      /* backend mati -> pakai hasil cadangan */
    }
    setHasil(data);

    try {
      const u = new SpeechSynthesisUtterance(data.suara || "hore!");
      u.lang = "id-ID";
      speechSynthesis.speak(u);
    } catch {
      /* tidak didukung, abaikan */
    }
  }, []);

  useEffect(() => {
    let batal = false;
    let stream;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Kamera butuh koneksi aman (https atau localhost). Lihat README."
          );
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (batal) return;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const detector = await startBlinkDetection(video, {
          onFace: setAdaWajah,
          onBlink: setKedip,
          onDouble: tampilkanHasil,
        });
        if (batal) return detector.stop();

        detectorRef.current = detector;
        setStatus("ready");
      } catch (e) {
        setPesanError(e.message || "Kamera tidak bisa dibuka.");
        setStatus("error");
      }
    })();

    return () => {
      batal = true;
      detectorRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [tampilkanHasil]);

  function ulang() {
    doneRef.current = false;
    detectorRef.current?.reset();
    setKedip(0);
    setHasil(null);
    setStatus(detectorRef.current ? "ready" : "error");
  }

  let petunjuk = "Menyiapkan kamera & AI… 🧠";
  if (status === "ready") {
    petunjuk = adaWajah ? "Kedip 2 kali ya! 👀" : "Wajahmu belum kelihatan 🙈";
  }
  if (status === "error") petunjuk = "Waduh, ada masalah 😢";

  return (
    <main className="app">
      <h1 className="judul">Detektor Kemiripan Hewan 🔍</h1>

      <div className={`kamera ${status === "done" ? "beku" : ""}`}>
        <video ref={videoRef} playsInline muted />
        {status === "loading" && <div className="loader">⏳</div>}

        {status === "done" && (
          <div className="hasil">
            <div className="emoji">{hasil?.emoji ?? "🔍"}</div>
          </div>
        )}
      </div>

      {status !== "done" && (
        <>
          <p className="petunjuk">{petunjuk}</p>
          <div className="titik" aria-label={`Kedip ${kedip} dari 2`}>
            <span className={kedip >= 1 ? "on" : ""} />
            <span className={kedip >= 2 ? "on" : ""} />
          </div>
        </>
      )}

      {status === "error" && (
        <div className="error">
          <p>{pesanError}</p>
          <button onClick={tampilkanHasil}>Lanjut tanpa kamera 🐾</button>
        </div>
      )}

      {status === "done" && hasil && (
        <section className="kartu">
          <p className="kecil">Hasil analisis menyatakan…</p>
          <h2>
            Kamu mirip <b>{hasil.hewan}</b>! {hasil.emoji}
          </h2>
          <p className="komentar">{hasil.komentar}</p>
          {hasil.total && (
            <p className="kecil">Kamu orang ke-{hasil.total} yang kedip 2x di sini 🐾</p>
          )}
          <button onClick={ulang}>Coba lagi 🔄</button>
        </section>
      )}

      <p className="catatan">*Hanya untuk lucu-lucuan, bukan sains 😄</p>
    </main>
  );
}
