export function isVersionOlder(local: string, minimumRequired: string): boolean {
  const cleanLocal = local.replace(/^v/, '')
  const cleanMin = minimumRequired.replace(/^v/, '')

  const localParts = cleanLocal.split('.').map(Number)
  const minParts = cleanMin.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const l = localParts[i] || 0
    const m = minParts[i] || 0
    if (l < m) return true
    if (l > m) return false
  }
  return false // Версии равны
}
