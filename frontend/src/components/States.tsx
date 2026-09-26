import { Link } from 'react-router'

// Estados de carregamento, erro e vazio, reaproveitados por todas as telas.

export function MovieNotFound() {
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

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <p role="status" className="py-16 text-center text-zinc-400">
      {label}
    </p>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : 'Algo deu errado.'
  return (
    <div role="alert" className="py-16 text-center">
      <p className="text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-zinc-700 px-4 py-2 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-16 text-center text-zinc-400">{message}</p>
}