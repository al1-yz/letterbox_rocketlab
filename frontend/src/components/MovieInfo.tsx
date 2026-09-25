import type { MovieDetail } from '../api/types.ts'
import { formatDuration, formatRating, pluralize } from '../utils/format.ts'
import Poster from './Poster.tsx'

interface MovieInfoProps {
  movie: MovieDetail
}

function Credits({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null
  return (
    <div>
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd>{names.join(', ')}</dd>
    </div>
  )
}

export default function MovieInfo({ movie }: MovieInfoProps) {
  const details = [
    movie.ano_lancamento,
    movie.duracao_minutos !== null && formatDuration(movie.duracao_minutos),
    movie.status_filme,
  ].filter(Boolean)

  return (
    <article className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <Poster url={movie.url_poster} title={movie.titulo} className="max-w-64" />
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">{movie.titulo}</h1>
          {details.length > 0 && <p className="mt-1 text-zinc-400">{details.join(' · ')}</p>}
        </div>

        {movie.generos.length > 0 && (
          <ul aria-label="Gêneros" className="flex flex-wrap gap-2">
            {movie.generos.map((genre) => (
              <li key={genre} className="rounded-full bg-zinc-800 px-3 py-1 text-sm">
                {genre}
              </li>
            ))}
          </ul>
        )}

        <p className="text-lg">
          {movie.media === null ? (
            <span className="text-zinc-400">Ainda sem avaliações</span>
          ) : (
            <>
              <span aria-hidden="true" className="text-amber-400">
                ★{' '}
              </span>
              <span className="text-2xl font-bold">{formatRating(movie.media)}</span>
              <span className="text-zinc-400">
                {' '}
                / 10 · {pluralize(movie.total_avaliacoes, 'avaliação', 'avaliações')}
              </span>
            </>
          )}
        </p>

        <p className="leading-relaxed text-zinc-300">
          {movie.sinopse ?? 'Sinopse não informada.'}
        </p>

        <dl className="grid gap-3 sm:grid-cols-2">
          <Credits label="Direção" names={movie.diretores} />
          <Credits label="Roteiro" names={movie.roteiristas} />
          <Credits label="Elenco" names={movie.elenco} />
          <Credits label="Produção" names={movie.produtoras} />
        </dl>
      </div>
    </article>
  )
}