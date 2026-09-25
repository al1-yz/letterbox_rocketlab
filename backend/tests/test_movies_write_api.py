import httpx
import pytest
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.movies.models import (
    DimPerson,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_genre,
)

pytestmark = pytest.mark.usefixtures("catalog")

NEW_MOVIE = {
    "titulo": "Novo Filme",
    "ano_lancamento": 2024,
    "sinopse": "Uma sinopse.",
    "generos": ["Drama"],
    "diretores": ["Nova Diretora"],
}


async def count(factory: async_sessionmaker[AsyncSession], statement: Select) -> int:
    async with factory() as session:
        return await session.scalar(statement) or 0


async def test_create_movie_returns_201_and_the_detail(
    client: httpx.AsyncClient, session_factory: async_sessionmaker[AsyncSession]
) -> None:
    payload = {
        **NEW_MOVIE,
        "titulo": "  Novo Filme  ",
        "generos": ["Drama", "Drama"],
        "diretores": ["Ana Diretora", "Nova Diretora"],
    }

    response = await client.post("/api/v1/movies", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["titulo"] == "Novo Filme"
    assert body["generos"] == ["Drama"]
    assert body["diretores"] == ["Ana Diretora", "Nova Diretora"]
    assert (body["media"], body["total_avaliacoes"]) == (None, 0)
    # A diretora que já existia foi reaproveitada, não duplicada.
    ana = select(func.count()).where(DimPerson.nome_pessoa == "Ana Diretora")
    assert await count(session_factory, ana) == 1
    # O filme novo aparece no catálogo (tem linha no fato, como a listagem exige).
    catalog = (await client.get("/api/v1/movies")).json()
    assert body["id"] in [movie["id"] for movie in catalog["items"]]


@pytest.mark.parametrize(
    "changes",
    [
        pytest.param({"titulo": "   "}, id="blank-title"),
        pytest.param({"titulo": "x" * 501}, id="title-too-long"),
        pytest.param({"sinopse": "x" * 4001}, id="synopsis-too-long"),
        pytest.param({"generos": []}, id="no-genre"),
        pytest.param({"diretores": []}, id="no-director"),
        pytest.param({"diretores": [""]}, id="blank-director"),
    ],
)
async def test_create_movie_rejects_invalid_payload(
    client: httpx.AsyncClient, changes: dict[str, object]
) -> None:
    response = await client.post("/api/v1/movies", json={**NEW_MOVIE, **changes})

    assert response.status_code == 422


async def test_create_movie_with_unknown_genre_returns_422_and_creates_nothing(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post("/api/v1/movies", json={**NEW_MOVIE, "generos": ["Western"]})

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert (error["loc"], error["msg"]) == (["body", "generos"], "Gênero inexistente: Western")
    assert (await client.get("/api/v1/movies")).json()["total"] == 3


async def test_patch_changes_only_the_fields_sent(client: httpx.AsyncClient) -> None:
    response = await client.patch("/api/v1/movies/m-alpha", json={"titulo": "Zodiac Dawn"})

    assert response.status_code == 200
    body = response.json()
    assert body["titulo"] == "Zodiac Dawn"
    assert body["ano_lancamento"] == 2022
    assert body["generos"] == ["Drama", "Horror"]
    assert body["diretores"] == ["Ana Diretora"]


async def test_patch_replaces_directors_and_keeps_cast(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/movies/m-alpha", json={"diretores": ["Diego Diretor"], "generos": ["Comedy"]}
    )

    body = response.json()
    assert body["diretores"] == ["Diego Diretor"]
    assert body["generos"] == ["Comedy"]
    assert body["elenco"] == ["Bruno Ator"]
    assert body["roteiristas"] == ["Carla Roteirista"]


async def test_patch_clears_optional_field_with_null(client: httpx.AsyncClient) -> None:
    response = await client.patch("/api/v1/movies/m-alpha", json={"ano_lancamento": None})

    assert response.status_code == 200
    assert response.json()["ano_lancamento"] is None


@pytest.mark.parametrize("field", ["titulo", "generos", "diretores"])
async def test_patch_rejects_null_in_required_field(client: httpx.AsyncClient, field: str) -> None:
    response = await client.patch("/api/v1/movies/m-alpha", json={field: None})

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("method", "path"),
    [("patch", "/api/v1/movies/nao-existe"), ("delete", "/api/v1/movies/nao-existe")],
)
async def test_write_on_unknown_movie_returns_404(
    client: httpx.AsyncClient, method: str, path: str
) -> None:
    if method == "patch":
        response = await client.patch(path, json={"titulo": "X"})
    else:
        response = await client.delete(path)

    assert response.status_code == 404


async def test_delete_removes_the_movie_and_cascades(
    client: httpx.AsyncClient, session_factory: async_sessionmaker[AsyncSession]
) -> None:
    response = await client.delete("/api/v1/movies/m-alpha")

    assert response.status_code == 204
    assert (await client.get("/api/v1/movies/m-alpha")).status_code == 404
    for model in (MovieReview, FactMoviePerformance):
        orphans = select(func.count()).where(model.sk_movie_id == "m-alpha")
        assert await count(session_factory, orphans) == 0
    links = select(func.count()).where(bridge_movie_genre.c.sk_movie_id == "m-alpha")
    assert await count(session_factory, links) == 0
    # Os outros filmes e suas avaliações continuam intactos.
    others = select(func.count()).select_from(MovieReview)
    assert await count(session_factory, others) == 1
