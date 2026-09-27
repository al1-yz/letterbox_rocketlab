import type { StorybookConfig } from '@storybook/react-vite'

// Configuração manual e enxuta: o builder usa o vite.config.ts do projeto (React e
// Tailwind), então as stories têm os mesmos estilos da aplicação.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  // Sem envio de telemetria e sem o aviso de novidades no painel.
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
}

export default config