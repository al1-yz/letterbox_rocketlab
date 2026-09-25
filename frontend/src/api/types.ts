// Contratos da API, espelhando backend/app/movies/schemas.py.
// interface para formatos de objeto; type para uniões e tipos derivados.

export type MovieSort = 'popularity' | 'title' | 'recent' | 'rating'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface MovieSummary {
  id: string
  titulo: string
  ano_lancamento: number | null
  url_poster: string | null
  generos: string[]
  media: number | null
  total_avaliacoes: number
}

// O detalhe tem tudo o que o resumo tem, e mais: estender evita repetir campos.
export interface MovieDetail extends MovieSummary {
  sinopse: string | null
  data_lancamento: string | null
  duracao_minutos: number | null
  status_filme: string | null
  url_backdrop: string | null
  diretores: string[]
  roteiristas: string[]
  elenco: string[]
  produtoras: string[]
}

export interface MovieInput {
  titulo: string
  ano_lancamento: number | null
  sinopse: string | null
  url_poster: string | null
  generos: string[]
  diretores: string[]
}

// PATCH aceita qualquer subconjunto; o backend recusa null só nos obrigatórios.
export type MovieUpdate = Partial<MovieInput>

export interface Review {
  id: string
  nome: string
  nota: number
  comentario: string
  // ISO 8601 em UTC, terminando em "Z".
  created_at: string
}

export type ReviewInput = Omit<Review, 'id' | 'created_at'>

export interface MovieFilters {
  q: string
  genre: string
  sort: MovieSort
  page: number
}