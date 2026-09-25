import { Link } from 'react-router'
import type { MovieSummary } from '../api/types.ts'
import Poster from './Poster.tsx'
import Rating from './Rating.tsx'

interface MovieCardProps {
  movie: MovieSummary
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block rounded-lg p-2 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <Poster url={movie.url_poster} title={movie.titulo} />
      <h2 className="mt-2 line-clamp-2 font-semibold text-white group-hover:text-amber-400">
        {movie.titulo}
      </h2>
      <p className="text-sm text-zinc-400">
        {movie.ano_lancamento ?? 'Ano desconhecido'}
        {movie.generos.length > 0 && ` · ${movie.generos.slice(0, 2).join(', ')}`}
      </p>
      <div className="mt-1">
        <Rating media={movie.media} total={movie.total_avaliacoes} />
      </div>
    </Link>
  )
}