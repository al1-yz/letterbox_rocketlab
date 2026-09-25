import { Link, useParams } from 'react-router'
import { isNotFound } from '../api/client.ts'
import MovieInfo from '../components/MovieInfo.tsx'
import ReviewForm from '../components/ReviewForm.tsx'
import ReviewList from '../components/ReviewList.tsx'
import { ErrorState, LoadingState } from '../components/States.tsx'
import { useMovie, useReviews } from '../hooks/queries.ts'

export default function MovieDetailPage() {
  const { id = '' } = useParams()
  const movie = useMovie(id)
  const reviews = useReviews(id)

  if (movie.isPending) return <LoadingState label="Carregando filme…" />
  if (movie.isError) {
    if (isNotFound(movie.error)) {
      return (
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold">Filme não encontrado</h1>
          <p className="mt-2 text-zinc-400">Ele pode ter sido removido do catálogo.</p>
          <Link to="/" className="mt-6 inline-block text-amber-400 hover:underline">
            Voltar ao catálogo
          </Link>
        </section>
      )
    }
    return <ErrorState error={movie.error} onRetry={() => movie.refetch()} />
  }

  return (
    <div className="flex flex-col gap-12">
      {/* React 19 leva o <title> para o <head>: a aba mostra o filme aberto. */}
      <title>{`${movie.data.titulo} · Catálogo de Filmes`}</title>
      <MovieInfo movie={movie.data} />

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