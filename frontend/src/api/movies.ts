import { request } from './client.ts'
import type {
  MovieDetail,
  MovieFilters,
  MovieInput,
  MovieSummary,
  MovieUpdate,
  Page,
  Review,
  ReviewInput,
} from './types.ts'

// 24 fecha linhas completas na grade com 2, 3, 4 ou 6 colunas.
export const PAGE_SIZE = 24

function moviePath(id: string): string {
  return `/movies/${encodeURIComponent(id)}`
}

export function listMovies(filters: MovieFilters): Promise<Page<MovieSummary>> {
  const params = new URLSearchParams({
    sort: filters.sort,
    page: String(filters.page),
    page_size: String(PAGE_SIZE),
  })
  if (filters.q) params.set('q', filters.q)
  if (filters.genre) params.set('genre', filters.genre)
  return request(`/movies?${params}`)
}

export function getMovie(id: string): Promise<MovieDetail> {
  return request(moviePath(id))
}

export function createMovie(movie: MovieInput): Promise<MovieDetail> {
  return request('/movies', { method: 'POST', body: JSON.stringify(movie) })
}

export function updateMovie(id: string, changes: MovieUpdate): Promise<MovieDetail> {
  return request(moviePath(id), { method: 'PATCH', body: JSON.stringify(changes) })
}

export function deleteMovie(id: string): Promise<void> {
  return request(moviePath(id), { method: 'DELETE' })
}

export function listGenres(): Promise<string[]> {
  return request('/genres')
}

export function listReviews(movieId: string): Promise<Review[]> {
  return request(`${moviePath(movieId)}/reviews`)
}

export function createReview(movieId: string, review: ReviewInput): Promise<Review> {
  return request(`${moviePath(movieId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  })
}