import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listGenres, listMovies } from '../api/movies.ts'
import type { MovieFilters } from '../api/types.ts'

// Chaves centralizadas: as mutações das próximas rodadas invalidam por aqui.
export const queryKeys = {
  movies: ['movies'] as const,
  movieList: (filters: MovieFilters) => ['movies', filters] as const,
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