import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import { fn } from 'storybook/test'
import Pagination from './Pagination.tsx'

// A página fica em estado local para os botões e o "Ir para a página" funcionarem na
// story; cada mudança também aparece no painel Actions (onChange).
function InteractivePagination({ page, pages, onChange }: ComponentProps<typeof Pagination>) {
  const [current, setCurrent] = useState(page)
  return (
    <Pagination
      page={current}
      pages={pages}
      onChange={(next) => {
        setCurrent(next)
        onChange(next)
      }}
    />
  )
}

const meta = {
  title: 'Componentes/Pagination',
  component: Pagination,
  args: { onChange: fn() },
  // key: mudar page ou pages nos controles recomeça a story com os novos valores.
  render: (args) => <InteractivePagination key={`${args.page}/${args.pages}`} {...args} />,
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const PrimeiraPagina: Story = {
  name: 'Primeira página',
  args: { page: 1, pages: 3986 },
}

export const PaginaDoMeio: Story = {
  name: 'Página do meio',
  args: { page: 50, pages: 3986 },
}

export const UltimaPagina: Story = {
  name: 'Última página',
  args: { page: 3986, pages: 3986 },
}

export const PoucasPaginas: Story = {
  name: 'Poucas páginas',
  args: { page: 2, pages: 3 },
}