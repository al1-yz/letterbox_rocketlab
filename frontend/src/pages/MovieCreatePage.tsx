import { useNavigate } from 'react-router'
import type { MovieInput } from '../api/types.ts'
import type { FlashState } from '../components/FlashMessage.tsx'
import MovieForm from '../components/MovieForm.tsx'
import { useCreateMovie } from '../hooks/queries.ts'

export default function MovieCreatePage() {
  const navigate = useNavigate()
  const createMovie = useCreateMovie()

  function handleSubmit(movie: MovieInput): void {
    createMovie.mutate(movie, {
      onSuccess: (created) => {
        const state: FlashState = { message: 'Filme cadastrado.' }
        navigate(`/movies/${created.id}`, { state })
      },
    })
  }

  return (
    <section aria-labelledby="create-title" className="mx-auto flex max-w-3xl flex-col gap-6">
      <title>Cadastrar filme · Catálogo de Filmes</title>
      <h1 id="create-title" className="text-2xl font-bold">
        Cadastrar filme
      </h1>
      <MovieForm
        submitLabel="Cadastrar"
        pendingLabel="Cadastrando…"
        cancelTo="/"
        isPending={createMovie.isPending}
        error={createMovie.error}
        onSubmit={handleSubmit}
      />
    </section>
  )
}