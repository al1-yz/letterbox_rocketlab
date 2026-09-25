from collections.abc import Callable
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from app.movies.seed import (
    EXPECTED_FILES,
    SeedError,
    find_csv_files,
    main,
    optional,
    parse_count,
    parse_duration,
    undo_extra_csv_escaping,
)


def _extract_like_zips(data_dir: Path) -> None:
    """Recria a estrutura dos ZIPs fornecidos, com arquivos vazios."""

    for name in (*EXPECTED_FILES, "dim_reviews.csv"):
        folder = "bases-1/bases_atv_dev1" if name.startswith("dim_") else "bases-2/bases_atv_dev_2"
        path = data_dir / folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch()


def test_find_csv_files_locates_expected_files_in_any_subfolder(tmp_path: Path) -> None:
    _extract_like_zips(tmp_path)

    files = find_csv_files(tmp_path)

    assert list(files) == list(EXPECTED_FILES)
    assert all(path.is_file() for path in files.values())
    assert "dim_reviews.csv" not in files


def test_find_csv_files_reports_every_missing_file(tmp_path: Path) -> None:
    _extract_like_zips(tmp_path)
    for name in ("dim_movies.csv", "movies_reviews.csv"):
        next(tmp_path.rglob(name)).unlink()

    with pytest.raises(SeedError) as error:
        find_csv_files(tmp_path)

    assert "ausente: dim_movies.csv" in str(error.value)
    assert "ausente: movies_reviews.csv" in str(error.value)


def test_find_csv_files_rejects_duplicated_file(tmp_path: Path) -> None:
    _extract_like_zips(tmp_path)
    copy = tmp_path / "copia" / "dim_people.csv"
    copy.parent.mkdir()
    copy.touch()

    with pytest.raises(SeedError) as error:
        find_csv_files(tmp_path)

    assert "duplicado: dim_people.csv" in str(error.value)
    assert "copia" in str(error.value)


def test_main_fails_with_exit_code_when_data_dir_is_missing(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    exit_code = main(["--data-dir", str(tmp_path / "nao_existe")])

    assert exit_code == 1
    assert "Pasta de dados não encontrada" in capsys.readouterr().err


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        pytest.param("Rings", "Rings", id="no-signature"),
        pytest.param("", "", id="empty"),
        pytest.param('She said "hi".', 'She said "hi".', id="legit-quotes"),
        pytest.param(
            '"Cadavre exquis" is an invitation',
            '"Cadavre exquis" is an invitation',
            id="leading-quote-without-signature",
        ),
        pytest.param('"satie\'s ""parade"""', 'satie\'s "parade"', id="wrapped"),
        pytest.param(
            '"Continuing his ""legendary adventures""',
            'Continuing his "legendary adventures"',
            id="lost-closing-quote",
        ),
        pytest.param(
            '"A ""movie within the movie"", no one saw it."',
            'A "movie within the movie", no one saw it.',
            id="comma-inside",
        ),
        pytest.param('8\' 19""', "8' 19\"", id="lost-opening-quote"),
        pytest.param('"a """"b"""" c"', 'a ""b"" c', id="single-level-only"),
        pytest.param('"Part one", part ""two""', '"Part one", part ""two""', id="ambiguous-kept"),
    ],
)
def test_undo_extra_csv_escaping(raw: str, expected: str) -> None:
    assert undo_extra_csv_escaping(raw) == expected


@pytest.mark.parametrize("convert", [str, int, float, Decimal, date.fromisoformat])
def test_optional_maps_empty_value_to_none(convert: Callable[[str], object]) -> None:
    assert optional("", convert) is None


@pytest.mark.parametrize(
    ("raw", "convert", "expected"),
    [
        pytest.param("2017", int, 2017, id="int"),
        pytest.param("24.584", float, 24.584, id="float"),
        pytest.param("25000000.0", Decimal, Decimal("25000000.0"), id="decimal"),
        pytest.param("2017-02-01", date.fromisoformat, date(2017, 2, 1), id="date"),
        pytest.param("Lançado", str, "Lançado", id="text"),
    ],
)
def test_optional_converts_present_value(
    raw: str, convert: Callable[[str], object], expected: object
) -> None:
    result = optional(raw, convert)

    assert result == expected
    assert type(result) is type(expected)


def test_optional_does_not_hide_invalid_values() -> None:
    with pytest.raises(ValueError):
        optional("2017-13-01", date.fromisoformat)


@pytest.mark.parametrize(("raw", "expected"), [("2375.0", 2375), ("46286", 46286)])
def test_parse_count_accepts_whole_numbers(raw: str, expected: int) -> None:
    result = parse_count(raw)

    assert result == expected
    assert type(result) is int


def test_parse_count_rejects_fractional_value() -> None:
    with pytest.raises(ValueError, match="contagem não inteira"):
        parse_count("2375.5")


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        pytest.param("0", None, id="zero-is-unknown"),
        pytest.param("", None, id="empty"),
        pytest.param("102", 102, id="known"),
    ],
)
def test_parse_duration_maps_zero_to_none(raw: str, expected: int | None) -> None:
    assert parse_duration(raw) == expected
