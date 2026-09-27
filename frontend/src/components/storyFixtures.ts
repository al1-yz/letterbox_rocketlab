import type { MovieSummary } from '../api/types.ts'

// Dados de exemplo das stories. Nada aqui é importado pela aplicação.

// Pôster fictício ("Horizonte Âmbar"): título, tagline e créditos inventados. Os textos
// usam textLength para manter o layout mesmo com outra fonte instalada no sistema.
const SAMPLE_POSTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c0a09"/>
      <stop offset=".5" stop-color="#1c1310"/>
      <stop offset="1" stop-color="#09090b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#f59e0b" stop-opacity=".5"/>
      <stop offset=".45" stop-color="#b45309" stop-opacity=".15"/>
      <stop offset="1" stop-color="#b45309" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sun" cx="50%" cy="35%" r="70%">
      <stop offset="0" stop-color="#fef3c7"/>
      <stop offset=".3" stop-color="#fbbf24"/>
      <stop offset=".7" stop-color="#d97706"/>
      <stop offset="1" stop-color="#7c2d12"/>
    </radialGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140f0c"/>
      <stop offset="1" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".75"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="400" height="600" fill="url(#bg)"/>
  <rect width="400" height="600" fill="url(#glow)"/>

  <g fill="#fef3c7">
    <circle cx="48" cy="92" r="1.1" opacity=".7"/>
    <circle cx="92" cy="150" r=".8" opacity=".5"/>
    <circle cx="330" cy="84" r="1.2" opacity=".6"/>
    <circle cx="360" cy="170" r=".8" opacity=".5"/>
    <circle cx="268" cy="118" r=".7" opacity=".4"/>
    <circle cx="130" cy="96" r=".7" opacity=".4"/>
    <circle cx="36" cy="232" r=".9" opacity=".4"/>
    <circle cx="372" cy="258" r=".9" opacity=".4"/>
  </g>

  <g fill="none" stroke="#f59e0b">
    <circle cx="200" cy="250" r="126" stroke-opacity=".28"/>
    <circle cx="200" cy="250" r="158" stroke-opacity=".14"/>
    <ellipse cx="200" cy="250" rx="176" ry="30" stroke-opacity=".3" transform="rotate(-14 200 250)"/>
  </g>
  <circle cx="200" cy="250" r="96" fill="url(#sun)"/>

  <polygon points="194,350 206,350 202.5,150 197.5,150" fill="#0c0a09"/>
  <path d="M0 372 L58 326 L104 350 L158 304 L200 322 L246 292 L298 338 L344 312 L400 346 V600 H0 Z"
    fill="url(#ground)"/>
  <path d="M0 372 L58 326 L104 350 L158 304 L200 322 L246 292 L298 338 L344 312 L400 346"
    fill="none" stroke="#fbbf24" stroke-opacity=".6" stroke-width="1.2"/>

  <rect width="400" height="600" filter="url(#grain)" opacity=".07"/>
  <rect width="400" height="600" fill="url(#vignette)"/>

  <g font-family="Helvetica, Arial, sans-serif" text-anchor="middle">
    <text x="200" y="54" font-size="11" letter-spacing="3" fill="#e7e5e4" fill-opacity=".8"
      textLength="300" lengthAdjust="spacing">QUANDO O SOL SE APAGAR, SIGA A LUZ.</text>

    <text x="200" y="436" font-family="Arial Black, Helvetica, Arial, sans-serif" font-weight="900"
      font-size="30" fill="#fafaf9" textLength="292" lengthAdjust="spacing">HORIZONTE</text>
    <text x="200" y="500" font-family="Arial Black, Helvetica, Arial, sans-serif" font-weight="900"
      font-size="66" fill="url(#title)" textLength="300" lengthAdjust="spacingAndGlyphs">ÂMBAR</text>

    <line x1="150" y1="518" x2="250" y2="518" stroke="#f59e0b" stroke-opacity=".6"/>
    <text x="200" y="537" font-size="10" letter-spacing="3" fill="#a8a29e"
      textLength="236" lengthAdjust="spacing">AÇÃO · FICÇÃO CIENTÍFICA · 2023</text>

    <g font-family="Arial Narrow, Helvetica, Arial, sans-serif" font-size="6.5" fill="#78716c">
      <text x="200" y="563" textLength="336" lengthAdjust="spacingAndGlyphs">ESTÚDIO VÉSPERA
        APRESENTA · UM FILME DE ANA LIMA · COM BRUNO REIS · CARLA DIAS · DIEGO NUNES</text>
      <text x="200" y="573" textLength="336" lengthAdjust="spacingAndGlyphs">MÚSICA ELISA PRADO ·
        FOTOGRAFIA FÁBIO RAMOS · ROTEIRO GIL MORAES · PRODUÇÃO HELENA COSTA</text>
    </g>
    <text x="200" y="589" font-size="7" letter-spacing="3" fill="#a8a29e" fill-opacity=".75"
      textLength="120" lengthAdjust="spacing">EM BREVE NOS CINEMAS</text>
  </g>
</svg>`

/** Pôster embutido em SVG: as stories não dependem de internet nem de arquivo externo. */
export const SAMPLE_POSTER = `data:image/svg+xml,${encodeURIComponent(SAMPLE_POSTER_SVG.trim())}`

/** Imagem inválida embutida: o navegador falha ao decodificar e o Poster mostra o substituto. */
export const BROKEN_POSTER = 'data:image/jpeg;base64,AAAA'

// Filme fictício, o mesmo do pôster de exemplo.
export const SAMPLE_MOVIE: MovieSummary = {
  id: 'exemplo',
  titulo: 'Horizonte Âmbar',
  ano_lancamento: 2023,
  url_poster: SAMPLE_POSTER,
  generos: ['Action', 'Science Fiction'],
  media: 7.5,
  total_avaliacoes: 12,
}