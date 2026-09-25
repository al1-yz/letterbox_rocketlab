"""Carga inicial do catálogo a partir dos CSVs fornecidos.

Uso, a partir de backend/ e com o schema já criado pelo Alembic:

    python -m app.movies.seed --data-dir data

Os arquivos são localizados pelo nome em qualquer subpasta de --data-dir,
para aceitar os ZIPs extraídos como vieram. dim_reviews.csv não é carregado:
a média é calculada a partir de movie_reviews (ver README).

A carga roda numa única transação e é idempotente pela chave primária: linhas
já existentes são ignoradas; qualquer outra violação desfaz a carga inteira.
"""

import argparse
import csv
import sys
import time
from collections import Counter
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import TypeVar

from sqlalchemy import Connection, Engine, Table, create_engine, func, inspect, select
from sqlalchemy.dialects.sqlite import Insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.db.base import Base
from app.movies import models  # noqa: F401  Registra as tabelas no metadata.

T = TypeVar("T")
Converter = Callable[[str], object]

BATCH_SIZE = 5_000


class SeedError(Exception):
    """Falha de pré-condição ou de dado; nada da carga é gravado no banco."""


@dataclass(frozen=True)
class TableLoad:
    """Como um arquivo CSV é carregado em uma tabela."""

    file_name: str
    table_name: str
    converters: Mapping[str, Converter] = field(default_factory=dict)

    @property
    def table(self) -> Table:
        return Base.metadata.tables[self.table_name]


@dataclass(frozen=True)
class TableStats:
    table: str
    read: int
    inserted: int

    @property
    def skipped(self) -> int:
        return self.read - self.inserted


def undo_extra_csv_escaping(value: str) -> str:
    """Desfaz um nível extra de escape CSV aplicado na origem a textos com aspas.

    Só atua sobre valores com a assinatura observada nos dados: aspas dobradas ("").
    Valores que começam com aspas são relidos como um campo CSV, o que também cobre
    os casos em que a aspa de fechamento se perdeu; os demais só têm as aspas
    dobradas reduzidas. Se a releitura não resultar em exatamente um campo, o valor
    é mantido como veio, para nunca truncar texto.
    """

    if '""' not in value:
        return value
    if not value.startswith('"'):
        return value.replace('""', '"')
    fields = next(csv.reader([value]))
    return fields[0] if len(fields) == 1 else value


def optional(value: str, convert: Callable[[str], T]) -> T | None:
    """Converte um campo opcional; texto vazio no CSV significa ausência de valor."""

    return None if value == "" else convert(value)


def parse_count(value: str) -> int:
    """Converte contagens exportadas como float ("2375.0") sem arredondar."""

    number = float(value)
    if not number.is_integer():
        raise ValueError(f"contagem não inteira: {value!r}")
    return int(number)


def parse_duration(value: str) -> int | None:
    """Converte a duração em minutos; 0 na origem significa duração desconhecida."""

    minutes = optional(value, int)
    return None if minutes == 0 else minutes


# Colunas ausentes destes mapas entram como texto, exatamente como vieram.
MOVIE_CONVERTERS: dict[str, Converter] = {
    "id_filme": lambda value: optional(value, str),
    "titulo": undo_extra_csv_escaping,
    "data_lancamento": lambda value: optional(value, date.fromisoformat),
    "ano_lancamento": lambda value: optional(value, int),
    "duracao_minutos": parse_duration,
    "status_filme": lambda value: optional(value, str),
    "sinopse": lambda value: optional(value, undo_extra_csv_escaping),
    "url_poster": lambda value: optional(value, str),
    "url_backdrop": lambda value: optional(value, str),
}

FACT_CONVERTERS: dict[str, Converter] = {
    "orcamento_usd": lambda value: optional(value, Decimal),
    "receita_usd": lambda value: optional(value, Decimal),
    "lucro_usd": Decimal,
    "orcamento_brl": lambda value: optional(value, Decimal),
    "receita_brl": lambda value: optional(value, Decimal),
    "lucro_brl": Decimal,
    "popularidade": lambda value: optional(value, float),
    "nota_tmdb": lambda value: optional(value, float),
    "qtd_tmdb": lambda value: optional(value, parse_count),
    "nota_imdb": lambda value: optional(value, float),
    "qtd_imdb": lambda value: optional(value, parse_count),
}

# Na ordem de carga: dimensões antes das tabelas que as referenciam.
LOADS: tuple[TableLoad, ...] = (
    TableLoad("dim_genres.csv", "dim_genres"),
    TableLoad("dim_companies.csv", "dim_companies"),
    TableLoad("dim_people.csv", "dim_people"),
    TableLoad("dim_movies.csv", "dim_movies", MOVIE_CONVERTERS),
    TableLoad("bridge_movie_genre.csv", "bridge_movie_genre"),
    TableLoad("bridge_movie_company.csv", "bridge_movie_company"),
    TableLoad("bridge_movie_person.csv", "bridge_movie_person"),
    TableLoad("fact_movies_performance.csv", "fact_movies_performance", FACT_CONVERTERS),
    TableLoad("movies_reviews.csv", "movie_reviews", {"nota": float}),
)

EXPECTED_FILES: tuple[str, ...] = tuple(load.file_name for load in LOADS)


def find_csv_files(data_dir: Path) -> dict[str, Path]:
    """Localiza cada arquivo esperado exatamente uma vez sob data_dir."""

    if not data_dir.is_dir():
        raise SeedError(f"Pasta de dados não encontrada: {data_dir}")

    found: dict[str, Path] = {}
    problems: list[str] = []
    for name in EXPECTED_FILES:
        matches = sorted(path for path in data_dir.rglob(name) if path.is_file())
        if not matches:
            problems.append(f"ausente: {name}")
        elif len(matches) > 1:
            paths = ", ".join(str(path) for path in matches)
            problems.append(f"duplicado: {name} ({paths})")
        else:
            found[name] = matches[0]

    if problems:
        details = "\n".join(f"  - {problem}" for problem in problems)
        raise SeedError(f"Arquivos de dados inválidos em {data_dir}:\n{details}")
    return found


