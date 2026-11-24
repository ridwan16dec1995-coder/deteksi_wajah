import random
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
app = Flask(__name__, static_folder=None)

# "database" sederhana di memori (reset kalau server dimatikan)
total_anjing = 0

KOMENTAR = [
    "Matanya berbinar, setianya nggak diragukan lagi!",
    "Hasil scan: 100% good boy / good girl.",
    "Kalau dikasih tulang, pasti langsung ekornya goyang.",
    "Aura-nya ramah, suka diajak jalan-jalan pagi.",
    "Telinganya memang nggak kelihatan, tapi hatinya gonggongnya kenceng!",
    "Detektor kami yakin: kamu jago nyium bau makanan dari jauh.",
    "Lucu banget, jangan lupa vaksin ya 🐾",
]


@app.get("/api/verdict")
def verdict():
    """Hasil final setelah kedip 2 kali. (Sengaja selalu: Anjing 😄)"""
    global total_anjing
    total_anjing += 1
    return jsonify(
        hewan="Anjing",
        emoji="🐶",
        komentar=random.choice(KOMENTAR),
        total=total_anjing,
    )


@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def serve_react(path):
    if not DIST.exists():
        return "Jalankan dulu: cd frontend && npm install && npm run build", 404
    target = DIST / path
    if path and target.is_file():
        return send_from_directory(DIST, path)
    return send_from_directory(DIST, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
