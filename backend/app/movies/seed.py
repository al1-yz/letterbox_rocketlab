"""Carga inicial do catálogo a partir dos CSVs fornecidos.

Uso, a partir de backend/ e com o schema já criado pelo Alembic:

    python -m app.movies.seed --data-dir data

Os arquivos são localizados pelo nome em qualquer subpasta de --data-dir,
para aceitar os ZIPs extraídos como vieram. dim_reviews.csv não é carregado:
a média é calculada a partir de movie_reviews (ver README).
"""

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

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
