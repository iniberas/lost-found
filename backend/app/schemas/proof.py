import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class ProofResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    photos: List[str]
    notes: str

    model_config = ConfigDict(from_attributes=True)
