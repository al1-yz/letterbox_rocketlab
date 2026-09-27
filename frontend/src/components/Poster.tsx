import { useState } from 'react'

interface PosterProps {
  url: string | null
  title: string
  className?: string
}

/** Pôster com substituto para filmes sem imagem (8.241 na base) ou com URL que falha. */
export default function Poster({ url, title, className = '' }: PosterProps) {
  // Guarda qual URL falhou: se a URL mudar (edição do filme), a nova é tentada.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const frame = `aspect-[2/3] w-full rounded-md bg-zinc-800 ${className}`

  if (!url || url === failedUrl) {
    return (
      // aria-hidden: o título já aparece em texto ao lado, e o leitor de tela não o repete.
      <div
        aria-hidden="true"
        className={`${frame} flex flex-col items-center justify-center gap-3 border border-zinc-700 p-3 text-center`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="size-10 text-zinc-500"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" />
        </svg>
        <span className="line-clamp-4 text-sm font-medium text-zinc-300">{title}</span>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailedUrl(url)}
      className={`${frame} object-cover`}
    />
  )
}