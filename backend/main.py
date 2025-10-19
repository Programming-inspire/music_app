from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from spleeter.separator import Separator
from pydub import AudioSegment
import os
import shutil
from urllib.parse import quote

# -------- Initialize FastAPI --------
app = FastAPI()

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Static file serving --------
app.mount("/output", StaticFiles(directory="output"), name="output")

# -------- Helper function --------
def safe_filename(name: str) -> str:
    """Replace spaces and special characters for safe folder names"""
    return name.replace(" ", "_").replace("%", "_")

# -------- Main API endpoint --------
@app.post("/split")
async def split_audio(file: UploadFile = File(...)):
    upload_dir = "uploads"
    output_dir = "output"

    # --- Clean previous uploads and output ---
    shutil.rmtree(upload_dir, ignore_errors=True)
    shutil.rmtree(output_dir, ignore_errors=True)
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # --- Save uploaded file ---
    base_name = os.path.splitext(file.filename)[0]
    safe_base = safe_filename(base_name)
    file_path = os.path.join(upload_dir, f"{safe_base}.wav")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # --- Run spleeter (4 stems) ---
    separator = Separator("spleeter:4stems")
    separator.separate_to_file(file_path, output_dir)

    # --- Locate result folder ---
    result_folder = os.path.join(output_dir, safe_base)

    # --- Convert .wav → .mp3 for mobile streaming ---
    stems = ["vocals", "drums", "bass", "other"]
    urls = {}
    for stem in stems:
        wav_path = os.path.join(result_folder, f"{stem}.wav")
        mp3_path = os.path.join(result_folder, f"{stem}.mp3")

        if not os.path.exists(wav_path):
            continue

        # Convert and export as mp3
        try:
            AudioSegment.from_wav(wav_path).export(mp3_path, format="mp3")
        except Exception as e:
            print(f"Error converting {stem}: {e}")
            continue

        # Build safe URL for frontend
        rel_path = os.path.relpath(mp3_path, ".").replace("\\", "/")
        urls[stem] = quote(f"/{rel_path}")

    # --- Build and return response URLs ---
    host_ip = "192.168.225.76"  # replace with your LAN IP
    port = 8000

    return {
        "message": "File processed successfully!",
        "vocals_url": f"http://{host_ip}:{port}{urls.get('vocals', '')}",
        "drums_url": f"http://{host_ip}:{port}{urls.get('drums', '')}",
        "bass_url": f"http://{host_ip}:{port}{urls.get('bass', '')}",
        "other_url": f"http://{host_ip}:{port}{urls.get('other', '')}",
    }
