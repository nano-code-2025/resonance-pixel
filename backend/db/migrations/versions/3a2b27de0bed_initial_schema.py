"""initial schema

Revision ID: 3a2b27de0bed
Revises:
Create Date: 2026-06-03 13:40:53.720927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a2b27de0bed'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('selfie_url', sa.String(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('education', sa.String(length=200), nullable=True),
        sa.Column('work', sa.String(length=200), nullable=True),
        sa.Column('life_goals', sa.String(length=500), nullable=True),
        sa.Column('personality_tags', sa.JSON(), nullable=True),
        sa.Column('requirements', sa.JSON(), nullable=True),
        sa.Column('enrichment', sa.JSON(), nullable=True),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone')
    )
    op.create_table('approaches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('initiator_id', sa.String(), nullable=False),
        sa.Column('receiver_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('tier', sa.String(length=20), nullable=False, server_default='standard'),
        sa.Column('ai_message', sa.String(length=200), nullable=True),
        sa.Column('payment_id', sa.String(), nullable=True),
        sa.Column('quality_rating', sa.String(length=10), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['initiator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('matches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_a_id', sa.String(), nullable=False),
        sa.Column('user_b_id', sa.String(), nullable=False),
        sa.Column('approach_id', sa.String(), nullable=False),
        sa.Column('current_round', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('venue_suggestions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['approach_id'], ['approaches.id'], ),
        sa.ForeignKeyConstraint(['user_a_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_b_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('match_id', sa.String(), nullable=False),
        sa.Column('round_number', sa.Integer(), nullable=False),
        sa.Column('session_type', sa.String(length=20), nullable=False, server_default='in_person'),
        sa.Column('host_user_id', sa.String(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('feishu_meeting_url', sa.String(), nullable=True),
        sa.Column('questions_completed', sa.JSON(), nullable=True),
        sa.Column('rating_a', sa.Integer(), nullable=True),
        sa.Column('rating_b', sa.Integer(), nullable=True),
        sa.Column('advance_a', sa.Boolean(), nullable=True),
        sa.Column('advance_b', sa.Boolean(), nullable=True),
        sa.Column('ai_recap', sa.String(length=2000), nullable=True),
        sa.ForeignKeyConstraint(['host_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('offers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('match_id', sa.String(), nullable=False),
        sa.Column('sender_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('match_id', name='uq_offer_per_match')
    )
    op.create_table('user_candidates',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('candidate_id', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('highlights', sa.JSON(), nullable=False),
        sa.Column('scored_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['candidate_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'candidate_id')
    )
    # Performance indexes
    op.create_index("idx_users_visibility_gender", "users", ["visibility", "gender"])
    op.create_index("idx_approaches_receiver_status", "approaches", ["receiver_id", "status"])
    op.create_index("idx_matches_user_a_status", "matches", ["user_a_id", "status"])
    op.create_index("idx_matches_user_b_status", "matches", ["user_b_id", "status"])
    op.create_index("idx_sessions_match_id", "sessions", ["match_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_sessions_match_id", table_name="sessions")
    op.drop_index("idx_matches_user_b_status", table_name="matches")
    op.drop_index("idx_matches_user_a_status", table_name="matches")
    op.drop_index("idx_approaches_receiver_status", table_name="approaches")
    op.drop_index("idx_users_visibility_gender", table_name="users")
    op.drop_table('user_candidates')
    op.drop_table('offers')
    op.drop_table('sessions')
    op.drop_table('matches')
    op.drop_table('approaches')
    op.drop_table('users')
