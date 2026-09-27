import type { Meta, StoryObj } from '@storybook/react-vite'
import Rating from './Rating.tsx'

const meta = {
  title: 'Componentes/Rating',
  component: Rating,
} satisfies Meta<typeof Rating>

export default meta
type Story = StoryObj<typeof meta>

export const ComMedia: Story = {
  name: 'Com média',
  args: { media: 7.5, total: 12 },
}

export const UmaAvaliacao: Story = {
  name: 'Uma avaliação',
  args: { media: 8, total: 1 },
}

export const SemAvaliacoes: Story = {
  name: 'Sem avaliações',
  args: { media: null, total: 0 },
}