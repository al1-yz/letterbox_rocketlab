interface PaginationProps {
  page: number
  pages: number
  onChange: (page: number) => void
}

const buttonClass =
  'rounded-md border border-zinc-700 px-4 py-2 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber-400'

export default function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={buttonClass}
      >
        Anterior
      </button>
      <span className="text-sm text-zinc-400">
        Página {page.toLocaleString('pt-BR')} de {pages.toLocaleString('pt-BR')}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={buttonClass}
      >
        Próxima
      </button>
    </nav>
  )
}