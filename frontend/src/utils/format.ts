const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 7.5 → "7,5" (escala 0–10 da API, sempre com uma casa decimal). */
export function formatRating(value: number): string {
  return oneDecimal.format(value)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : plural}`
}