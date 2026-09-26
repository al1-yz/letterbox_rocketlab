import { useLocation } from 'react-router'

/** Estado de navegação usado para avisar o resultado de uma ação na tela seguinte. */
export interface FlashState {
  message: string
}

function readMessage(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'message' in state) {
    return typeof state.message === 'string' ? state.message : null
  }
  return null
}

export default function FlashMessage() {
  const location = useLocation()
  const message = readMessage(location.state)
  // A região "status" existe sempre; só o texto muda, e o leitor de tela anuncia.
  return (
    <div role="status" className="mx-auto max-w-6xl px-4">
      {message && (
        <p className="mt-4 rounded-md border border-green-800 bg-green-950 px-4 py-2 text-green-300">
          {message}
        </p>
      )}
    </div>
  )
}