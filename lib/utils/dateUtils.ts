export function formatCardDate(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const dayNum = date.getDate()
  return `${day} ${month} ${dayNum}`
}

export function formatDayLabel(dayNumber: number): string {
  return `Day ${dayNumber}`
}
