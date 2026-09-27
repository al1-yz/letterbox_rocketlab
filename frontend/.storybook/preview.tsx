/// <reference types="vite/client" />

import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    // Mesmo fundo e cor de texto da div raiz do App: o escuro não vem do <body>.
    (Story) => (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
        <Story />
      </div>
    ),
  ],
}

export default preview