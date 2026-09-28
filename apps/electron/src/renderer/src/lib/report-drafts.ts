export type ReportDraft = {
  templateId: number | null
  criteria: Record<string, string>
  updatedAt: number
}

const getDraftKey = (userId: string | null | undefined, reportId: number) =>
  `btw-app:report-draft:${userId || 'anonymous'}:${reportId}`

export function loadReportDraft(
  userId: string | null | undefined,
  reportId: number,
  templateId: number | null
): Record<string, string> {
  try {
    const raw = localStorage.getItem(getDraftKey(userId, reportId))
    if (!raw) return {}

    const draft = JSON.parse(raw) as Partial<ReportDraft>
    if (draft.templateId !== templateId || !draft.criteria) return {}

    return draft.criteria
  } catch {
    return {}
  }
}

export function saveReportDraft(
  userId: string | null | undefined,
  reportId: number,
  templateId: number | null,
  criteria: Record<string, string>
) {
  try {
    localStorage.setItem(
      getDraftKey(userId, reportId),
      JSON.stringify({ templateId, criteria, updatedAt: Date.now() } satisfies ReportDraft)
    )
  } catch {
    // A full disk or disabled storage must not block report editing.
  }
}

export function clearReportDraft(userId: string | null | undefined, reportId: number) {
  try {
    localStorage.removeItem(getDraftKey(userId, reportId))
  } catch {
    // Ignore unavailable storage during cleanup.
  }
}
