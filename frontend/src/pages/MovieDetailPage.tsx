import { useParams } from 'react-router'

// Provisório: a Rodada 3 implementa o detalhe e as avaliações.
export default function MovieDetailPage() {
  const { id } = useParams()
  return <h1 className="text-2xl font-bold">Filme {id}</h1>
}