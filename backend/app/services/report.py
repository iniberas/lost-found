import uuid
import shutil
import os
from fastapi import UploadFile
from typing import List, Optional

UPLOAD_DIR = "static/images"

def save_upload_file(file: UploadFile) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/static/images/{file_name}"

def save_multiple_uploads(files: Optional[List[UploadFile]]) -> List[str]:
    if not files:
        return []
    
    urls = []
    for file in files:
        if file.filename:
            url = save_upload_file(file)
            urls.append(url)
    return urls