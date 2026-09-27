import { Link, useParams } from 'react-router'
import { isNotFound } from '../api/client.ts'
import DeleteMovieButton from '../components/DeleteMovieButton.tsx'
import MovieInfo from '../components/MovieInfo.tsx'
import ReviewForm from '../components/ReviewForm.tsx'
import ReviewList from '../components/ReviewList.tsx'
import { ErrorState, LoadingState, MovieNotFound } from '../components/States.tsx'
import { useMovie, useReviews } from '../hooks/queries.ts'
import { formatTitle } from '../utils/format.ts'

export default function MovieDetailPage() {
  const { id = '' } = useParams()
  const movie = useMovie(id)
  const reviews = useReviews(id)

  if (movie.isPending) return <LoadingState label="Carregando filme…" />
  if (movie.isError) {
    if (isNotFound(movie.error)) return <MovieNotFound />
    return <ErrorState error={movie.error} onRetry={() => movie.refetch()} />
  }

  const title = formatTitle(movie.data.titulo)

  return (
    <div className="flex flex-col gap-12">
      {/* React 19 leva o <title> para o <head>: a aba mostra o filme aberto. */}
      <title>{`${title} · Catálogo de Filmes`}</title>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-3">
          <Link
            to={`/movies/${id}/edit`}
            className="rounded-md border border-zinc-700 px-4 py-2 font-semibold hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            Editar
          </Link>
          <DeleteMovieButton movieId={id} title={title} />
        </div>
        <MovieInfo movie={movie.data} />
      </div>

      <section aria-labelledby="reviews-title" className="flex flex-col gap-6">
        <h2 id="reviews-title" className="text-2xl font-bold">
          Avaliações
        </h2>
        <ReviewForm movieId={id} />
        {reviews.isPending && <LoadingState label="Carregando avaliações…" />}
        {reviews.isError && <ErrorState error={reviews.error} onRetry={() => reviews.refetch()} />}
        {reviews.isSuccess && <ReviewList reviews={reviews.data} />}
      </section>
    </div>
  )
}