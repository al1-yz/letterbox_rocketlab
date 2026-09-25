import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client.ts'
import type { ReviewInput } from '../api/types.ts'
import { useCreateReview } from '../hooks/queries.ts'

type ReviewErrors = Partial<Record<keyof ReviewInput, string>>

const fieldClass =
  'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400 aria-[invalid=true]:border-red-500'

/** Campos obrigatórios também não podem ser só espaços (o backend recusa). */
function validate(review: ReviewInput): ReviewErrors {
  const errors: ReviewErrors = {}
  if (!review.nome) errors.nome = 'Informe o nome de quem avaliou.'
  if (!review.comentario) errors.comentario = 'Escreva a resenha.'
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

export default function ReviewForm({ movieId }: { movieId: string }) {
  const createReview = useCreateReview(movieId)
  const [errors, setErrors] = useState<ReviewErrors>({})
  const [published, setPublished] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const review: ReviewInput = {
      nome: String(data.get('nome') ?? '').trim(),
      nota: Number(data.get('nota')),
      comentario: String(data.get('comentario') ?? '').trim(),
    }

    const found = validate(review)
    setErrors(found)
    setPublished(false)
    if (Object.keys(found).length > 0) return

    createReview.mutate(review, {
      onSuccess: () => {
        form.reset()
        setPublished(true)
      },
      onError: (error) => {
        if (error instanceof ApiError) setErrors(error.fieldErrors())
      },
    })
  }

  const hasFieldErrors = Object.keys(errors).length > 0
  const generalError = createReview.isError && !hasFieldErrors ? createReview.error : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-zinc-900/60 p-4">
      <h3 className="font-semibold">Nova avaliação</h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Nome
          <input
            name="nome"
            required
            maxLength={120}
            aria-invalid={Boolean(errors.nome)}
            aria-describedby={errors.nome ? 'review-nome-error' : undefined}
            className={fieldClass}
          />
          <FieldError id="review-nome-error" message={errors.nome} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Nota (0 a 10)
          <input
            name="nota"
            type="number"
            required
            min={0}
            max={10}
            step={0.1}
            inputMode="decimal"
            aria-invalid={Boolean(errors.nota)}
            aria-describedby={errors.nota ? 'review-nota-error' : undefined}
            className={fieldClass}
          />
          <FieldError id="review-nota-error" message={errors.nota} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Resenha
        <textarea
          name="comentario"
          required
          maxLength={4000}
          rows={4}
          aria-invalid={Boolean(errors.comentario)}
          aria-describedby={errors.comentario ? 'review-comentario-error' : undefined}
          className={fieldClass}
        />
        <FieldError id="review-comentario-error" message={errors.comentario} />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={createReview.isPending}
          className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {createReview.isPending ? 'Publicando…' : 'Publicar avaliação'}
        </button>
        <p role="status" className="text-sm text-green-400">
          {published && 'Avaliação publicada.'}
        </p>
      </div>
      {generalError && (
        <p role="alert" className="text-sm text-red-400">
          {generalError.message}
        </p>
      )}
    </form>
  )
}