"""add user preferences column

Revision ID: b1c2d3e4f567
Revises: 3a2b27de0bed
Create Date: 2026-06-05 18:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f567'
down_revision: Union[str, Sequence[str], None] = '3a2b27de0bed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('preferences', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'preferences')
