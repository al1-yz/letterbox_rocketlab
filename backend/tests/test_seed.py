from pathlib import Path

import pytest

from app.movies.seed import EXPECTED_FILES, SeedError, find_csv_files, main


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
