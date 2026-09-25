import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, getMovie, listGenres, listMovies, listReviews } from '../api/movies.ts'
import type { MovieFilters, ReviewInput } from '../api/types.ts'

// Chaves centralizadas: consultas e invalidações usam sempre as mesmas.
export const queryKeys = {
  movies: ['movies'] as const,
  movieList: (filters: MovieFilters) => ['movies', filters] as const,
  movie: (id: string) => ['movie', id] as const,
  reviews: (movieId: string) => ['reviews', movieId] as const,
  genres: ['genres'] as const,
}

export function useMovies(filters: MovieFilters) {
  return useQuery({
    queryKey: queryKeys.movieList(filters),
    queryFn: () => listMovies(filters),
    // Mantém a página atual na tela enquanto a próxima carrega.
    placeholderData: keepPreviousData,
  })
}

export function useGenres() {
  // Os 19 gêneros não mudam durante o uso: um único carregamento basta.
  return useQuery({ queryKey: queryKeys.genres, queryFn: listGenres, staleTime: Infinity })
}

export function useMovie(id: string) {
  return useQuery({ queryKey: queryKeys.movie(id), queryFn: () => getMovie(id) })
}

export function useReviews(movieId: string) {
  return useQuery({ queryKey: queryKeys.reviews(movieId), queryFn: () => listReviews(movieId) })
}

export function useCreateReview(movieId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review: ReviewInput) => createReview(movieId, review),
    // Uma avaliação nova muda a lista, a média do detalhe e a média no catálogo.
    // Devolver a Promise mantém a mutação "pendente" até os dados novos chegarem.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews(movieId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.movie(movieId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.movies }),
      ]),
  })
}