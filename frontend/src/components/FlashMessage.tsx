import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

/** Estado de navegação usado para avisar o resultado de uma ação na tela seguinte. */
export interface FlashState {
  message: string
}

const FLASH_DURATION_MS = 5000

interface Flash {
  key: string
  pathname: string
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
  const navigate = useNavigate()
  const [flash, setFlash] = useState<Flash | null>(null)
  const incoming = readMessage(location.state)

  // Ajuste de estado durante a renderização (padrão da documentação do React):
  // cada navegação com aviso vira um aviso novo; trocar de página esconde o atual.
  if (incoming !== null && flash?.key !== location.key) {
    setFlash({ key: location.key, pathname: location.pathname, message: incoming })
  } else if (flash !== null && flash.pathname !== location.pathname) {
    setFlash(null)
  }

  // Tira o aviso do histórico assim que ele aparece: voltar ou recarregar não o repete.
  const { pathname, search, hash } = location
  useEffect(() => {
    if (incoming !== null) navigate({ pathname, search, hash }, { replace: true })
  }, [incoming, pathname, search, hash, navigate])

  useEffect(() => {
    if (flash === null) return
    const timer = setTimeout(() => setFlash(null), FLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [flash])

  // A região "status" existe sempre; só o texto muda, e o leitor de tela anuncia.
  return (
    <div role="status" className="mx-auto max-w-6xl px-4">
      {flash && (
        <p className="mt-4 rounded-md border border-green-800 bg-green-950 px-4 py-2 text-green-300">
          {flash.message}
        </p>
      )}
    </div>
  )
}