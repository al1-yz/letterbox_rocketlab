"""Contratos da API do catálogo, separados dos modelos ORM."""

from datetime import date
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel

ItemT = TypeVar("ItemT")

MovieSort = Literal["popularity", "title", "recent", "rating"]


class Page(BaseModel, Generic[ItemT]):
    items: list[ItemT]
    total: int
    page: int
    page_size: int
    pages: int


class MovieSummary(BaseModel):
    id: str
    titulo: str
    ano_lancamento: int | None
    url_poster: str | None
    generos: list[str]
    media: float | None
    total_avaliacoes: int


class MovieDetail(BaseModel):
    id: str
    titulo: str
    sinopse: str | None
    ano_lancamento: int | None
    data_lancamento: date | None
    duracao_minutos: int | None
    status_filme: str | None
    url_poster: str | None
    url_backdrop: str | None
    generos: list[str]
    diretores: list[str]
    roteiristas: list[str]
    elenco: list[str]
    produtoras: list[str]
    media: float | None
    total_avaliacoes: int
