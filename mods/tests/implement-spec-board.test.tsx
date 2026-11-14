import { expect, test } from 'claude-code/testing'

const FILES: Record<string, string> = {
  '/w/docs/feat/spec.md': '# Feat: spec\n\n**Status:** ready-for-agent\n',
  '/w/.scratch/feat/STATE.md': '| Ticket | State |\n|---|---|\n| 02 | implementer running (worktree wt/02) | |\n',
  '/w/.scratch/feat/issues/01-a.md': '# 01: First\n\n**Blocked by:** None\n\n**Status:** resolved\n',
  '/w/.scratch/feat/issues/02-b.md': '# 02: Second\n\n**Blocked by:** 01\n\n**Status:** ready-for-agent\n',
  '/w/.scratch/feat/issues/03-c.md': '# 03: Third\n\n**Blocked by:** 01\n\n**Status:** ready-for-agent\n',
  '/w/.scratch/feat/issues/04-d.md': '# 04: Fourth\n\n**Blocked by:** 02 (Second), 03\n\n**Status:** ready-for-agent\n',
}

function listing(dir: string) {
  const names = new Map<string, 'file' | 'dir'>()
  for (const path of Object.keys(FILES)) {
    if (!path.startsWith(dir + '/')) continue
    const rest = path.slice(dir.length + 1).split('/')
    names.set(rest[0] ?? '', rest.length > 1 ? 'dir' : 'file')
  }
  if (names.size === 0) throw new Error('ENOENT')
  return [...names].map(([name, kind]) => ({ name, kind, size: 1, mtimeMs: 1, isLink: false }))
}

test('the board shows status, frontier and levels', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('fs.list', (_, e) => ({ value: listing((e as { path: string }).path) }))
  on('fs.read', (_, e) => {
    const text = FILES[(e as { path: string }).path]
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })

  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({
    plugin: 'phassle-mods',
    component: 'Pane',
    requestId: 'implement-spec-board',
    surface: 'terminal',
    props: {
      title: 'Implement-spec board',
      isFocused: false,
      bodyColumns: 60,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 40 },
      view: {},
    },
  })

  expect((await ui.find({ type: 'Text', text: /^Feat: spec$/ }))?.text).toBe('Feat: spec')
  expect((await ui.find({ type: 'Text', text: /^Building now/ }))?.text).toBe('Building now (1)')
  expect((await ui.find({ type: 'Text', text: /^◐ 02 Second/ }))?.text).toContain('implementer running')
  expect((await ui.find({ type: 'Text', text: /^Ready to start/ }))?.text).toBe('Ready to start (1)')
  expect((await ui.find({ type: 'Text', text: /^○ 03/ }))?.text).toContain('Third')
  expect((await ui.find({ type: 'Text', text: /^· 04/ }))?.text).toContain('waits for 02, 03')
  expect((await ui.find({ type: 'Text', text: /^✓ 01/ }))?.text).toBe('✓ 01 First')
  await ui.unmount()
})
