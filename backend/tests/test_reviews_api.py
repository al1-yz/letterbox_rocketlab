import httpx
import pytest

pytestmark = pytest.mark.usefixtures("catalog")

NEW_REVIEW = {"nome": "Marta", "nota": 10.0, "comentario": "Obra-prima."}


async def test_list_reviews_returns_newest_first(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/movies/m-alpha/reviews")

    assert response.status_code == 200
    assert [review["nome"] for review in response.json()] == ["Rita", "Caio"]


async def test_create_review_returns_201_and_updates_the_average(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post("/api/v1/movies/m-alpha/reviews", json=NEW_REVIEW)

    assert response.status_code == 201
    body = response.json()
    assert (body["nome"], body["nota"], body["comentario"]) == ("Marta", 10.0, "Obra-prima.")
    assert body["created_at"].endswith("Z")
    reviews = (await client.get("/api/v1/movies/m-alpha/reviews")).json()
    assert reviews[0]["id"] == body["id"]
    # A média vem de movie_reviews: (8 + 6 + 10) / 3.
    movie = (await client.get("/api/v1/movies/m-alpha")).json()
    assert (movie["media"], movie["total_avaliacoes"]) == (8.0, 3)


@pytest.mark.parametrize("nota", [0, 10])
async def test_create_review_accepts_the_limits_of_the_scale(
    client: httpx.AsyncClient, nota: int
) -> None:
    response = await client.post(
        "/api/v1/movies/m-gamma/reviews", json={**NEW_REVIEW, "nota": nota}
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    "changes",
    [
        pytest.param({"nota": -0.1}, id="below-zero"),
        pytest.param({"nota": 10.1}, id="above-ten"),
        pytest.param({"nome": "   "}, id="blank-name"),
        pytest.param({"nome": "x" * 121}, id="name-too-long"),
        pytest.param({"comentario": ""}, id="empty-comment"),
        pytest.param({"nota": None}, id="missing-rating"),
    ],
)
async def test_create_review_rejects_invalid_payload(
    client: httpx.AsyncClient, changes: dict[str, object]
) -> None:
    response = await client.post("/api/v1/movies/m-alpha/reviews", json={**NEW_REVIEW, **changes})

    assert response.status_code == 422


async def test_reviews_of_unknown_movie_return_404(client: httpx.AsyncClient) -> None:
    listing = await client.get("/api/v1/movies/nao-existe/reviews")
    creation = await client.post("/api/v1/movies/nao-existe/reviews", json=NEW_REVIEW)

    assert (listing.status_code, creation.status_code) == (404, 404)
