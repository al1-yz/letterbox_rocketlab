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

/** 102 → "1h 42min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}min` : `${rest}min`
}