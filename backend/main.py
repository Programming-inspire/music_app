from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from spleeter.separator import Separator
import os
import shutil
from fastapi.staticfiles import StaticFiles
from urllib.parse import quote

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the output folder statically
app.mount("/output", StaticFiles(directory="output"), name="output")

@app.post("/split")
async def split_audio(file: UploadFile = File(...)):
    upload_dir = "uploads"
    output_dir = "output"

    # Clean old files
    shutil.rmtree(upload_dir, ignore_errors=True)
    shutil.rmtree(output_dir, ignore_errors=True)
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Save uploaded file
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Separate audio
    separator = Separator("spleeter:2stems")
    separator.separate_to_file(file_path, output_dir)

    # Get file paths
    base_name = os.path.splitext(file.filename)[0]
    # Use quote() to URL-encode spaces/special characters
    vocal_path = quote(f"/output/{base_name}/vocals.wav")
    inst_path = quote(f"/output/{base_name}/accompaniment.wav")

    # Use your PC LAN IP so Expo can access
    host_ip = "192.168.225.76"  # replace with your LAN IP
    port = 8000

    return {
        "message": "File processed successfully!",
        "vocals_url": f"http://{host_ip}:{port}{vocal_path}",
        "instrumental_url": f"http://{host_ip}:{port}{inst_path}",
    }
