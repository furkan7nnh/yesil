import json
import os
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CARDS_FILE = os.path.join(BASE_DIR, "cards.json")


def load_cards():
    if os.path.exists(CARDS_FILE):
        with open(CARDS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_cards(cards):
    with open(CARDS_FILE, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)


@app.route("/api/cards", methods=["GET"])
def get_cards():
    return jsonify(load_cards())


@app.route("/api/cards", methods=["POST"])
def set_cards():
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Gecersiz veri"}), 400
    save_cards(data)
    return jsonify({"ok": True})


@app.route("/")
def home_page():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/admin")
def admin_page():
    return send_from_directory(BASE_DIR, "admin.html")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    if not path:
        return send_from_directory(BASE_DIR, "index.html")

    # Serve real files directly; unknown routes fall back to SPA entry.
    full_path = os.path.join(BASE_DIR, path)
    if not os.path.exists(full_path):
        return send_from_directory(BASE_DIR, "index.html")

    return send_from_directory(BASE_DIR, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8088))
    app.run(host="0.0.0.0", port=port, debug=False)
