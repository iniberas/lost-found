"""add report_type to contact_requests

Revision ID: 444b2c8ec159
Revises: 80e12ff3ae93
Create Date: 2026-05-09 11:52:28.055427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '444b2c8ec159'
down_revision: Union[str, Sequence[str], None] = '80e12ff3ae93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    report_type_enum = sa.Enum('LOST', 'FOUND', name='report_type_enum')
    report_type_enum.create(op.get_bind())

    op.add_column('contact_requests', 
        sa.Column(
            'report_type', 
            sa.Enum('LOST', 'FOUND', name='report_type_enum'), 
            server_default='LOST', # default untuk data lama
            nullable=False
        )
    )

def downgrade() -> None:
    # 1. Hapus kolomnya dulu
    op.drop_column('contact_requests', 'report_type')

    # 2. Hapus tipe ENUM-nya dari database
    sa.Enum(name='report_type_enum').drop(op.get_bind())