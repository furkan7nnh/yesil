import json
import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", BASE_DIR)
DB_PATH = os.environ.get("CARDS_DB_PATH", os.path.join(DATA_DIR, "cards.db"))
LEGACY_CARDS_FILE = os.path.join(BASE_DIR, "cards.json")


def get_db_connection():
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                state_key TEXT PRIMARY KEY,
                state_value TEXT NOT NULL
            )
            """
        )
        connection.commit()


def migrate_legacy_cards_if_needed():
    if not os.path.exists(LEGACY_CARDS_FILE):
        return

    with get_db_connection() as connection:
        existing = connection.execute(
            "SELECT state_value FROM app_state WHERE state_key = ?",
            ("cards",),
        ).fetchone()
        if existing is not None:
            return

    try:
        with open(LEGACY_CARDS_FILE, "r", encoding="utf-8") as legacy_file:
            legacy_cards = json.load(legacy_file)
    except (OSError, json.JSONDecodeError):
        return

    if isinstance(legacy_cards, list):
        save_cards(legacy_cards)


def load_cards():
    with get_db_connection() as connection:
        row = connection.execute(
            "SELECT state_value FROM app_state WHERE state_key = ?",
            ("cards",),
        ).fetchone()

    if row is None:
        return []

    try:
        parsed = json.loads(row["state_value"])
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def save_cards(cards):
    serialized_cards = json.dumps(cards, ensure_ascii=False)
    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO app_state (state_key, state_value)
            VALUES (?, ?)
            ON CONFLICT(state_key)
            DO UPDATE SET state_value = excluded.state_value
            """,
            ("cards", serialized_cards),
        )
        connection.commit()


init_db()
migrate_legacy_cards_if_needed()


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
