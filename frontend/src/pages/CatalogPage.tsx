import { useEffect } from 'react'
import CatalogFilters from '../components/CatalogFilters.tsx'
import MovieCard from '../components/MovieCard.tsx'
import Pagination from '../components/Pagination.tsx'
import { EmptyState, ErrorState, LoadingState } from '../components/States.tsx'
import { useMovies } from '../hooks/queries.ts'
import { useCatalogFilters } from '../hooks/useCatalogFilters.ts'
import { pluralize } from '../utils/format.ts'

export default function CatalogPage() {
  const { filters, pageParam, updateFilters } = useCatalogFilters()
  const movies = useMovies(filters)

  // Regra única para a página na URL: valor inválido já chega como 1; acima da última
  // vira a última quando o total real é conhecido (não o da página anterior mantida
  // na tela); a página 1 fica sem o parâmetro. Busca, gênero e ordenação são mantidos.
  const lastPage =
    movies.isSuccess && !movies.isPlaceholderData ? Math.max(movies.data.pages, 1) : null
  const validPage = lastPage === null ? filters.page : Math.min(filters.page, lastPage)
  const canonicalParam = validPage > 1 ? String(validPage) : null
  useEffect(() => {
    // replace: o Voltar do navegador não retorna para a URL corrigida.
    if (pageParam !== canonicalParam) updateFilters({ page: validPage }, { replace: true })
  }, [pageParam, canonicalParam, validPage, updateFilters])

  function goToPage(page: number): void {
    updateFilters({ page })
    window.scrollTo({ top: 0 })
  }

  let results
  if (movies.isPending || validPage !== filters.page) {
    results = <LoadingState label="Carregando filmes…" />
  } else if (movies.isError) {
    results = <ErrorState error={movies.error} onRetry={() => movies.refetch()} />
  } else if (movies.data.items.length === 0) {
    results = <EmptyState message="Nenhum filme encontrado com esses filtros." />
  } else {
    const { items, total, page, pages } = movies.data
    results = (
      // Enquanto a próxima página carrega, a atual continua visível e esmaecida.
      <div aria-busy={movies.isPlaceholderData} className="flex flex-col gap-6">
        <p className="text-sm text-zinc-400">{pluralize(total, 'filme', 'filmes')}</p>
        <ul
          className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${
            movies.isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          {items.map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
        <Pagination page={page} pages={pages} onChange={goToPage} />
      </div>
    )
  }

  return (
    <section aria-labelledby="catalog-title" className="flex flex-col gap-6">
      <h1 id="catalog-title" className="text-2xl font-bold">
        Catálogo
      </h1>
      <CatalogFilters filters={filters} onChange={updateFilters} />
      {results}
    </section>
  )
}