import type { Review } from '../api/types.ts'
import { formatDateTime, formatRating } from '../utils/format.ts'

interface ReviewListProps {
  reviews: Review[]
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-zinc-400">Nenhuma avaliação ainda.</p>
  }
  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-lg border border-zinc-800 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{review.nome}</p>
            <p>
              <span aria-hidden="true" className="text-amber-400">
                ★{' '}
              </span>
              <span className="font-semibold">{formatRating(review.nota)}</span>
              <span className="text-zinc-400"> / 10</span>
            </p>
          </div>
          <p className="mt-2 whitespace-pre-line text-zinc-300">{review.comentario}</p>
          <p className="mt-2 text-sm text-zinc-500">
            <time dateTime={review.created_at}>{formatDateTime(review.created_at)}</time>
          </p>
        </li>
      ))}
    </ul>
  )
}