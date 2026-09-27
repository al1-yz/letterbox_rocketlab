import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import MovieCard from './MovieCard.tsx'
import { SAMPLE_MOVIE } from './storyFixtures.ts'

const meta = {
  title: 'Componentes/MovieCard',
  component: MovieCard,
  args: { movie: SAMPLE_MOVIE },
  decorators: [
    // O card é um <Link>: precisa de um roteador. Largura próxima à do catálogo.
    (Story) => (
      <MemoryRouter>
        <div className="w-48">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MovieCard>

export default meta
type Story = StoryObj<typeof meta>

export const Completo: Story = {}

export const SemPoster: Story = {
  name: 'Sem pôster',
  args: { movie: { ...SAMPLE_MOVIE, url_poster: null } },
}

export const SemGeneroNemAvaliacoes: Story = {
  name: 'Sem gênero nem avaliações',
  args: { movie: { ...SAMPLE_MOVIE, generos: [], media: null, total_avaliacoes: 0 } },
}

export const NumeralRomano: Story = {
  name: 'Numeral romano no título',
  args: { movie: { ...SAMPLE_MOVIE, titulo: 'The Nun Ii', url_poster: null } },
}