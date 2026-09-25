"""Contratos da API do catálogo, separados dos modelos ORM."""

from datetime import date
from typing import Annotated, Generic, Literal, Self, TypeVar

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


# Limites de tamanho vêm das colunas (String(n)) dos modelos; o SQLite não os aplica,
# então a API é quem garante o que o schema declara.
Titulo = Annotated[str, Field(min_length=1, max_length=500)]
Sinopse = Annotated[str, Field(max_length=4000)]
UrlPoster = Annotated[str, Field(max_length=2048)]
NomePessoa = Annotated[str, Field(min_length=1, max_length=255)]
# Regras de domínio: todo filme tem ao menos um diretor e um gênero existente.
Diretores = Annotated[list[NomePessoa], Field(min_length=1)]
Generos = Annotated[list[str], Field(min_length=1)]


class MovieCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    titulo: Titulo
    ano_lancamento: int | None = None
    sinopse: Sinopse | None = None
    url_poster: UrlPoster | None = None
    generos: Generos
    diretores: Diretores


class MovieUpdate(BaseModel):
    """PATCH: só os campos enviados mudam; opcionais aceitam null para apagar."""

    model_config = ConfigDict(str_strip_whitespace=True)

    titulo: Titulo | None = None
    ano_lancamento: int | None = None
    sinopse: Sinopse | None = None
    url_poster: UrlPoster | None = None
    generos: Generos | None = None
    diretores: Diretores | None = None

    @model_validator(mode="after")
    def reject_null_in_required_fields(self) -> Self:
        for name in ("titulo", "generos", "diretores"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} não pode ser nulo")
        return self
