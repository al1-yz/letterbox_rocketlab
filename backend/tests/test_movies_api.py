import httpx
import pytest

pytestmark = pytest.mark.usefixtures("catalog")


def ids(body: dict) -> list[str]:
    return [movie["id"] for movie in body["items"]]


async def test_list_genres_returns_names_in_order(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/genres")

    assert response.status_code == 200
    assert response.json() == ["Comedy", "Drama", "Horror"]


async def test_list_movies_paginates_by_popularity_by_default(client: httpx.AsyncClient) -> None:
    first = (await client.get("/api/v1/movies", params={"page_size": 2})).json()
    second = (await client.get("/api/v1/movies", params={"page_size": 2, "page": 2})).json()

    assert ids(first) == ["m-alpha", "m-beta"]
    assert ids(second) == ["m-gamma"]
    assert (first["total"], first["pages"]) == (3, 2)


async def test_list_movies_summarizes_ratings_from_movie_reviews(
    client: httpx.AsyncClient,
) -> None:
    body = (await client.get("/api/v1/movies")).json()
    movies = {movie["id"]: movie for movie in body["items"]}

    assert (movies["m-alpha"]["media"], movies["m-alpha"]["total_avaliacoes"]) == (7.0, 2)
    assert (movies["m-gamma"]["media"], movies["m-gamma"]["total_avaliacoes"]) == (None, 0)
    assert movies["m-alpha"]["generos"] == ["Drama", "Horror"]


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        pytest.param({"q": "LOVE"}, ["m-beta"], id="case-insensitive"),
        pytest.param({"q": "a"}, ["m-alpha", "m-beta", "m-gamma"], id="search-keeps-popularity"),
        pytest.param({"q": "%"}, [], id="wildcard-is-literal"),
        pytest.param({"genre": "Drama"}, ["m-alpha", "m-gamma"], id="genre"),
        pytest.param({"genre": "Drama", "q": "amber"}, ["m-gamma"], id="genre-and-search"),
    ],
)
async def test_list_movies_filters(
    client: httpx.AsyncClient, params: dict[str, str], expected: list[str]
) -> None:
    body = (await client.get("/api/v1/movies", params=params)).json()

    assert ids(body) == expected
    assert body["total"] == len(expected)


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("popularity", ["m-alpha", "m-beta", "m-gamma"]),
        ("title", ["m-gamma", "m-beta", "m-alpha"]),
        ("recent", ["m-alpha", "m-gamma", "m-beta"]),
        ("rating", ["m-beta", "m-alpha", "m-gamma"]),
    ],
)
async def test_list_movies_sorts(client: httpx.AsyncClient, sort: str, expected: list[str]) -> None:
    body = (await client.get("/api/v1/movies", params={"sort": sort})).json()

    assert ids(body) == expected


@pytest.mark.parametrize("params", [{"page": 0}, {"page_size": 101}, {"sort": "random"}])
async def test_list_movies_rejects_invalid_params(
    client: httpx.AsyncClient, params: dict[str, str | int]
) -> None:
    response = await client.get("/api/v1/movies", params=params)

    assert response.status_code == 422


async def test_get_movie_returns_full_detail(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/movies/m-alpha")

    assert response.status_code == 200
    body = response.json()
    assert body["titulo"] == "Zodiac Night"
    assert body["generos"] == ["Drama", "Horror"]
    assert body["diretores"] == ["Ana Diretora"]
    assert body["elenco"] == ["Bruno Ator"]
    assert body["roteiristas"] == ["Carla Roteirista"]
    assert body["produtoras"] == ["Studio A"]
    assert (body["media"], body["total_avaliacoes"]) == (7.0, 2)


async def test_get_movie_returns_404_for_unknown_id(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/movies/nao-existe")

    assert response.status_code == 404
    assert response.json() == {"detail": "Filme não encontrado."}
