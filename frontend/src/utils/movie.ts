import type { MovieDetail, MovieInput, MovieUpdate } from '../api/types.ts'

/** "Ana, Beto,  ,Ana" → ["Ana", "Beto"]: sem espaços nas pontas, vazios ou repetidos. */
export function parseNames(value: string): string[] {
  const names = value.split(',').map((name) => name.trim())
  return [...new Set(names.filter(Boolean))]
}

/** Os campos editáveis de um filme, no formato que o formulário usa. */
export function toMovieInput(movie: MovieDetail): MovieInput {
  return {
    titulo: movie.titulo,
    ano_lancamento: movie.ano_lancamento,
    sinopse: movie.sinopse,
    url_poster: movie.url_poster,
    generos: movie.generos,
    diretores: movie.diretores,
  }
}

function sameItems(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join('\n') === [...b].sort().join('\n')
}

/** Só o que mudou vai no corpo do PATCH. */
export function changedFields(original: MovieInput, edited: MovieInput): MovieUpdate {
  const changes: MovieUpdate = {}
  if (edited.titulo !== original.titulo) changes.titulo = edited.titulo
  if (edited.ano_lancamento !== original.ano_lancamento) {
    changes.ano_lancamento = edited.ano_lancamento
  }
  if (edited.sinopse !== original.sinopse) changes.sinopse = edited.sinopse
  if (edited.url_poster !== original.url_poster) changes.url_poster = edited.url_poster
  if (!sameItems(edited.generos, original.generos)) changes.generos = edited.generos
  if (!sameItems(edited.diretores, original.diretores)) changes.diretores = edited.diretores
  return changes
}