import { useNavigate, useParams } from 'react-router'
import { isNotFound } from '../api/client.ts'
import type { MovieInput } from '../api/types.ts'
import type { FlashState } from '../components/FlashMessage.tsx'
import MovieForm from '../components/MovieForm.tsx'
import { ErrorState, LoadingState, MovieNotFound } from '../components/States.tsx'
import { useMovie, useUpdateMovie } from '../hooks/queries.ts'
import { changedFields, toMovieInput } from '../utils/movie.ts'

export default function MovieEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const movie = useMovie(id)
  const updateMovie = useUpdateMovie(id)

  if (movie.isPending) return <LoadingState label="Carregando filme…" />
  if (movie.isError) {
    if (isNotFound(movie.error)) return <MovieNotFound />
    return <ErrorState error={movie.error} onRetry={() => movie.refetch()} />
  }

  const original = toMovieInput(movie.data)
  const detailPath = `/movies/${id}`

  function handleSubmit(edited: MovieInput): void {
    const changes = changedFields(original, edited)
    if (Object.keys(changes).length === 0) {
      const state: FlashState = { message: 'Nenhuma alteração para salvar.' }
      navigate(detailPath, { state })
      return
    }
    updateMovie.mutate(changes, {
      onSuccess: () => {
        const state: FlashState = { message: 'Filme atualizado.' }
        navigate(detailPath, { state })
      },
    })
  }

  return (
    <section aria-labelledby="edit-title" className="mx-auto flex max-w-3xl flex-col gap-6">
      <title>{`Editar ${movie.data.titulo} · Catálogo de Filmes`}</title>
      <h1 id="edit-title" className="text-2xl font-bold">
        Editar filme
      </h1>
      <MovieForm
        initial={original}
        submitLabel="Salvar alterações"
        pendingLabel="Salvando…"
        cancelTo={detailPath}
        isPending={updateMovie.isPending}
        error={updateMovie.error}
        onSubmit={handleSubmit}
      />
    </section>
  )
}