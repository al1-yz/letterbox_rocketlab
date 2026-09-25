import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-zinc-400">O endereço acessado não existe.</p>
      <Link to="/" className="mt-6 inline-block text-amber-400 hover:underline">
        Voltar ao catálogo
      </Link>
    </section>
  )
}