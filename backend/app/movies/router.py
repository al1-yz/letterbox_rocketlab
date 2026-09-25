"""Rotas HTTP do catálogo: validam a entrada e traduzem o resultado em status."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MovieSort,
    MovieSummary,
    MovieUpdate,
    Page,
)

router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_db)]


def movie_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado.")


def unknown_genres(error: service.UnknownGenresError) -> HTTPException:
    # Mesmo formato dos erros de validação do FastAPI, para o front tratar tudo igual.
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=[
            {
                "type": "value_error",
                "loc": ["body", "generos"],
                "msg": f"Gênero inexistente: {name}",
                "input": name,
            }
            for name in error.names
        ],
    )


@router.get("/genres", tags=["genres"])
async def list_genres(session: SessionDep) -> list[str]:
    return await service.list_genres(session)


@router.get("/movies", tags=["movies"])
async def list_movies(
    session: SessionDep,
    q: str | None = None,
    genre: str | None = None,
    sort: MovieSort = "popularity",
    page: Annotated[int, Query(ge=1)] = 1,
    # Limite operacional da API (tamanho de resposta), não uma regra de domínio.
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[MovieSummary]:
    return await service.list_movies(
        session,
        q=(q or "").strip() or None,
        genre=genre,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.post("/movies", status_code=status.HTTP_201_CREATED, tags=["movies"])
async def create_movie(data: MovieCreate, session: SessionDep) -> MovieDetail:
    try:
        return await service.create_movie(session, data)
    except service.UnknownGenresError as error:
        raise unknown_genres(error) from error


@router.get("/movies/{movie_id}", tags=["movies"])
async def get_movie(movie_id: str, session: SessionDep) -> MovieDetail:
    movie = await service.get_movie(session, movie_id)
    if movie is None:
        raise movie_not_found()
    return movie


@router.patch("/movies/{movie_id}", tags=["movies"])
async def update_movie(movie_id: str, data: MovieUpdate, session: SessionDep) -> MovieDetail:
    try:
        movie = await service.update_movie(session, movie_id, data)
    except service.UnknownGenresError as error:
        raise unknown_genres(error) from error
    if movie is None:
        raise movie_not_found()
    return movie


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["movies"])
async def delete_movie(movie_id: str, session: SessionDep) -> None:
    if not await service.delete_movie(session, movie_id):
        raise movie_not_found()
