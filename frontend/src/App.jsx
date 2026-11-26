import { useCallback, useEffect, useRef, useState } from "react";
import { startBlinkDetection } from "./blink";
import "./App.css";

function putarSuara(teks) {
  if (!("speechSynthesis" in window) || !teks) return;

  // Hentikan suara sebelumnya supaya suara hasil terbaru langsung terdengar.
  window.speechSynthesis.cancel();
  // Volume Web Speech API maksimal 1; tempo lebih pelan dan pengulangan
  // membuat suara hewan terdengar lebih tegas dan mudah ditangkap.
  const ucapan = new SpeechSynthesisUtterance(`${teks} ${teks}`);
  ucapan.lang = "id-ID";
  ucapan.rate = 0.82;
  ucapan.pitch = 1.15;
  ucapan.volume = 1;

  const suaraIndonesia = window.speechSynthesis
    .getVoices()
    .find((suara) => suara.lang.toLowerCase().startsWith("id"));
  if (suaraIndonesia) ucapan.voice = suaraIndonesia;

  window.speechSynthesis.speak(ucapan);
}

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
  const [totalPercobaan, setTotalPercobaan] = useState(null);

  const tampilkanHasil = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus("done");

    let data = CADANGAN[Math.floor(Math.random() * CADANGAN.length)];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    try {
      const r = await fetch("/api/verdict", { signal: controller.signal });
      if (!r.ok) throw new Error("Gagal mengambil hasil dari server.");
      data = await r.json();
    } catch {
      /* backend lambat atau mati -> pakai hasil cadangan */
    } finally {
      window.clearTimeout(timeout);
    }
    setHasil(data);
    if (Number.isInteger(data.total)) setTotalPercobaan(data.total);
    putarSuara(data.suara || "hore!");
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

  useEffect(() => {
    let batal = false;
    fetch("/api/stats")
      .then((response) => {
        if (!response.ok) throw new Error("Statistik tidak tersedia");
        return response.json();
      })
      .then((data) => {
        if (!batal && Number.isInteger(data.total)) {
          setTotalPercobaan(data.total);
        }
      })
      .catch(() => {
        // Statistik tetap bisa ditampilkan setelah backend tersedia.
      });
    return () => {
      batal = true;
    };
  }, []);

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
      <p className="jumlah-pencoba" aria-live="polite">
        Sudah dicoba {totalPercobaan ?? "…"} kali 🐾
      </p>

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
          <button onClick={() => putarSuara(hasil.suara || "hore!")}>
            Putar suara 🔊
          </button>
          {Number.isInteger(totalPercobaan) && (
            <p className="kecil">Sudah dicoba {totalPercobaan} kali secara keseluruhan 🐾</p>
          )}
          <button onClick={ulang}>Coba lagi 🔄</button>
        </section>
      )}

      <p className="catatan">*Hanya untuk lucu-lucuan, bukan sains 😄</p>
    </main>
  );
}
