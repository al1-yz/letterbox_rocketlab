import { useSearchParams } from 'react-router'
import type { MovieFilters, MovieSort } from '../api/types.ts'

const SORTS: readonly string[] = ['popularity', 'title', 'recent', 'rating']

function isSort(value: string | null): value is MovieSort {
  return value !== null && SORTS.includes(value)
}

/** Os filtros do catálogo vivem na URL: dá para recarregar, voltar e compartilhar. */
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams()

  // Só dígitos contam como página: 0, negativo, decimal ou texto viram a página 1.
  const pageParam = params.get('page')
  const page = pageParam !== null && /^\d+$/.test(pageParam) ? Number(pageParam) : 1
  const sort = params.get('sort')
  const filters: MovieFilters = {
    q: params.get('q') ?? '',
    genre: params.get('genre') ?? '',
    sort: isSort(sort) ? sort : 'popularity',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  }

  // replace: corrige a URL sem criar uma entrada nova no histórico.
  function updateFilters(changes: Partial<MovieFilters>, { replace = false } = {}): void {
    // Mudar busca, gênero ou ordenação sempre volta para a primeira página.
    const next: MovieFilters = { ...filters, page: 1, ...changes }
    const search = new URLSearchParams()
    if (next.q) search.set('q', next.q)
    if (next.genre) search.set('genre', next.genre)
    if (next.sort !== 'popularity') search.set('sort', next.sort)
    if (next.page > 1) search.set('page', String(next.page))
    setParams(search, { replace })
  }

  // pageParam: o valor cru da URL, para o catálogo reescrevê-la quando não é canônico.
  return { filters, pageParam, updateFilters }
}