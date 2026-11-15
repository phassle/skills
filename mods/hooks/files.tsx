import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { CompareMode, PreviewMode, RelPath } from '../types'

type R = EngineInterface

const PANE = 'folder-view'
const TITLE = 'Files'
const HIDDEN = new Set(['.git', '.DS_Store'])
const MAX_ROWS = 800
// In changed-only view a folder opens by itself only with this many changes or fewer.
const AUTO_OPEN_MAX = 25
// Tools that can change files: only these refresh git after they run.
const WRITERS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell'])

// Folders opened by hand (normal view) and closed by hand (changed-only view,
// where folders holding changes open by themselves).
const expanded = atom({ plugin: 'phassle', key: 'expanded' } as const, [] as RelPath[], { shape: 'exp-1' })
const collapsed = atom({ plugin: 'phassle', key: 'collapsed' } as const, [] as RelPath[], { shape: 'col-1' })
// Bumped when files may have changed, so git is read again.
const tick = atom({ plugin: 'phassle', key: 'tick' } as const, 0, { shape: 'tick-1' })
const changedOnly = atom({ plugin: 'phassle', key: 'changedOnly' } as const, false, { shape: 'co-1' })
const mode = atom({ plugin: 'phassle', key: 'mode' } as const, 'branch' as CompareMode, { shape: 'mode-1' })
// The file shown in the pane instead of the tree; '' shows the tree.
const preview = atom({ plugin: 'phassle', key: 'preview' } as const, '' as RelPath, { shape: 'prev-1' })
const previewMode = atom({ plugin: 'phassle', key: 'previewMode' } as const, 'content' as PreviewMode, {
  shape: 'pmode-1',
})
const PREVIEW_MAX_LINES = 1500
const PREVIEW_MAX_BYTES = 1_000_000

// Absolute paths of files Claude edited or wrote this session.
const touched = atom({ plugin: 'phassle', key: 'touched' } as const, [] as string[], { shape: 'touch-1' })

type Mark = 'A' | 'M' | 'D'
type Repo = { root: string; name: string; branch: string; base: string; from: string; count: number }
type GitView = {
  repos: Repo[]
  marks: Map<string, Mark> // absolute path → mark
  stats: Map<string, { add: number; del: number }>
  dirty: Set<string> // absolute dirs holding a change
  deleted: Map<string, string[]> // absolute dir → names deleted there
  ignored: Set<string> // absolute paths .gitignore hides
}
const emptyView = (): GitView => ({
  repos: [],
  marks: new Map(),
  stats: new Map(),
  dirty: new Set(),
  deleted: new Map(),
  ignored: new Set(),
})

const join = (a: string, b: string) => (!b ? a : a ? `${a}/${b}` : b)
const lines = (s: string) => s.split('\n').filter(Boolean)
// Git's -z output: NUL-separated and unquoted, so names like `café.md` stay literal.
const fields = (s: string) => s.split('\u0000').filter(Boolean)
const dirOf = (p: string) => p.slice(0, p.lastIndexOf('/'))
const baseOf = (p: string) => p.slice(p.lastIndexOf('/') + 1)

// Module cache: git is read once per tick, mode and set of repos.
let cacheKey = ''
let cache: GitView = emptyView()
const baseByRepo = new Map<string, string>()

async function git($: R, root: string, args: string[]) {
  try {
    const r = await $.process.run(['git', '-C', root, ...args], { timeoutMs: 15000 })
    return r.exitCode === 0 ? r.stdout : null
  } catch {
    return null
  }
}

// The branch the current one forked from: the candidate with the fewest
// commits between it and HEAD. '' on a default branch itself.
async function findBase($: R, root: string, branch: string) {
  const key = `${root}@${branch}`
  const known = baseByRepo.get(key)
  if (known !== undefined) return known
  const names = ['main', 'master', 'develop', 'dev', 'trunk']
  let best = ''
  let bestCount = Infinity
  if (!names.includes(branch)) {
    for (const n of names) {
      for (const ref of [`origin/${n}`, n]) {
        if ((await git($, root, ['rev-parse', '--verify', '-q', ref])) === null) continue
        const out = await git($, root, ['rev-list', '--count', `${ref}..HEAD`])
        const c = out === null ? NaN : Number(out.trim())
        if (!Number.isNaN(c) && c < bestCount) {
          best = ref
          bestCount = c
        }
        break
      }
    }
  }
  baseByRepo.set(key, best)
  return best
}

