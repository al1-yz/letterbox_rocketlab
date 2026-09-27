const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

/** 7.5 → "7,5" (escala 0–10 da API, sempre com uma casa decimal). */
export function formatRating(value: number): string {
  return oneDecimal.format(value)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : plural}`
}

/** A API envia UTC ("...Z"); o navegador converte para o fuso de quem está vendo. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

// Palavra de I, V e X com só a inicial maiúscula ("Ii", "Viii"), isolada por
// caracteres que não são letras nem dígitos ("Xixón" e "6ix" ficam de fora).
const ROMAN_TOKEN = /(?<![\p{L}\p{N}])[IVX][ivx]+(?![\p{L}\p{N}])/gu
const ROMAN_NUMERAL = /^X{0,3}(IX|IV|V?I{0,3})$/
// Também são palavras e nomes na base: "Me Vi", "Xi Jinping".
const AMBIGUOUS = new Set(['VI', 'XI'])

/**
 * A base grava títulos em Title Case ("The Nun Ii"). Só na exibição, numerais
 * romanos claros voltam a maiúsculas; o valor armazenado não muda.
 */
export function formatTitle(title: string): string {
  return title.replace(ROMAN_TOKEN, (token) => {
    const upper = token.toUpperCase()
    return ROMAN_NUMERAL.test(upper) && !AMBIGUOUS.has(upper) ? upper : token
  })
}

/** 102 → "1h 42min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}min` : `${rest}min`
}