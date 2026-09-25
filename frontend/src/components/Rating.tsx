import { formatRating, pluralize } from '../utils/format.ts'

interface RatingProps {
  media: number | null
  total: number
}

/** Média na escala 0–10 da API; a estrela é só decoração. */
export default function Rating({ media, total }: RatingProps) {
  if (media === null) {
    return <span className="text-sm text-zinc-400">Sem avaliações</span>
  }
  return (
    <span className="text-sm text-zinc-300">
      {/* Leitores de tela ouvem a frase completa; a parte visual fica oculta para eles. */}
      <span className="sr-only">
        Nota média {formatRating(media)} de 10, {pluralize(total, 'avaliação', 'avaliações')}
      </span>
      <span aria-hidden="true">
        <span className="text-amber-400">★</span>{' '}
        <span className="font-semibold text-white">{formatRating(media)}</span>
        <span className="text-zinc-400"> ({total.toLocaleString('pt-BR')})</span>
      </span>
    </span>
  )
}