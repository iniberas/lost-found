import uuid
from pathlib import Path
from typing import List, Tuple

from app.domain.interfaces.storage import IStorageService


class StorageService(IStorageService):
    def __init__(self, upload_dir: str, base_url: str):
        self.upload_dir = Path(upload_dir)
        self.base_url = base_url.rstrip("/")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_data: Tuple[bytes, str]) -> str:
        data, content_type = file_data
        ext = self._ext_from_content_type(content_type)
        filename = f"{uuid.uuid4()}{ext}"
        path = self.upload_dir / filename
        path.write_bytes(data)
        return f"{self.base_url}/uploads/{filename}"

    def save_files(self, files_data: List[Tuple[bytes, str]]) -> List[str]:
        return [self.save_file(f) for f in files_data]

    def delete_file(self, file_path: str) -> None:
        filename = file_path.split("/uploads/")[-1]
        path = self.upload_dir / filename
        if path.exists():
            path.unlink()

    def _ext_from_content_type(self, content_type: str) -> str:
        mapping = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        }
        return mapping.get(content_type, ".bin")
