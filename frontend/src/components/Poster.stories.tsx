import type { Meta, StoryObj } from '@storybook/react-vite'
import Poster from './Poster.tsx'
import { BROKEN_POSTER, SAMPLE_POSTER } from './storyFixtures.ts'

const meta = {
  title: 'Componentes/Poster',
  component: Poster,
  args: { title: 'Filme de exemplo' },
  // Largura próxima à de um card do catálogo.
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Poster>

export default meta
type Story = StoryObj<typeof meta>

export const ComImagem: Story = {
  name: 'Com imagem',
  args: { url: SAMPLE_POSTER },
}

export const SemImagem: Story = {
  name: 'Sem imagem (url nula)',
  args: { url: null },
}

export const ImagemQuebrada: Story = {
  name: 'Imagem quebrada (onError)',
  args: { url: BROKEN_POSTER },
}