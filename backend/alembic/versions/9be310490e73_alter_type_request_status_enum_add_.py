"""alter type request_status_enum add value closed

Revision ID: 9be310490e73
Revises: 726c36b0ad9c
Create Date: 2026-05-15 07:20:41.957561
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '9be310490e73'
down_revision: Union[str, Sequence[str], None] = '726c36b0ad9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(
            "ALTER TYPE request_status_enum ADD VALUE IF NOT EXISTS 'CLOSED'"
        )

def downgrade() -> None:
    pass

def downgrade() -> None:
    pass