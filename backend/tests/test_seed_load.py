import copy
import csv
from collections.abc import Iterator
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import Engine, create_engine, func, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.movies.models import DimMovie, DimPerson, FactMoviePerformance
from app.movies.seed import LOADS, SeedError, find_csv_files, seed

# Valores como o leitor CSV os entrega, incluindo os artefatos reais da origem.
DATASET: dict[str, list[dict[str, str]]] = {
    "dim_genres.csv": [
        {"nome_genero": "Horror", "sk_genre_id": "g-horror"},
        {"nome_genero": "Music", "sk_genre_id": "g-music"},
    ],
    "dim_companies.csv": [{"nome_produtora": "Paramount", "sk_company_id": "c-paramount"}],
    "dim_people.csv": [
        {
            "nome_pessoa": "F. Javier Gutiérrez",
            "tipo_pessoa": "Diretor",
            "sk_person_id": "p-javier",
        },
        {"nome_pessoa": 'Martel ""tz"" Shaw', "tipo_pessoa": "Ator", "sk_person_id": "p-martel"},
    ],
    "dim_movies.csv": [
        {
            "sk_movie_id": "m-rings",
            "id_filme": "14564",
            "titulo": "Rings",
            "data_lancamento": "2017-02-01",
            "ano_lancamento": "2017",
            "duracao_minutos": "102",
            "status_filme": "Lançado",
            "sinopse": '"There is a ""movie within the movie"", that no one has seen."',
            "url_poster": "https://image.tmdb.org/t/p/w500/rings.jpg",
            "url_backdrop": "",
        },
        {
            "sk_movie_id": "m-parade",
            "id_filme": "999",
            "titulo": '"satie\'s ""parade"""',
            "data_lancamento": "2016-05-01",
            "ano_lancamento": "2016",
            "duracao_minutos": "0",
            "status_filme": "Lançado",
            "sinopse": "",
            "url_poster": "",
            "url_backdrop": "",
        },
    ],
    "bridge_movie_genre.csv": [
        {"sk_movie_id": "m-rings", "sk_genre_id": "g-horror"},
        {"sk_movie_id": "m-parade", "sk_genre_id": "g-music"},
    ],
    "bridge_movie_company.csv": [{"sk_movie_id": "m-rings", "sk_company_id": "c-paramount"}],
    "bridge_movie_person.csv": [
        {"sk_movie_id": "m-rings", "sk_person_id": "p-javier"},
        {"sk_movie_id": "m-rings", "sk_person_id": "p-martel"},
    ],
    "fact_movies_performance.csv": [
        {
            "sk_movie_id": "m-rings",
            "orcamento_usd": "25000000.0",
            "receita_usd": "83080890.0",
            "lucro_usd": "58080890.0",
            "orcamento_brl": "78682500.0",
            "receita_brl": "261480485.1",
            "lucro_brl": "182797985.1",
            "popularidade": "24.584",
            "nota_tmdb": "4.966",
            "qtd_tmdb": "2375.0",
            "nota_imdb": "4.5",
            "qtd_imdb": "46286.0",
        },
        {
            "sk_movie_id": "m-parade",
            "orcamento_usd": "",
            "receita_usd": "",
            "lucro_usd": "0.0",
            "orcamento_brl": "",
            "receita_brl": "",
            "lucro_brl": "0.0",
            "popularidade": "",
            "nota_tmdb": "7.064",
            "qtd_tmdb": "",
            "nota_imdb": "",
            "qtd_imdb": "",
        },
    ],
    "movies_reviews.csv": [
        {
            "sk_movie_review_id": "r-1",
            "sk_movie_id": "m-rings",
            "nome": "Henrique Carvalho",
            "nota": "9.8",
            "comentario": "Adorei cada minuto.",
        },
        {
            "sk_movie_review_id": "r-2",
            "sk_movie_id": "m-parade",
            "nome": "Lucas Silva",
            "nota": "2.4",
            "comentario": "Perda de tempo.",
        },
    ],
}


