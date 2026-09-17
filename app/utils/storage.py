import os
import uuid
from typing import Optional, BinaryIO
from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_obj: BinaryIO, filename: str) -> str:
        """Save a file and return its storage identifier/path."""
        pass

    @abstractmethod
    def get_file_url(self, storage_path: str) -> str:
        """Get an access URL or path for the file."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Delete a file by its storage identifier."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = "./uploads"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, file_obj: BinaryIO, filename: str) -> str:
        unique_name = f"{uuid.uuid4()}_{filename}"
        target_path = os.path.join(self.base_dir, unique_name)
        with open(target_path, "wb") as f:
            f.write(file_obj.read())
        return target_path

    def get_file_url(self, storage_path: str) -> str:
        return f"/files/{os.path.basename(storage_path)}"

    def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
        return False


# Default storage singleton
storage_provider: StorageProvider = LocalStorageProvider()
