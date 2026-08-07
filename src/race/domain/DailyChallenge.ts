/**
 * The day a challenge belongs to, as `YYYY-MM-DD`.
 *
 * Anchored to Argentine time rather than to whoever is playing. Two people
 * comparing results have to be comparing the same race, and a local calendar
 * would hand a player in Madrid tomorrow's challenge while it is still today
 * here. UTC would be worse: it rolls over at nine in the evening, in the middle
 * of the hours people actually play.
 */
const ARGENTINA_UTC_OFFSET_MS = -3 * 60 * 60 * 1000

export function dayIdAt(now: number): string {
  return new Date(now + ARGENTINA_UTC_OFFSET_MS).toISOString().slice(0, 10)
}

/** How the day reads on screen: "6 de agosto". */
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function formatDayId(dayId: string): string {
  const [, month = '', day = ''] = dayId.split('-')
  const name = MONTHS[Number(month) - 1]
  return name === undefined ? dayId : `${Number(day)} de ${name}`
}
