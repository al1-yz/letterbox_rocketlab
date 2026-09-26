import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMovie,
  createReview,
  deleteMovie,
  getMovie,
  listGenres,
  listMovies,
  listReviews,
  updateMovie,
} from '../api/movies.ts'
import type { MovieFilters, MovieInput, MovieUpdate, ReviewInput } from '../api/types.ts'

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

export function useCreateMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (movie: MovieInput) => createMovie(movie),
    onSuccess: (created) => {
      // A resposta já é o detalhe completo: a próxima tela abre sem nova requisição.
      queryClient.setQueryData(queryKeys.movie(created.id), created)
      return queryClient.invalidateQueries({ queryKey: queryKeys.movies })
    },
  })
}

export function useUpdateMovie(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: MovieUpdate) => updateMovie(id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.movie(id), updated)
      return queryClient.invalidateQueries({ queryKey: queryKeys.movies })
    },
  })
}

export function useDeleteMovie(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteMovie(id),
    onSuccess: () => {
      // O filme deixou de existir: tira detalhe e avaliações do cache, para
      // "voltar" no navegador não mostrar dados de um filme apagado.
      queryClient.removeQueries({ queryKey: queryKeys.movie(id) })
      queryClient.removeQueries({ queryKey: queryKeys.reviews(id) })
      return queryClient.invalidateQueries({ queryKey: queryKeys.movies })
    },
  })
}