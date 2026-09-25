"""Infraestrutura dos testes da API: banco temporário, cliente HTTP e catálogo de exemplo."""

from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import enable_sqlite_foreign_keys, get_db
from app.main import app
from app.movies.models import (
    DimCompany,
    DimGenre,
    DimMovie,
    DimPerson,
    FactMoviePerformance,
    MovieReview,
)


@pytest.fixture
async def session_factory(tmp_path: Path) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'api.db'}")
    enable_sqlite_foreign_keys(engine)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)
    await engine.dispose()


@pytest.fixture
async def client(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[httpx.AsyncClient]:
    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def catalog(session_factory: async_sessionmaker[AsyncSession]) -> None:
    """Três filmes com ordens distintas por popularidade, título, ano e nota."""

    drama = DimGenre(sk_genre_id="g-drama", nome_genero="Drama")
    horror = DimGenre(sk_genre_id="g-horror", nome_genero="Horror")
    comedy = DimGenre(sk_genre_id="g-comedy", nome_genero="Comedy")
    ana = DimPerson(sk_person_id="p-ana", nome_pessoa="Ana Diretora", tipo_pessoa="Diretor")
    alpha = DimMovie(
        sk_movie_id="m-alpha",
        titulo="Zodiac Night",
        ano_lancamento=2022,
        genres=[drama, horror],
        people=[
            ana,
            DimPerson(sk_person_id="p-bruno", nome_pessoa="Bruno Ator", tipo_pessoa="Ator"),
            DimPerson(
                sk_person_id="p-carla", nome_pessoa="Carla Roteirista", tipo_pessoa="Roteirista"
            ),
        ],
        companies=[DimCompany(sk_company_id="c-a", nome_produtora="Studio A")],
        performance=FactMoviePerformance(popularidade=90.0),
        # Horários explícitos: CURRENT_TIMESTAMP tem resolução de segundos e deixaria
        # a ordem "mais recente primeiro" empatada dentro dos testes.
        reviews=[
            MovieReview(
                nome="Rita", nota=8.0, comentario="Muito bom.", created_at=datetime(2024, 1, 2)
            ),
            MovieReview(nome="Caio", nota=6.0, comentario="Ok.", created_at=datetime(2024, 1, 1)),
        ],
    )
    beta = DimMovie(
        sk_movie_id="m-beta",
        titulo="Beta Love",
        ano_lancamento=2018,
        genres=[comedy],
        people=[
            DimPerson(sk_person_id="p-diego", nome_pessoa="Diego Diretor", tipo_pessoa="Diretor")
        ],
        performance=FactMoviePerformance(popularidade=50.0),
        reviews=[
            MovieReview(
                nome="Lia", nota=9.0, comentario="Excelente.", created_at=datetime(2024, 1, 3)
            )
        ],
    )
    gamma = DimMovie(
        sk_movie_id="m-gamma",
        titulo="Amber Road",
        ano_lancamento=2020,
        genres=[drama],
        people=[ana],
        performance=FactMoviePerformance(popularidade=None),
    )
    async with session_factory() as session:
        session.add_all([alpha, beta, gamma])
        await session.commit()
