import { Link } from 'react-router'
import type { MovieSummary } from '../api/types.ts'
import { formatTitle } from '../utils/format.ts'
import Poster from './Poster.tsx'
import Rating from './Rating.tsx'

interface MovieCardProps {
  movie: MovieSummary
}

export default function MovieCard({ movie }: MovieCardProps) {
  const title = formatTitle(movie.titulo)
  // Elevação de 4 px e zoom de 2% no pôster, no hover e no foco do teclado. Movimento só
  // com motion-safe, que respeita "reduzir movimento" do sistema; as cores sempre transicionam.
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block rounded-lg p-2 transition-colors duration-200 ease-out hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-400 motion-safe:transition motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1"
    >
      {/* overflow-hidden recorta o zoom dentro da moldura: o layout não muda. */}
      <div className="overflow-hidden rounded-md">
        <Poster
          url={movie.url_poster}
          title={title}
          className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-visible:scale-[1.02]"
        />
      </div>
      <h2 className="mt-2 line-clamp-2 font-semibold text-white transition-colors duration-200 group-hover:text-amber-400 group-focus-visible:text-amber-400">
        {title}
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