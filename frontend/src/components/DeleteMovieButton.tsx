import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { useDeleteMovie } from '../hooks/queries.ts'
import type { FlashState } from './FlashMessage.tsx'

interface DeleteMovieButtonProps {
  movieId: string
  title: string
}

const buttonClass =
  'rounded-md px-4 py-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60'

export default function DeleteMovieButton({ movieId, title }: DeleteMovieButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const deleteMovie = useDeleteMovie(movieId)

  function confirmDelete(): void {
    deleteMovie.mutate(undefined, {
      onSuccess: () => {
        const state: FlashState = { message: `"${title}" foi removido do catálogo.` }
        navigate('/', { state })
      },
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`${buttonClass} border border-red-800 text-red-300 hover:bg-red-950`}
      >
        Remover
      </button>
      {/* <dialog> nativo com showModal(): foco preso no diálogo e Esc para fechar. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto max-w-md rounded-lg bg-zinc-900 p-6 text-zinc-100 backdrop:bg-black/70"
      >
        <h2 id="delete-title" className="text-lg font-bold">
          Remover "{title}"?
        </h2>
        <p className="mt-2 text-zinc-300">
          O filme e todas as suas avaliações serão apagados. Essa ação não pode ser desfeita.
        </p>
        {deleteMovie.isError && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {deleteMovie.error.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          {/* Cancelar vem primeiro: recebe o foco ao abrir, a opção segura. */}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={`${buttonClass} border border-zinc-700 hover:bg-zinc-800`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleteMovie.isPending}
            className={`${buttonClass} bg-red-600 text-white hover:bg-red-500`}
          >
            {deleteMovie.isPending ? 'Removendo…' : 'Remover'}
          </button>
        </div>
      </dialog>
    </>
  )
}