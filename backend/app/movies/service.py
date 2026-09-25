"""Consultas do catálogo que montam os contratos da API sem N+1."""

import math
from collections.abc import Iterable, Sequence

from sqlalchemy import ColumnElement, Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import (
    DimGenre,
    DimMovie,
    DimPerson,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_genre,
)
from app.movies.schemas import MovieDetail, MovieSort, MovieSummary, Page


async def list_genres(session: AsyncSession) -> list[str]:
    names = await session.scalars(select(DimGenre.nome_genero).order_by(DimGenre.nome_genero))
    return list(names)


async def rating_summaries(
    session: AsyncSession, movie_ids: Sequence[str]
) -> dict[str, tuple[float, int]]:
    """Média e total de avaliações por filme, sempre calculados de movie_reviews."""

    if not movie_ids:
        return {}
    rows = await session.execute(
        select(MovieReview.sk_movie_id, func.avg(MovieReview.nota), func.count())
        .where(MovieReview.sk_movie_id.in_(movie_ids))
        .group_by(MovieReview.sk_movie_id)
    )
    return {movie_id: (average, count) for movie_id, average, count in rows}


async def genre_names(session: AsyncSession, movie_ids: Sequence[str]) -> dict[str, list[str]]:
    if not movie_ids:
        return {}
    rows = await session.execute(
        select(bridge_movie_genre.c.sk_movie_id, DimGenre.nome_genero)
        .join(DimGenre, DimGenre.sk_genre_id == bridge_movie_genre.c.sk_genre_id)
        .where(bridge_movie_genre.c.sk_movie_id.in_(movie_ids))
        .order_by(DimGenre.nome_genero)
    )
    names: dict[str, list[str]] = {}
    for movie_id, name in rows:
        names.setdefault(movie_id, []).append(name)
    return names


def order_movies(statement: Select, sort: MovieSort, *, searching: bool) -> Select:
    if sort == "title":
        return statement.order_by(DimMovie.titulo, DimMovie.sk_movie_id)
    if sort == "recent":
        return statement.order_by(DimMovie.ano_lancamento.desc(), DimMovie.sk_movie_id.desc())
    if sort == "rating":
        ratings = (
            select(MovieReview.sk_movie_id, func.avg(MovieReview.nota).label("media"))
            .group_by(MovieReview.sk_movie_id)
            .subquery()
        )
        return statement.outerjoin(ratings, ratings.c.sk_movie_id == DimMovie.sk_movie_id).order_by(
            ratings.c.media.desc(), DimMovie.sk_movie_id.desc()
        )

    popularity = FactMoviePerformance.popularidade
    if searching:
        # Com busca, o LEFT JOIN faz o SQLite partir dos filmes: filtra os títulos
        # primeiro e ordena só o que casou (DESC deixa popularidade nula no fim).
        return statement.outerjoin(FactMoviePerformance).order_by(
            popularity.desc(), DimMovie.sk_movie_id.desc()
        )
    # Sem busca, o JOIN interno deixa o índice ix_fact_movies_performance_popularidade
    # conduzir a ordenação e parar na página pedida. Todo filme tem linha no fato
    # (o seed e o cadastro garantem), então o JOIN interno não esconde nenhum.
    return statement.join(FactMoviePerformance).order_by(
        popularity.desc(), FactMoviePerformance.sk_movie_id.desc()
    )


async def list_movies(
    session: AsyncSession,
    *,
    q: str | None,
    genre: str | None,
    sort: MovieSort,
    page: int,
    page_size: int,
) -> Page[MovieSummary]:
    filters: list[ColumnElement[bool]] = []
    if q:
        filters.append(DimMovie.titulo.icontains(q, autoescape=True))
    if genre:
        filters.append(DimMovie.genres.any(DimGenre.nome_genero == genre))

    total = await session.scalar(select(func.count()).select_from(DimMovie).where(*filters)) or 0

    statement = select(
        DimMovie.sk_movie_id,
        DimMovie.titulo,
        DimMovie.ano_lancamento,
        DimMovie.url_poster,
    ).where(*filters)
    statement = order_movies(statement, sort, searching=bool(q))
    rows = (await session.execute(statement.limit(page_size).offset((page - 1) * page_size))).all()

    # Pagina primeiro, agrega depois: médias e gêneros só dos filmes desta página.
    movie_ids = [row.sk_movie_id for row in rows]
    ratings = await rating_summaries(session, movie_ids)
    genres = await genre_names(session, movie_ids)
    items = [
        MovieSummary(
            id=row.sk_movie_id,
            titulo=row.titulo,
            ano_lancamento=row.ano_lancamento,
            url_poster=row.url_poster,
            generos=genres.get(row.sk_movie_id, []),
            media=ratings[row.sk_movie_id][0] if row.sk_movie_id in ratings else None,
            total_avaliacoes=ratings[row.sk_movie_id][1] if row.sk_movie_id in ratings else 0,
        )
        for row in rows
    ]
    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


def names_with_role(people: Iterable[DimPerson], role: str) -> list[str]:
    return sorted(person.nome_pessoa for person in people if person.tipo_pessoa == role)


async def get_movie(session: AsyncSession, movie_id: str) -> MovieDetail | None:
    # Sessão assíncrona não faz lazy loading: as relações vêm carregadas explicitamente.
    movie = await session.scalar(
        select(DimMovie)
        .where(DimMovie.sk_movie_id == movie_id)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
            selectinload(DimMovie.companies),
        )
    )
    if movie is None:
        return None

    average, count = (await rating_summaries(session, [movie_id])).get(movie_id, (None, 0))
    return MovieDetail(
        id=movie.sk_movie_id,
        titulo=movie.titulo,
        sinopse=movie.sinopse,
        ano_lancamento=movie.ano_lancamento,
        data_lancamento=movie.data_lancamento,
        duracao_minutos=movie.duracao_minutos,
        status_filme=movie.status_filme,
        url_poster=movie.url_poster,
        url_backdrop=movie.url_backdrop,
        generos=[genre.nome_genero for genre in movie.genres],
        diretores=names_with_role(movie.people, "Diretor"),
        roteiristas=names_with_role(movie.people, "Roteirista"),
        elenco=names_with_role(movie.people, "Ator"),
        produtoras=[company.nome_produtora for company in movie.companies],
        media=average,
        total_avaliacoes=count,
    )