def check_headers(files: Mapping[str, Path]) -> None:
    """Confere se cada CSV traz exatamente as colunas que a tabela recebe da origem."""

    problems: list[str] = []
    for load in LOADS:
        with files[load.file_name].open(encoding="utf-8", newline="") as file:
            header = set(next(csv.reader(file), []))
        # Colunas preenchidas pelo banco (ex.: created_at) não vêm do CSV.
        expected = {column.name for column in load.table.columns if column.server_default is None}
        if missing := sorted(expected - header):
            problems.append(f"{load.file_name}: colunas ausentes {missing}")
        if unexpected := sorted(header - expected):
            problems.append(f"{load.file_name}: colunas inesperadas {unexpected}")

    if problems:
        details = "\n".join(f"  - {problem}" for problem in problems)
        raise SeedError(f"Cabeçalhos inválidos:\n{details}")


def check_schema(engine: Engine) -> None:
    """Falha com orientação se as migrations ainda não criaram as tabelas."""

    inspector = inspect(engine)
    missing = [load.table_name for load in LOADS if not inspector.has_table(load.table_name)]
    if missing:
        raise SeedError(
            f"Tabelas ausentes: {', '.join(missing)}. Rode 'alembic upgrade head' antes do seed."
        )


def convert_row(row: Mapping[str, str], load: TableLoad, line: int) -> dict[str, object]:
    """Aplica os conversores da tabela; erros apontam arquivo, linha e coluna."""

    if None in row or None in row.values():
        raise SeedError(f"{load.file_name}, linha {line}: número de campos difere do cabeçalho")

    record: dict[str, object] = {}
    for column, value in row.items():
        convert = load.converters.get(column)
        try:
            record[column] = value if convert is None else convert(value)
        except (ValueError, ArithmeticError) as error:
            raise SeedError(f"{load.file_name}, linha {line}, coluna {column}: {error}") from error
    return record


def execute_batch(
    connection: Connection,
    statement: Insert,
    load: TableLoad,
    batch: Sequence[tuple[int, dict[str, object]]],
) -> None:
    """Insere um lote; violações do banco apontam arquivo e faixa de linhas."""

    try:
        connection.execute(statement, [record for _, record in batch])
    except IntegrityError as error:
        first, last = batch[0][0], batch[-1][0]
        raise SeedError(f"{load.file_name}, linhas {first}-{last}: {error.orig}") from error


def insert_rows(connection: Connection, load: TableLoad, path: Path) -> int:
    """Lê o CSV em streaming e insere em lotes; devolve quantas linhas foram lidas."""

    primary_key = [column.name for column in load.table.primary_key.columns]
    statement = sqlite_insert(load.table).on_conflict_do_nothing(index_elements=primary_key)

    read = 0
    batch: list[tuple[int, dict[str, object]]] = []
    with path.open(encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            batch.append((reader.line_num, convert_row(row, load, reader.line_num)))
            read += 1
            if len(batch) == BATCH_SIZE:
                execute_batch(connection, statement, load, batch)
                batch = []
    if batch:
        execute_batch(connection, statement, load, batch)
    return read


def count_rows(connection: Connection, table: Table) -> int:
    return connection.execute(select(func.count()).select_from(table)).scalar_one()


def check_foreign_keys(connection: Connection) -> None:
    """Validação diferida: procura órfãos depois de todas as inserções da transação."""

    violations = connection.exec_driver_sql("PRAGMA foreign_key_check").all()
    if violations:
        counts = Counter(f"{table} -> {parent}" for table, _, parent, _ in violations)
        details = "\n".join(f"  - {pair}: {count}" for pair, count in counts.items())
        raise SeedError(f"Chaves estrangeiras sem correspondência:\n{details}")


def seed(engine: Engine, files: Mapping[str, Path]) -> list[TableStats]:
    """Carrega todos os arquivos numa única transação; qualquer erro desfaz tudo."""

    check_headers(files)
    check_schema(engine)

    stats: list[TableStats] = []
    with engine.begin() as connection:
        for load in LOADS:
            before = count_rows(connection, load.table)
            read = insert_rows(connection, load, files[load.file_name])
            inserted = count_rows(connection, load.table) - before
            stats.append(TableStats(load.table_name, read, inserted))
        check_foreign_keys(connection)
    return stats


def print_report(stats: Sequence[TableStats], seconds: float) -> None:
    print(f"{'tabela':<26}{'lidas':>10}{'inseridas':>11}{'ignoradas':>11}")
    for item in stats:
        print(f"{item.table:<26}{item.read:>10}{item.inserted:>11}{item.skipped:>11}")
    print("dim_reviews.csv: não carregado (a média vem de movie_reviews; ver README)")
    print(f"Concluído em {seconds:.1f}s.")


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carrega os CSVs do catálogo no banco.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="pasta com os CSVs, buscados em qualquer subpasta (padrão: data)",
    )
    args = parser.parse_args(argv)

    started = time.perf_counter()
    # Engine síncrono, como no env.py do Alembic: a carga é um processo em lote.
    engine = create_engine(get_settings().database_url.replace("+aiosqlite", ""))
    try:
        stats = seed(engine, find_csv_files(args.data_dir))
    except SeedError as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()

    print_report(stats, time.perf_counter() - started)
    return 0


if __name__ == "__main__":
    sys.exit(main())