function markDirs(view: GitView, abs: string, root: string) {
  let d = dirOf(abs)
  while (d.length >= root.length && d) {
    view.dirty.add(d)
    d = dirOf(d)
  }
}

async function readRepo($: R, root: string, m: CompareMode, view: GitView) {
  const branch =
    (await git($, root, ['branch', '--show-current']))?.trim() ||
    `(${(await git($, root, ['rev-parse', '--short', 'HEAD']))?.trim() ?? 'no commits'})`
  const base = m === 'branch' ? await findBase($, root, branch) : ''
  let from = 'HEAD'
  if (base) from = (await git($, root, ['merge-base', base, 'HEAD']))?.trim() || 'HEAD'
  const [diff, numstat, untracked, ignored] = await Promise.all([
    git($, root, ['diff', '--name-status', '-M', '-z', from]),
    git($, root, ['diff', '--numstat', '-M', '-z', from]),
    git($, root, ['ls-files', '-z', '--others', '--exclude-standard']),
    git($, root, ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory']),
  ])
  let count = 0
  const mark = (rel: string, k: Mark) => {
    const abs = `${root}/${rel}`
    view.marks.set(abs, k)
    count++
    markDirs(view, abs, root)
    if (k === 'D') {
      const d = dirOf(abs)
      view.deleted.set(d, [...(view.deleted.get(d) ?? []), baseOf(abs)])
    }
  }
  // --name-status -z: status, path; a rename or copy has status, old path, new path.
  const ns = fields(diff ?? '')
  for (let i = 0; i < ns.length; ) {
    const c = (ns[i++] ?? '')[0]
    const a = ns[i++] ?? ''
    if (c === 'R' || c === 'C') mark(ns[i++] ?? a, 'M')
    else if (c === 'A') mark(a, 'A')
    else if (c === 'D') mark(a, 'D')
    else mark(a, 'M')
  }
  for (const rel of fields(untracked ?? '')) mark(rel, 'A')
  // --numstat -z: "add\tdel\tpath"; a rename is "add\tdel\t" then old path, new path.
  const st = fields(numstat ?? '')
  for (let i = 0; i < st.length; ) {
    const [add = '', del = '', path = ''] = (st[i++] ?? '').split('\t')
    let rel = path
    if (!path) {
      i++ // old path
      rel = st[i++] ?? ''
    }
    if (add === '-' || !rel) continue // binary
    view.stats.set(`${root}/${rel}`, { add: Number(add), del: Number(del) })
  }
  for (const rel of fields(ignored ?? '')) view.ignored.add(`${root}/${rel.replace(/\/$/, '')}`)
  const name = baseOf(root) || root
  view.repos.push({ root, name, branch, base: base.replace(/^origin\//, ''), from, count })
}

async function loadGit($: R, roots: string[], m: CompareMode, t: number) {
  const key = `${t}|${m}|${roots.join('|')}`
  if (key === cacheKey) return cache
  const view = emptyView()
  for (const root of roots) await readRepo($, root, m, view)
  // A deleted folder: put its name in its parent so the tree reaches it.
  for (const [d] of [...view.deleted]) {
    let cur = d
    while (true) {
      const parent = dirOf(cur)
      if (!parent || !view.dirty.has(parent)) break
      const list = view.deleted.get(parent) ?? []
      if (!list.includes(baseOf(cur))) view.deleted.set(parent, [...list, baseOf(cur)])
      cur = parent
    }
  }
  cacheKey = key
  cache = view
  return view
}

type Ui = ReturnType<R['ui']['resolve']>

async function renderPreview($: R, ui: Ui, cwd: string, rel: RelPath, pm: CompareMode, view: GitView, how: PreviewMode) {
  const { Box, Text, Button } = ui
  const abs = join(cwd, rel)
  const k = view.marks.get(abs)
  const repo = view.repos.filter(r => abs.startsWith(r.root + '/')).sort((a, b) => b.root.length - a.root.length)[0]
  const canDiff = !!repo && !!k && k !== 'A'
  const showDiff = how === 'diff' && canDiff

  let body: string[] = []
  let note = ''
  if (showDiff && repo) {
    const out = await git($, repo.root, ['diff', '--no-color', repo.from, '--', abs.slice(repo.root.length + 1)])
    // Drop the file header only: everything from the first hunk on is content,
    // including changed lines that themselves start with -- or ++.
    const all = lines(out ?? '')
    const firstHunk = all.findIndex(l => l.startsWith('@@'))
    body = firstHunk < 0 ? [] : all.slice(firstHunk)
    if (body.length === 0) note = 'No differences.'
  } else if (k === 'D') {
    note = 'The file is deleted. Show the diff to see what it held.'
  } else {
    try {
      const st = await $.fs.stat(abs)
      if (st.kind !== 'file') note = 'Not a regular file.'
      else if (st.size > PREVIEW_MAX_BYTES) note = `Too large to preview (${Math.round(st.size / 1024)} KB).`
      else {
        const text = await $.fs.read(abs)
        if (text.includes('\u0000')) note = 'Binary file.'
        else body = text.split('\n')
      }
    } catch (err) {
      note = `Cannot read: ${String(err)}`
    }
  }
  const more = Math.max(0, body.length - PREVIEW_MAX_LINES)
  body = body.slice(0, PREVIEW_MAX_LINES)
  const width = String(body.length).length

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Button key="preview-back" onPress={() => update($, preview, () => '')}>
          <Text>[← back]</Text>
        </Button>
        <Button key="preview-mention" onPress={() => $.prompt.fill({ text: `@${rel} `, mode: 'insert' })}>
          <Text>[@ prompt]</Text>
        </Button>
        {canDiff && (
          <Button key="preview-mode" onPress={() => update($, previewMode, v => (v === 'diff' ? 'content' : 'diff'))}>
            <Text color={showDiff ? 'cyan' : undefined}>[{showDiff ? '✓ diff' : 'diff'}]</Text>
          </Button>
        )}
      </Box>
      <Text bold wrap="truncate-start">
        📄 {rel}
        {showDiff && repo ? <Text dimColor> · vs {repo.base || 'HEAD'}</Text> : ''}
      </Text>
      {note !== '' && <Text dimColor>{note}</Text>}
      {showDiff
        ? body.map((l, i) => (
            <Text
              key={`d${i}`}
              color={l.startsWith('+') ? 'green' : l.startsWith('-') ? 'red' : l.startsWith('@@') ? 'cyan' : undefined}
              dimColor={!/^[-+@]/.test(l)}
            >
              {l || ' '}
            </Text>
          ))
        : body.map((l, i) => (
            <Text key={`l${i}`}>
              <Text dimColor>{String(i + 1).padStart(width, ' ')} </Text>
              {l.replace(/\t/g, '  ') || ' '}
            </Text>
          ))}
      {more > 0 && <Text dimColor>… {more} more lines</Text>}
    </Box>
  )
}

const bump = ($: R) => void update($, tick, n => n + 1).catch(() => {})

/** Called from the plugin's one session.start hook. */
export async function start($: EngineInterface) {
  void $.ui.open({ id: PANE, title: TITLE, closeOnEscape: true })
}

export const register: Register = on => {
  on('command.run', { command: 'phassle:files' }, async $ => {
    await update($, tick, n => n + 1)
    await $.ui.open({ id: PANE, title: TITLE, closeOnEscape: true, focus: true })
    return { text: 'Files pane opened.' }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (!WRITERS.has(e.tool) && !e.tool.startsWith('mcp__')) return ran
    let path: unknown
    if ('file_path' in e) path = e.file_path
    else if ('notebook_path' in e) path = e.notebook_path
    if (typeof path === 'string' && path) {
      const abs = path.startsWith('/') ? path : `${await $.session.cwd()}/${path}`
      void update($, touched, list => (list.includes(abs) ? list : [...list, abs].slice(-500))).catch(() => {})
    }
    bump($)
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const t = await read($, tick)
    const onlyChanged = await read($, changedOnly)
    const m = await read($, mode)
    const open = new Set(await read($, expanded))
    const closed = new Set(await read($, collapsed))
    const mine = new Set(await read($, touched))
    const cwd = await $.session.cwd()

    type Entry = { name: string; isDir: boolean; isLink: boolean; gone: boolean }
    const listDir = async (rel: string): Promise<Entry[]> => {
      try {
        return (await $.fs.list(join(cwd, rel)))
          .filter(x => !HIDDEN.has(x.name))
          .map(x => ({ name: x.name, isDir: x.kind === 'dir', isLink: x.isLink, gone: false }))
      } catch {
        return []
      }
    }

    // Repos: the one holding cwd, else each repo folder right under it.
    const roots = new Set<string>()
    const top = (await git($, cwd, ['rev-parse', '--show-toplevel']))?.trim()
    const rootEntries = await listDir('')
    if (top) roots.add(top)
    else
      for (const x of rootEntries)
        if (x.isDir && (await $.fs.exists(`${cwd}/${x.name}/.git`))) roots.add(`${cwd}/${x.name}`)
    const view = await loadGit($, [...roots].sort(), m, t)

    const shown = await read($, preview)
    if (shown) return renderPreview($, $.ui.resolve(e), cwd, shown, m, view, await read($, previewMode))

    // Files Claude touched count as changes for the filter and folder colour.
    const mineDirs = new Set<string>()
    for (const abs of mine) {
      let d = dirOf(abs)
      while (d.length >= cwd.length && d) {
        mineDirs.add(d)
        d = dirOf(d)
      }
    }
    const counts = new Map<string, number>()
    for (const abs of new Set([...view.marks.keys(), ...mine])) {
      let d = dirOf(abs)
      while (d.length >= cwd.length && d) {
        counts.set(d, (counts.get(d) ?? 0) + 1)
        d = dirOf(d)
      }
    }
    const isInteresting = (abs: string) =>
      view.marks.has(abs) || view.dirty.has(abs) || mine.has(abs) || mineDirs.has(abs)
    const isOpen = (rel: string, abs: string) =>
      open.has(rel) ||
      (onlyChanged && isInteresting(abs) && (counts.get(abs) ?? 0) <= AUTO_OPEN_MAX && !closed.has(rel))

    type Row = {
      rel: string
      name: string
      depth: number
      isDir: boolean
      isLink: boolean
      mark?: Mark
      dirty: boolean
      mine: boolean
      stat?: { add: number; del: number }
    }
    const rows: Row[] = []
    let hidden = 0
    const build = async (rel: string, depth: number, entriesIn?: Entry[]) => {
      const abs = join(cwd, rel)
      const entries = [...(entriesIn ?? (await listDir(rel)))].filter(x => !view.ignored.has(`${abs}/${x.name}`))
      for (const nm of view.deleted.get(abs) ?? [])
        if (!entries.some(x => x.name === nm))
          entries.push({ name: nm, isDir: view.dirty.has(`${abs}/${nm}`), isLink: false, gone: true })
      entries.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))
      for (const x of entries) {
        const childRel = join(rel, x.name)
        const childAbs = `${abs}/${x.name}`
        if (onlyChanged && !isInteresting(childAbs)) continue
        if (rows.length >= MAX_ROWS) {
          hidden++
          continue
        }
        rows.push({
          rel: childRel,
          name: x.name,
          depth,
          isDir: x.isDir,
          isLink: x.isLink,
          mark: view.marks.get(childAbs) ?? (x.gone ? 'D' : undefined),
          dirty: view.dirty.has(childAbs) || mineDirs.has(childAbs),
          mine: mine.has(childAbs),
          stat: view.stats.get(childAbs),
        })
        if (x.isDir && isOpen(childRel, childAbs)) await build(childRel, depth + 1, x.gone ? [] : undefined)
      }
    }
    await build('', 0, rootEntries)

    const toggle = (rel: string) => async () => {
      const without = (l: RelPath[]) => l.filter(p => p !== rel)
      if (isOpen(rel, join(cwd, rel))) {
        await update($, expanded, without)
        await update($, collapsed, l => [...without(l), rel])
      } else {
        await update($, collapsed, without)
        await update($, expanded, l => [...without(l), rel])
      }
    }

    const openFile = (rel: string) => async () => {
      await update($, previewMode, () => 'content')
      await update($, preview, () => rel)
    }

    const badge = (k?: Mark) =>
      k === 'A' ? (
        <Text color="green" bold>+ </Text>
      ) : k === 'M' ? (
        <Text color="magenta" bold>→ </Text>
      ) : k === 'D' ? (
        <Text color="red" bold>− </Text>
      ) : (
        <Text>  </Text>
      )
    const colorOf = (k?: Mark) => (k === 'A' ? 'green' : k === 'M' ? 'magenta' : k === 'D' ? 'red' : undefined)

    const cwdName = baseOf(cwd) || cwd
    const showRepoName = roots.size > 1 || top !== cwd
    return (
      <Box flexDirection="column">
        <Text bold>📂 {cwdName}</Text>
        {view.repos.length === 0 && <Text dimColor>Not a git repository</Text>}
        {view.repos.map(r => (
          <Text key={r.root}>
            <Text color="cyan">⎇ {r.branch}</Text>
            <Text dimColor>
              {showRepoName ? ` · ${r.name}` : ''} · {r.base ? `vs ${r.base}` : 'uncommitted'} · {r.count} changed
            </Text>
          </Text>
        ))}
        <Box flexDirection="row" gap={1}>
          <Button key="toggle-changed" onPress={() => update($, changedOnly, v => !v)}>
            <Text color={onlyChanged ? 'cyan' : undefined}>[{onlyChanged ? '✓' : ' '} changed only]</Text>
          </Button>
          <Button key="toggle-mode" onPress={() => update($, mode, v => (v === 'branch' ? 'uncommitted' : 'branch'))}>
            <Text>[{m === 'branch' ? 'whole branch' : 'uncommitted'}]</Text>
          </Button>
        </Box>
        <Text dimColor>
          <Text color="green">+</Text> added <Text color="magenta">→</Text> modified <Text color="red">−</Text> deleted{' '}
          <Text color="yellow">●</Text> Claude
        </Text>
        {onlyChanged && rows.length === 0 && <Text dimColor>No changes.</Text>}
        {rows.map(row => {
          const pad = '  '.repeat(row.depth)
          const color = colorOf(row.mark)
          if (row.isDir)
            return (
              <Button key={row.rel} onPress={toggle(row.rel)}>
                {pad}
                <Text dimColor>{isOpen(row.rel, join(cwd, row.rel)) ? '▾ ' : '▸ '}</Text>
                {badge(row.mark)}📁{' '}
                <Text color={row.dirty && !row.mark ? 'yellow' : color} strikethrough={row.mark === 'D'}>
                  {row.name}
                </Text>
                {(counts.get(join(cwd, row.rel)) ?? 0) > 0 && (
                  <Text dimColor> ({counts.get(join(cwd, row.rel))})</Text>
                )}
              </Button>
            )
          return (
            <Button key={row.rel} onPress={openFile(row.rel)}>
              {pad}
              {'  '}
              {badge(row.mark)}
              {row.isLink ? '🔗' : '📄'}{' '}
              <Text color={color} dimColor={!color && row.name.startsWith('.')} strikethrough={row.mark === 'D'}>
                {row.name}
              </Text>
              {row.mine && <Text color="yellow"> ●</Text>}
              {row.stat && (row.stat.add > 0 || row.stat.del > 0) && (
                <Text dimColor>
                  {' '}
                  <Text color="green">+{row.stat.add}</Text> <Text color="red">−{row.stat.del}</Text>
                </Text>
              )}
            </Button>
          )
        })}
        {hidden > 0 && <Text dimColor>… {hidden} more not shown; close a folder to make room</Text>}
      </Box>
    )
  })
}
