interface PosterProps {
  url: string | null
  title: string
  className?: string
}

/** Pôster com substituto para os filmes sem imagem (8.241 na base). */
export default function Poster({ url, title, className = '' }: PosterProps) {
  const frame = `aspect-[2/3] w-full rounded-md bg-zinc-800 ${className}`
  if (!url) {
    return (
      <div className={`${frame} flex items-center justify-center p-3 text-center`}>
        <span className="text-sm text-zinc-400">{title}</span>
      </div>
    )
  }
  // alt vazio: o título já aparece em texto ao lado, e o leitor de tela não o repete.
  return <img src={url} alt="" loading="lazy" className={`${frame} object-cover`} />
}