"""Carga inicial do catálogo a partir dos CSVs fornecidos.

Uso, a partir de backend/ e com o schema já criado pelo Alembic:

    python -m app.movies.seed --data-dir data

Os arquivos são localizados pelo nome em qualquer subpasta de --data-dir,
para aceitar os ZIPs extraídos como vieram. dim_reviews.csv não é carregado:
a média é calculada a partir de movie_reviews (ver README).
"""

import argparse
import csv
import sys
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import TypeVar

T = TypeVar("T")

# Na ordem de carga: dimensões antes das tabelas que as referenciam.
EXPECTED_FILES: tuple[str, ...] = (
    "dim_genres.csv",
    "dim_companies.csv",
    "dim_people.csv",
    "dim_movies.csv",
    "bridge_movie_genre.csv",
    "bridge_movie_company.csv",
    "bridge_movie_person.csv",
    "fact_movies_performance.csv",
    "movies_reviews.csv",
)


class SeedError(Exception):
    """Pré-condição da carga não atendida; nada foi escrito no banco."""


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


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carrega os CSVs do catálogo no banco.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="pasta com os CSVs, buscados em qualquer subpasta (padrão: data)",
    )
    args = parser.parse_args(argv)

    try:
        files = find_csv_files(args.data_dir)
    except SeedError as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1

    for name, path in files.items():
        print(f"{name}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
