"""add thumbnail_url and image_url to content_items

Revision ID: b7e3f4a2c891
Revises: a6bcab1dcf95
Create Date: 2026-09-16
"""
from alembic import op
import sqlalchemy as sa

revision = 'b7e3f4a2c891'
down_revision = 'a6bcab1dcf95'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('content_items', sa.Column('thumbnail_url', sa.Text(), nullable=True))
    op.add_column('content_items', sa.Column('image_url', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('content_items', 'image_url')
    op.drop_column('content_items', 'thumbnail_url')