@pytest.fixture
def engine(tmp_path: Path) -> Iterator[Engine]:
    engine = create_engine(f"sqlite:///{tmp_path / 'seed.db'}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


def write_dataset(folder: Path, dataset: dict[str, list[dict[str, str]]]) -> dict[str, Path]:
    """Grava os CSVs de forma que o leitor devolva exatamente os valores do dataset."""

    folder.mkdir()
    for name, rows in dataset.items():
        with (folder / name).open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    return find_csv_files(folder)


def row_counts(engine: Engine) -> dict[str, int]:
    with engine.connect() as connection:
        return {
            load.table_name: connection.execute(
                select(func.count()).select_from(load.table)
            ).scalar_one()
            for load in LOADS
        }


def test_seed_loads_every_table_and_applies_transformations(engine: Engine, tmp_path: Path) -> None:
    stats = seed(engine, write_dataset(tmp_path / "data", DATASET))

    expected = {load.table_name: len(DATASET[load.file_name]) for load in LOADS}
    assert {item.table: item.inserted for item in stats} == expected
    assert row_counts(engine) == expected
    with Session(engine) as session:
        rings = session.get_one(DimMovie, "m-rings")
        assert rings.sinopse == 'There is a "movie within the movie", that no one has seen.'
        assert rings.data_lancamento == date(2017, 2, 1)
        parade = session.get_one(DimMovie, "m-parade")
        assert parade.titulo == 'satie\'s "parade"'
        assert parade.duracao_minutos is None
        assert parade.sinopse is None
        assert parade.url_poster is None
        assert session.get_one(DimPerson, "p-martel").nome_pessoa == 'Martel ""tz"" Shaw'
        qtd_tmdb = session.scalar(
            select(FactMoviePerformance.qtd_tmdb).where(
                FactMoviePerformance.sk_movie_id == "m-rings"
            )
        )
        assert qtd_tmdb == 2375
        dim_reviews = Base.metadata.tables["dim_reviews"]
        assert session.scalar(select(func.count()).select_from(dim_reviews)) == 0


def test_seed_is_idempotent(engine: Engine, tmp_path: Path) -> None:
    files = write_dataset(tmp_path / "data", DATASET)
    first = seed(engine, files)

    second = seed(engine, files)

    assert [item.inserted for item in second] == [0] * len(LOADS)
    assert [item.skipped for item in second] == [item.read for item in first]
    assert row_counts(engine) == {item.table: item.inserted for item in first}


def test_orphan_found_by_foreign_key_check_rolls_back_everything(
    engine: Engine, tmp_path: Path
) -> None:
    dataset = copy.deepcopy(DATASET)
    dataset["movies_reviews.csv"][0]["sk_movie_id"] = "m-inexistente"

    with pytest.raises(SeedError, match="movie_reviews -> dim_movies: 1"):
        seed(engine, write_dataset(tmp_path / "data", dataset))

    assert set(row_counts(engine).values()) == {0}


def test_invalid_value_reports_file_line_and_column(engine: Engine, tmp_path: Path) -> None:
    dataset = copy.deepcopy(DATASET)
    dataset["dim_movies.csv"][1]["ano_lancamento"] = "dois mil"

    with pytest.raises(SeedError, match="dim_movies.csv, linha 3, coluna ano_lancamento"):
        seed(engine, write_dataset(tmp_path / "data", dataset))

    assert set(row_counts(engine).values()) == {0}


def test_constraint_violation_reports_file_and_line_range(engine: Engine, tmp_path: Path) -> None:
    dataset = copy.deepcopy(DATASET)
    dataset["dim_movies.csv"][1]["id_filme"] = dataset["dim_movies.csv"][0]["id_filme"]

    with pytest.raises(SeedError, match=r"dim_movies\.csv, linhas 2-3: UNIQUE constraint failed"):
        seed(engine, write_dataset(tmp_path / "data", dataset))

    assert set(row_counts(engine).values()) == {0}


def test_unexpected_column_is_rejected_before_loading(engine: Engine, tmp_path: Path) -> None:
    dataset = copy.deepcopy(DATASET)
    for row in dataset["dim_genres.csv"]:
        row["extra"] = "x"

    with pytest.raises(SeedError, match=r"dim_genres\.csv: colunas inesperadas \['extra'\]"):
        seed(engine, write_dataset(tmp_path / "data", dataset))

    assert set(row_counts(engine).values()) == {0}