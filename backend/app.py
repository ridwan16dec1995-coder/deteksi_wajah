import random
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
app = Flask(__name__, static_folder=None)

# "database" sederhana di memori (reset kalau server dimatikan)
total_scan = 0

# Daftar hewan yang bisa keluar secara acak.
HEWAN = [
    {
        "hewan": "Anjing",
        "emoji": "🐶",
        "suara": "guk guk guk!",
        "komentar": [
            "Matanya berbinar, setianya nggak diragukan lagi!",
            "Hasil scan: 100% good boy / good girl.",
            "Kalau dikasih tulang, pasti langsung ekornya goyang.",
            "Telinganya memang nggak kelihatan, tapi hatinya gonggongnya kenceng!",
            "Detektor kami yakin: kamu jago nyium bau makanan dari jauh.",
        ],
    },
    {
        "hewan": "Kucing",
        "emoji": "🐱",
        "suara": "meong meong!",
        "komentar": [
            "Anggun, mandiri, dan agak susah diajak matin-matin.",
            "Kalau disiram air, refleksnya lompat duluan.",
            "Tidur 16 jam sehari tapi tetap kelihatan sibuk.",
            "Muka datar, tapi hatinya meleleh kalau ditemani.",
        ],
    },
    {
        "hewan": "Kelinci",
        "emoji": "🐰",
        "suara": "nguuut~",
        "komentar": [
            "Lucunya bikin pengen dipeluk terus!",
            "Gigi gerger-nya nyimpen banyak wortel.",
            "Telinganya panjang, hatinya juga lembut.",
            "Lompatannya kecil, kemanjaannya luar biasa.",
        ],
    },
    {
        "hewan": "Panda",
        "emoji": "🐼",
        "suara": "grrr…",
        "komentar": [
            "Tenang, lucu, dan raja makan bambu.",
            "Rutinnya cuma makan, tidur, dan jadi ikon gemas.",
            "Ekspresi datar tapi selalu bikin orang senyum.",
            "Gulung-gulung kayak bola, imut maksimal.",
        ],
    },
    {
        "hewan": "Singa",
        "emoji": "🦁",
        "suara": "RAAAWR!",
        "komentar": [
            "Aura pemimpinnya udah keliatan dari sini!",
            "Mengaum sekali, seisi rumah langsung sadar.",
            "Rambutnya mungkin tipis, naluri raja hutan-nya tebal.",
            "Berani, hangat, dan protektif sama yang disayang.",
        ],
    },
    {
        "hewan": "Rubah",
        "emoji": "🦊",
        "suara": "hup hup!",
        "komentar": [
            "Cerdas, gesit, dan ekspresif banget!",
            "Tampang polos, tapi otaknya lagi ngitung-ngitung.",
            "Ekor lebat, ide makin lebat.",
            "Jago pura-pura tidur biar bisa kabur dari acara keluarga.",
        ],
    },
    {
        "hewan": "Hamster",
        "emoji": "🐹",
        "suara": "cit cit!",
        "komentar": [
            "Kecil-kecil cabe rawit, energinya nggak habis!",
            "Pipinya pasti nyimpen snack cadangan.",
            "Roda hamster aja kalah cepat sama gayamu.",
            "Gemas, lincah, dan doyan ngemil tengah malam.",
        ],
    },
    {
        "hewan": "Burung Hantu",
        "emoji": "🦉",
        "suara": "huk huk!",
        "komentar": [
            "Malam-malam paling semangat, pagi-pagi paling ngantuk.",
            "Mata besar, kepekaan lebih besar lagi.",
            "Bisa diam lama tapi selalu waspada.",
            "Kepala nengok kanan-kiri kayak lagi ngecek situasi.",
        ],
    },
]


@app.get("/api/verdict")
def verdict():
    """Hasil final setelah kedip 2 kali. Dipilih acak dari daftar hewan 😄"""
    global total_scan
    total_scan += 1
    pilihan = random.choice(HEWAN)
    return jsonify(
        hewan=pilihan["hewan"],
        emoji=pilihan["emoji"],
        suara=pilihan["suara"],
        komentar=random.choice(pilihan["komentar"]),
        total=total_scan,
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
