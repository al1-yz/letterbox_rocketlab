import type { FormEvent } from 'react'
import type { MovieFilters, MovieSort } from '../api/types.ts'
import { useGenres } from '../hooks/queries.ts'

const SORT_LABELS: Record<MovieSort, string> = {
  popularity: 'Mais populares',
  title: 'Título (A–Z)',
  recent: 'Mais recentes',
  rating: 'Melhor avaliados',
}

interface CatalogFiltersProps {
  filters: MovieFilters
  onChange: (changes: Partial<MovieFilters>) => void
}

const fieldClass =
  'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400'

export default function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  const genres = useGenres()

  // A busca só é enviada ao confirmar (Enter ou botão): uma requisição por busca,
  // e não uma por tecla digitada.
  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const q = new FormData(event.currentTarget).get('q')
    onChange({ q: typeof q === 'string' ? q.trim() : '' })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <form role="search" onSubmit={handleSearch} className="flex flex-1 gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-400">
          Buscar por título
          {/* key: quando a URL muda (voltar/avançar), o campo reflete a busca atual. */}
          <input
            key={filters.q}
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Ex.: Interstellar"
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Buscar
        </button>
      </form>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Gênero
        <select
          value={filters.genre}
          onChange={(event) => onChange({ genre: event.target.value })}
          className={fieldClass}
        >
          <option value="">Todos</option>
          {genres.data?.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Ordenar por
        <select
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value as MovieSort })}
          className={fieldClass}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}