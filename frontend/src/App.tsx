import { NavLink, Route, Routes } from 'react-router'
import CatalogPage from './pages/CatalogPage.tsx'
import MovieCreatePage from './pages/MovieCreatePage.tsx'
import MovieDetailPage from './pages/MovieDetailPage.tsx'
import MovieEditPage from './pages/MovieEditPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'text-amber-400' : 'text-zinc-300 hover:text-white'
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4"
        >
          <NavLink to="/" className="mr-auto text-lg font-bold text-white">
            Catálogo de Filmes
          </NavLink>
          <NavLink to="/" end className={navLinkClass}>
            Catálogo
          </NavLink>
          <NavLink to="/movies/new" className={navLinkClass}>
            Cadastrar filme
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/movies/new" element={<MovieCreatePage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/movies/:id/edit" element={<MovieEditPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}