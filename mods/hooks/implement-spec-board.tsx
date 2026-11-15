import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Board, Ticket, TicketState } from '../types'

// Reads the "Local Markdown" issue tracker used with Matt Pocock's skills:
//   spec:    docs/<slug>/spec.md
//   tickets: .scratch/<slug>/issues/NN-<slug>.md   (**Status:** / **Blocked by:** lines)
//   live:    any .scratch/<slug>/*.md with a "| NN | state | ... |" progress table
//            (the implement-spec orchestrator's state file); its state wins.

const PANE = 'implement-spec-board'
const POLL_SECONDS = 3 * 60

const board = atom({ plugin: 'phassle', key: 'board' } as const, null, {
  shape: 'board-1',
})
const selected = atom({ plugin: 'phassle', key: 'selected' } as const, null)
const countdown = atom({ plugin: 'phassle', key: 'countdown' } as const, POLL_SECONDS)

// Matched anywhere in the state text ("implementer running (worktree wt/01)").
// Active wins over done: "implementer done, merger running" is not merged yet.
const DONE = /\b(resolved|done|merged|closed|complete|completed|fixed|finished)\b/
const ACTIVE = /\b(claimed|running|in[- ]?progress|implementing|wip|started|reviewing|merging|building|testing|fixing)\b/

const join = (...parts: string[]) => parts.join('/').replace(/\/+/g, '/')
const pad = (n: string) => n.padStart(2, '0')

async function tryList($: EngineInterface, p: string) {
  try {
    return await $.fs.list(p)
  } catch {
    return null
  }
}

async function tryRead($: EngineInterface, p: string) {
  try {
    return await $.fs.read(p)
  } catch {
    return null
  }
}

/** The folder holding `.scratch`: the cwd, a child of it (e.g. Code/), or a parent. */
async function findRoot($: EngineInterface, cwd: string): Promise<string | null> {
  const has = async (dir: string) =>
    (await tryList($, dir))?.some(e => e.name === '.scratch' && e.kind === 'dir') ?? false
  if (await has(cwd)) return cwd
  for (const e of (await tryList($, cwd)) ?? []) {
    if (e.kind === 'dir' && !e.name.startsWith('.') && (await has(join(cwd, e.name))))
      return join(cwd, e.name)
  }
  let dir = cwd
  while (dir.includes('/') && dir !== '/') {
    dir = dir.slice(0, dir.lastIndexOf('/')) || '/'
    if (await has(dir)) return dir
  }
  return null
}

/** Features with an issues folder, newest activity first. */
async function findFeatures($: EngineInterface, root: string) {
  const out: { slug: string; mtime: number }[] = []
  for (const e of (await tryList($, join(root, '.scratch'))) ?? []) {
    if (e.kind !== 'dir') continue
    const issues = await tryList($, join(root, '.scratch', e.name, 'issues'))
    if (!issues) continue
    const mtime = Math.max(0, ...issues.map(i => i.mtimeMs))
    out.push({ slug: e.name, mtime })
  }
  return out.sort((a, b) => b.mtime - a.mtime).map(f => f.slug)
}

function field(text: string, name: string): string | null {
  const m = text.match(new RegExp(`^\\W*${name}\\W*:\\**\\s*(.+)$`, 'im'))
  return m?.[1] ? m[1].replace(/\*+/g, '').trim() : null
}

function parseTicket(file: string, text: string) {
  const num = pad(file.match(/^(\d+)/)?.[1] ?? '?')
  const heading = text.match(/^#\s+(.+)$/m)?.[1] ?? file
  const title = heading.replace(/^\d+\s*[:.\-–]\s*/, '').trim()
  const rawStatus = ((field(text, 'Status') ?? 'unknown').split(/[\s(]/)[0] ?? 'unknown').toLowerCase()
  const blockedLine = field(text, 'Blocked by') ?? ''
  const blockedBy = /^(none|-|—|n\/a)?$/i.test(blockedLine.trim())
    ? []
    : [...blockedLine.replace(/\([^)]*\)/g, '').matchAll(/\b(\d{1,3})\b/g)].map(m => pad(m[1] ?? ''))
  return { num, title, rawStatus, blockedBy }
}

function parseProgress(text: string, into: Map<string, string>) {
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(\d{1,3})\b[^|]*\|\s*([^|]+?)\s*\|/)
    if (m?.[1] && m[2] && !/^-+$/.test(m[2])) into.set(pad(m[1]), m[2].toLowerCase())
  }
}

