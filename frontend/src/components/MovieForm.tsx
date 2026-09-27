import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client.ts'
import type { MovieInput } from '../api/types.ts'
import { useGenres } from '../hooks/queries.ts'
import { parseNames } from '../utils/movie.ts'

type MovieErrors = Partial<Record<keyof MovieInput, string>>

const EMPTY_MOVIE: MovieInput = {
  titulo: '',
  ano_lancamento: null,
  sinopse: null,
  url_poster: null,
  generos: [],
  diretores: [],
}

const fieldClass =
  'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400 aria-[invalid=true]:border-red-500'

function readForm(form: HTMLFormElement): MovieInput {
  const data = new FormData(form)
  const text = (name: string): string => String(data.get(name) ?? '').trim()
  const year = text('ano_lancamento')
  return {
    titulo: text('titulo'),
    ano_lancamento: year === '' ? null : Number(year),
    sinopse: text('sinopse') || null,
    url_poster: text('url_poster') || null,
    generos: data.getAll('generos').map(String),
    diretores: parseNames(text('diretores')),
  }
}

/**
 * Gênero e diretor: obrigatórios no cadastro; na edição, só se o filme já os tinha.
 * Filmes importados sem eles podem ter outros campos editados, e a lista que continua
 * vazia não entra no PATCH (changedFields só envia o que mudou).
 */
function validate(movie: MovieInput, initial: MovieInput, creating: boolean): MovieErrors {
  const errors: MovieErrors = {}
  if (!movie.titulo) errors.titulo = 'Informe o título.'
  if (movie.ano_lancamento === null) errors.ano_lancamento = 'Informe o ano de lançamento.'
  if (movie.generos.length === 0 && (creating || initial.generos.length > 0)) {
    errors.generos = 'Selecione ao menos um gênero.'
  }
  if (movie.diretores.length === 0 && (creating || initial.diretores.length > 0)) {
    errors.diretores = 'Informe ao menos um diretor.'
  }
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-red-400">
      {message}
    </p>
  )
}

interface MovieFormProps {
  initial?: MovieInput
  submitLabel: string
  pendingLabel: string
  cancelTo: string
  isPending: boolean
  /** Erro da mutação; 422 do servidor vira mensagem no campo correspondente. */
  error: unknown
  onSubmit: (movie: MovieInput) => void
}

export default function MovieForm({
  initial = EMPTY_MOVIE,
  submitLabel,
  pendingLabel,
  cancelTo,
  isPending,
  error,
  onSubmit,
}: MovieFormProps) {
  const genres = useGenres()
  const [clientErrors, setClientErrors] = useState<MovieErrors>({})

  const serverErrors: MovieErrors = error instanceof ApiError ? error.fieldErrors() : {}
  const errors: MovieErrors = { ...serverErrors, ...clientErrors }
  const hasFieldErrors = Object.keys(errors).length > 0
  const generalError = error instanceof Error && !hasFieldErrors ? error.message : null

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const movie = readForm(event.currentTarget)
    // Sem initial (valor padrão EMPTY_MOVIE), o formulário é de cadastro.
    const found = validate(movie, initial, initial === EMPTY_MOVIE)
    setClientErrors(found)
    if (Object.keys(found).length === 0) onSubmit(movie)
  }

  function describedBy(field: keyof MovieInput): string | undefined {
    return errors[field] ? `movie-${field}-error` : undefined
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Título
        <input
          name="titulo"
          maxLength={500}
          defaultValue={initial.titulo}
          aria-invalid={Boolean(errors.titulo)}
          aria-describedby={describedBy('titulo')}
          className={fieldClass}
        />
        <FieldError id="movie-titulo-error" message={errors.titulo} />
      </label>

      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Ano de lançamento
          <input
            name="ano_lancamento"
            type="number"
            step={1}
            inputMode="numeric"
            defaultValue={initial.ano_lancamento ?? ''}
            aria-invalid={Boolean(errors.ano_lancamento)}
            aria-describedby={describedBy('ano_lancamento')}
            className={fieldClass}
          />
          <FieldError id="movie-ano_lancamento-error" message={errors.ano_lancamento} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Diretores (separados por vírgula)
          <input
            name="diretores"
            defaultValue={initial.diretores.join(', ')}
            aria-invalid={Boolean(errors.diretores)}
            aria-describedby={describedBy('diretores')}
            className={fieldClass}
          />
          <FieldError id="movie-diretores-error" message={errors.diretores} />
        </label>
      </div>

      <fieldset
        aria-invalid={Boolean(errors.generos)}
        aria-describedby={describedBy('generos')}
        className="flex flex-col gap-2"
      >
        <legend className="mb-2 text-sm text-zinc-400">Gêneros</legend>
        {genres.isError && (
          <p role="alert" className="text-sm text-red-400">
            Não foi possível carregar os gêneros.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {genres.data?.map((genre) => (
            <label key={genre} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="generos"
                value={genre}
                defaultChecked={initial.generos.includes(genre)}
                className="size-4 accent-amber-400"
              />
              {genre}
            </label>
          ))}
        </div>
        <FieldError id="movie-generos-error" message={errors.generos} />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Sinopse
        <textarea
          name="sinopse"
          maxLength={4000}
          rows={5}
          defaultValue={initial.sinopse ?? ''}
          aria-invalid={Boolean(errors.sinopse)}
          aria-describedby={describedBy('sinopse')}
          className={fieldClass}
        />
        <FieldError id="movie-sinopse-error" message={errors.sinopse} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        URL do pôster
        <input
          name="url_poster"
          inputMode="url"
          maxLength={2048}
          placeholder="https://…"
          defaultValue={initial.url_poster ?? ''}
          aria-invalid={Boolean(errors.url_poster)}
          aria-describedby={describedBy('url_poster')}
          className={fieldClass}
        />
        <FieldError id="movie-url_poster-error" message={errors.url_poster} />
      </label>

      {generalError && (
        <p role="alert" className="text-sm text-red-400">
          {generalError}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
        <Link to={cancelTo} className="text-zinc-300 hover:text-white hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  )
}