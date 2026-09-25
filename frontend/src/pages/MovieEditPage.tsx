import { useParams } from 'react-router'

// Provisório: a Rodada 4 implementa a edição.
export default function MovieEditPage() {
  const { id } = useParams()
  return <h1 className="text-2xl font-bold">Editar filme {id}</h1>
}