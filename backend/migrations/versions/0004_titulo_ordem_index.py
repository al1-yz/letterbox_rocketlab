"""Cria índice de expressão para a ordenação do catálogo por título

Revision ID: 0004_titulo_ordem_index
Revises: 0003_fact_popularidade_index
Create Date: 2026-09-26 10:00:00.000000

Escrita à mão: o autogenerate do Alembic não compara índices de expressão.
As expressões são uma cópia de TITLE_SORT_KEY (app/movies/models.py) no momento
desta revisão; a migration não importa o modelo para não mudar junto com ele.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0004_titulo_ordem_index'
down_revision: Union[str, Sequence[str], None] = '0003_fact_popularidade_index'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TITLE_SORT_GROUP = """CASE
    WHEN unicode(titulo) BETWEEN 48 AND 57 THEN 1
    WHEN unicode(titulo) BETWEEN 65 AND 90
        OR unicode(titulo) BETWEEN 97 AND 122
        OR unicode(titulo) BETWEEN 192 AND 8191
        OR unicode(titulo) >= 11264 THEN 0
    ELSE 2
END"""


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        'ix_dim_movies_titulo_ordem',
        'dim_movies',
        [sa.text(TITLE_SORT_GROUP), sa.text('lower(titulo)'), 'sk_movie_id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_dim_movies_titulo_ordem', table_name='dim_movies')