import { useState, type FormEvent } from 'react'

interface PaginationProps {
  page: number
  pages: number
  onChange: (page: number) => void
}

const buttonClass =
  'rounded-md border border-zinc-700 px-4 py-2 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber-400'

/**
 * Texto digitado → página válida, também em texto: só dígitos, entre 1 e pages.
 * Vazio continua vazio para dar para apagar e digitar outro número.
 */
function clampPage(text: string, pages: number): string {
  const digits = text.replace(/\D/g, '')
  if (digits === '') return ''
  if (text.trim().startsWith('-')) return '1'
  return String(Math.min(Math.max(Number(digits), 1), pages))
}

export default function Pagination({ page, pages, onChange }: PaginationProps) {
  // O rascunho fica ligado à página em que foi digitado: se a página mudar
  // (botões, URL, Voltar), o campo volta a mostrar a página atual.
  const [draft, setDraft] = useState<{ page: number; text: string } | null>(null)

  if (pages <= 1) return null

  const text = draft?.page === page ? draft.text : String(page)

  function handleJump(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setDraft(null)
    const target = Number(clampPage(text, pages))
    // Vazio (0) ou a própria página atual: nada a fazer.
    if (target !== 0 && target !== page) onChange(target)
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3"
    >
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={page <= 1}
        className={buttonClass}
      >
        Primeira
      </button>
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
      <button
        type="button"
        onClick={() => onChange(pages)}
        disabled={page >= pages}
        className={buttonClass}
      >
        Última
      </button>
      <form onSubmit={handleJump} className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Ir para a página
          {/* Texto com a regra no componente, sem depender da validação do type="number". */}
          <input
            name="page"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={text}
            onChange={(event) => setDraft({ page, text: clampPage(event.target.value, pages) })}
            onBlur={() => {
              if (text === '') setDraft(null)
            }}
            className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
          />
        </label>
        <button type="submit" className={buttonClass}>
          Ir
        </button>
      </form>
    </nav>
  )
}