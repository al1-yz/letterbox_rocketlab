"""Rotas HTTP do catálogo: validam a entrada e traduzem o resultado em status."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import MovieDetail, MovieSort, MovieSummary, Page

router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_db)]


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


@router.get("/movies/{movie_id}", tags=["movies"])
async def get_movie(movie_id: str, session: SessionDep) -> MovieDetail:
    movie = await service.get_movie(session, movie_id)
    if movie is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado.")
    return movie
