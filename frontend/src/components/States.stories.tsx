import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { fn } from 'storybook/test'
import { EmptyState, ErrorState, LoadingState, MovieNotFound } from './States.tsx'

// Vários componentes no mesmo arquivo: os args guardam só as ações, que aparecem no
// painel Actions quando os botões são clicados.
interface StoryActions {
  onRetry: () => void
  onClear: () => void
}

const meta = {
  title: 'Componentes/States',
  args: { onRetry: fn(), onClear: fn() },
} satisfies Meta<StoryActions>

export default meta
type Story = StoryObj<StoryActions>

export const Carregando: Story = {
  render: () => <LoadingState label="Carregando filmes…" />,
}

export const Erro: Story = {
  render: ({ onRetry }) => (
    <ErrorState error={new Error('A API respondeu com erro 502.')} onRetry={onRetry} />
  ),
}

export const Vazio: Story = {
  render: () => <EmptyState message="Nenhum filme encontrado com esses filtros." />,
}

export const VazioComAcao: Story = {
  name: 'Vazio com ação',
  render: ({ onClear }) => (
    <EmptyState
      message="Nenhum filme encontrado com esses filtros."
      action={
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-zinc-700 px-4 py-2 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          Limpar filtros
        </button>
      }
    />
  ),
}

export const FilmeNaoEncontrado: Story = {
  name: 'Filme não encontrado',
  // O link "Voltar ao catálogo" precisa de um roteador.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => <MovieNotFound />,
}