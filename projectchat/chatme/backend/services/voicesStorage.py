import json
import os

VOICE_DB = "voices.json"

def load_voice_db():
    if not os.path.exists(VOICE_DB):
        with open(VOICE_DB, "w") as f:
            json.dump({}, f)
    with open(VOICE_DB, "r") as f:
        return json.load(f)

def save_voice_db(data):
    with open(VOICE_DB, "w") as f:
        json.dump(data, f, indent=4)

def save_voice_id(user_id: str, voice_id: str):
    data = load_voice_db()
    data[user_id] = voice_id
    save_voice_db(data)

def get_voice_id(user_id: str):
    data = load_voice_db()
    return data.get(user_id)

def delete_voice_id(user_id: str):
    data = load_voice_db()
    if user_id in data:
        del data[user_id]
        save_voice_db(data)
