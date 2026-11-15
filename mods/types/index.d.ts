// files (folder-view)
/** A path relative to the session's working directory; '' is the directory itself. */
export type RelPath = string
/** What the markers compare with: the branch's fork point, or HEAD alone. */
export type CompareMode = 'branch' | 'uncommitted'
/** How the preview shows a file: its text, or its diff against the compare point. */
export type PreviewMode = 'content' | 'diff'

// implement-spec-board
export type TicketState =
  | 'done'
  | 'active'
  | 'ready'
  | 'blocked'
  | 'human'
  | 'triage'
  | 'wontfix'

export type Ticket = {
  num: string
  title: string
  rawStatus: string
  progress?: string
  blockedBy: string[]
  state: TicketState
  level: number
}

export type Board = {
  slug: string
  root: string
  specTitle: string
  specStatus: string
  hasSpec: boolean
  tickets: Ticket[]
  features: string[]
  loadedAt: number
  error?: string
}

declare module 'claude-code' {
  interface PluginState {
    'phassle-mods': {
      // files
      expanded: Shaped<RelPath[]>
      collapsed: Shaped<RelPath[]>
      tick: Shaped<number>
      changedOnly: Shaped<boolean>
      mode: Shaped<CompareMode>
      touched: Shaped<string[]>
      preview: Shaped<RelPath>
      previewMode: Shaped<PreviewMode>
      // implement-spec-board
      board: Shaped<Board | null>
      selected: string | null
      countdown: number
    }
  }
}