const LABEL = (s: string): TicketState | null | undefined =>
  /\bready-for-human\b/.test(s) ? 'human'
  : /\bneeds-(triage|info)\b/.test(s) ? 'triage'
  : /\b(wontfix|won't fix)\b/.test(s) ? 'wontfix'
  : /\bready-for-agent\b|\bnot (yet )?started\b|\bpending\b|\bqueued\b/.test(s) ? null // by dependencies
  : undefined // no triage label: read the words

function classify(raw: string, progress: string | undefined): TicketState | null {
  // The live state wins over the ticket file; within one, a triage label
  // wins over keywords, so "not started" is never read as "started".
  for (const s of [progress, raw]) {
    if (!s) continue
    const label = LABEL(s)
    if (label !== undefined) return label
    if (ACTIVE.test(s)) return 'active'
    if (DONE.test(s)) return 'done'
  }
  return null // ready or blocked, decided by its dependencies
}

async function load($: EngineInterface, cwd: string, want: string | null): Promise<Board | null> {
  const root = await findRoot($, cwd)
  if (!root) return null
  const features = await findFeatures($, root)
  if (features.length === 0) return null
  const slug = want && features.includes(want) ? want : (features[0] ?? '')
  const dir = join(root, '.scratch', slug)

  const progress = new Map<string, string>()
  for (const e of (await tryList($, dir)) ?? []) {
    if (e.kind === 'file' && e.name.endsWith('.md')) {
      const t = await tryRead($, join(dir, e.name))
      if (t) parseProgress(t, progress)
    }
  }

  const parsed: ReturnType<typeof parseTicket>[] = []
  const files = ((await tryList($, join(dir, 'issues'))) ?? [])
    .filter(e => e.kind === 'file' && /^\d+.*\.md$/.test(e.name))
    .map(e => e.name)
    .sort()
  for (const f of files) {
    const t = await tryRead($, join(dir, 'issues', f))
    if (t) parsed.push(parseTicket(f, t))
  }

  const byNum = new Map(parsed.map(p => [p.num, p]))
  const fixed = new Map<string, TicketState | null>()
  for (const p of parsed) fixed.set(p.num, classify(p.rawStatus, progress.get(p.num)))
  // A dependency that has no file here (moved away or finished long ago) counts as met.
  const isMet = (n: string) => !byNum.has(n) || fixed.get(n) === 'done' || fixed.get(n) === 'wontfix'

  const levels = new Map<string, number>()
  const levelOf = (n: string, seen: Set<string>): number => {
    if (levels.has(n)) return levels.get(n)!
    if (seen.has(n) || !byNum.has(n)) return -1
    seen.add(n)
    const deps = byNum.get(n)!.blockedBy.filter(d => byNum.has(d))
    const lvl = deps.length ? 1 + Math.max(...deps.map(d => levelOf(d, seen))) : 0
    levels.set(n, lvl)
    return lvl
  }

  const tickets: Ticket[] = parsed.map(p => ({
    ...p,
    progress: progress.get(p.num),
    state: fixed.get(p.num) ?? (p.blockedBy.every(isMet) ? 'ready' : 'blocked'),
    level: Math.max(0, levelOf(p.num, new Set())),
  }))

  // docs/<slug>/spec.md where a project keeps specs as docs; Matt Pocock's
  // default Local Markdown tracker keeps it at .scratch/<slug>/spec.md.
  const spec =
    (await tryRead($, join(root, 'docs', slug, 'spec.md'))) ?? (await tryRead($, join(dir, 'spec.md')))
  return {
    slug,
    root,
    hasSpec: spec !== null,
    specTitle: spec?.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug,
    specStatus: spec ? (field(spec, 'Status') ?? '') : 'no spec.md',
    tickets,
    features,
    loadedAt: Date.now(),
  }
}

const LOOK: Record<TicketState, { glyph: string; color: string; label: string }> = {
  done: { glyph: '✓', color: 'success', label: 'done' },
  active: { glyph: '◐', color: 'suggestion', label: 'in progress' },
  ready: { glyph: '○', color: 'text', label: 'ready' },
  blocked: { glyph: '·', color: 'inactive', label: 'blocked' },
  human: { glyph: '◆', color: 'remember', label: 'human' },
  triage: { glyph: '?', color: 'warning', label: 'triage' },
  wontfix: { glyph: '–', color: 'inactive', label: "won't fix" },
}
const GROUPS: { title: string; states: TicketState[] }[] = [
  { title: 'Building now', states: ['active'] },
  { title: 'Ready to start', states: ['ready'] },
  { title: 'Not started: waiting', states: ['blocked'] },
  { title: 'Needs a person', states: ['human'] },
  { title: 'Needs triage', states: ['triage'] },
  { title: 'Done', states: ['done', 'wontfix'] },
]
const ORDER: TicketState[] = ['done', 'active', 'ready', 'blocked', 'human', 'triage', 'wontfix']

const cut = (s: string, n: number) => (n <= 1 ? '' : s.length > n ? s.slice(0, n - 1) + '…' : s)

function slugFrom(text: string, features: string[] | undefined): string | null {
  const m = text.match(/(?:docs|\.scratch)\/([^/\s]+)\//)
  if (m?.[1]) return m[1]
  const word = text.trim().split(/\s+/)[0]
  if (word && (!features || features.includes(word))) return word
  return null
}

let cwd = '.'

async function refresh($: EngineInterface) {
  const want = await read($, selected)
  const loaded = await load($, cwd, want)
  await update($, board, () => loaded)
  await update($, countdown, () => POLL_SECONDS)
}

/** Once a second: count down, and reload when it reaches zero. */
async function tick($: EngineInterface) {
  const left = (await read($, countdown)) - 1
  if (left <= 0) await refresh($)
  else await update($, countdown, () => left)
}

async function show($: EngineInterface, slug: string | null) {
  if (slug) await update($, selected, () => slug)
  await refresh($)
  await $.ui.open({ id: PANE, title: 'Implement-spec board' })
}

/** Called from the plugin's one session.start hook. */
export async function start($: EngineInterface, sessionCwd: string) {
  cwd = sessionCwd
  await refresh($)
  $.clock.every(1000, () => void tick($))
}

export const register: Register = on => {
  on('command.run', { command: 'phassle:implement-spec-board' }, async ($, e) => {
    const b = await read($, board)
    await show($, slugFrom(e.args, b?.features) ?? null)
    return { text: 'Implement-spec board opened.' }
  })

  // Open the board by itself when implement-spec starts, typed or called as a skill.
  on('command.run', async ($, e, next) => {
    if (/(^|:)implement-spec$/.test(e.command)) {
      const b = await read($, board)
      void show($, slugFrom(e.args, b?.features))
    }
    return next(e)
  })
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    if (/(^|:)implement-spec$/.test(e.skill)) {
      const b = await read($, board)
      void show($, slugFrom((e as { args?: string }).args ?? '', b?.features))
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Progress } = $.ui.resolve(e)
    const b = await read($, board)
    const left = await read($, countdown)
    const width = Math.max(20, e.props.bodyColumns)

    if (!b) {
      return (
        <Box flexDirection="column">
          <Button key="refresh" hotkey="r" onPress={() => void refresh($)}>
            ↻ Refresh in {left} s
          </Button>
          <Text dimColor>No tickets found.</Text>
          <Text dimColor>Looking for .scratch/&lt;slug&gt;/issues/ near {cut(cwd, width - 25)}</Text>
        </Box>
      )
    }

    const total = b.tickets.length
    const count = (s: TicketState) => b.tickets.filter(t => t.state === s).length
    const done = count('done') + count('wontfix')
    const maxLevel = Math.max(0, ...b.tickets.map(t => t.level))
    const levels = Array.from({ length: maxLevel + 1 }, (_, i) => b.tickets.filter(t => t.level === i))
    const byNum = new Map(b.tickets.map(t => [t.num, t]))
    const isMet = (n: string) => {
      const d = byNum.get(n)
      return !d || d.state === 'done' || d.state === 'wontfix'
    }
    const at = new Date(b.loadedAt)
    const hhmm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Button key="refresh" hotkey="r" onPress={() => void refresh($)}>
            ↻ Refresh in {left} s
          </Button>
          <Text dimColor> Updated {hhmm}</Text>
        </Box>
        {b.features.length > 1 && (
          <Box flexDirection="column">
            <Box flexDirection="row" flexWrap="wrap">
              {b.features.map(f => (
                <Button
                  key={`feature-${f}`}
                  onPress={() => void show($, f)}
                  variant={f === b.slug ? 'primary' : undefined}
                >
                  {f}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        <Text bold>{cut(b.specTitle, width)}</Text>
        <Text dimColor>
          {cut(`${b.slug} · spec ${b.specStatus || '—'} · ${total} tickets`, width)}
        </Text>
        <Progress label="Done" value={done} max={Math.max(1, total)} valueText={`${done}/${total}`} />
        <Box flexDirection="row" flexWrap="wrap">
          {ORDER.filter(s => count(s) > 0).map(s => (
            <Text color={LOOK[s].color}>
              {LOOK[s].glyph} {count(s)} {LOOK[s].label}{'  '}
            </Text>
          ))}
        </Box>

        <Text> </Text>
        <Text bold>Dependency graph</Text>
        {levels.map((row, i) => (
          <Box flexDirection="row" flexWrap="wrap">
            <Text dimColor>{i === 0 ? '   ' : ' → '}</Text>
            {row.map(t => (
              <Text color={LOOK[t.state].color} bold={t.state === 'ready' || t.state === 'active'}>
                {LOOK[t.state].glyph}
                {t.num}{' '}
              </Text>
            ))}
          </Box>
        ))}

        {GROUPS.map(g => {
          const rows = b.tickets.filter(t => g.states.includes(t.state))
          if (rows.length === 0) return null
          return (
            <Box flexDirection="column">
              <Text> </Text>
              <Text bold color={LOOK[g.states[0]!].color}>
                {g.title} ({rows.length})
              </Text>
              {rows.map(t => {
                const waits = t.blockedBy.filter(d => !isMet(d))
                const note =
                  t.state === 'active'
                    ? (t.progress ?? t.rawStatus)
                    : waits.length
                      ? `waits for ${waits.join(', ')}`
                      : t.state === 'done' || t.state === 'wontfix'
                        ? ''
                        : (t.progress ?? t.rawStatus)
                const room = width - 5 - (note ? note.length + 3 : 0)
                return (
                  <Text>
                    <Text color={LOOK[t.state].color}>{LOOK[t.state].glyph} </Text>
                    <Text bold>{t.num} </Text>
                    <Text dimColor={t.state === 'done' || t.state === 'wontfix'} strikethrough={t.state === 'wontfix'}>
                      {cut(t.title, Math.max(8, room))}
                    </Text>
                    {note ? <Text dimColor> · {cut(note, Math.max(10, width - 14))}</Text> : null}
                  </Text>
                )
              })}
            </Box>
          )
        })}

      </Box>
    )
  })
}
