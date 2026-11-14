import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'phassle-mods',
  component: 'Pane',
  requestId: 'folder-view',
  props: {
    title: 'Files',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('the pane draws the tree with git marks on every surface', async ($, on) => {
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.exists', () => ({ value: false }))
  on('fs.list', (_, e) => ({
    value:
      e.path === '/repo'
        ? [
            { name: 'src', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
            { name: 'a.md', kind: 'file', size: 1, mtimeMs: 0, isLink: false },
            { name: 'b.md', kind: 'file', size: 1, mtimeMs: 0, isLink: false },
          ]
        : [{ name: 'x.ts', kind: 'file', size: 1, mtimeMs: 0, isLink: false }],
  }))
  on('process.run', (_, e) => {
    const args = e.argv.slice(3).join(' ')
    const out = (stdout: string, exitCode = 0) => ({
      value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    })
    if (args === 'rev-parse --show-toplevel') return out('/repo\n')
    if (args === 'branch --show-current') return out('feat/x\n')
    if (args.startsWith('rev-parse --verify -q main')) return out('abc\n')
    if (args.startsWith('rev-parse --verify')) return out('', 1)
    if (args.startsWith('rev-list --count')) return out('3\n')
    if (args.startsWith('merge-base')) return out('abc\n')
    if (args.startsWith('diff --name-status')) return out('M\ta.md\nD\told.md\nA\tsrc/x.ts\n')
    if (args.startsWith('diff --numstat')) return out('4\t1\ta.md\n')
    return out('')
  })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /feat\/x/ }))?.text).toContain('feat/x')
    expect((await ui.find({ type: 'Text', text: /vs main/ }))?.text).toContain('3 changed')
    expect(await ui.find({ type: 'Text', text: /old\.md/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /\+4/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('changed-only stays drawable on a branch with thousands of changes', async ($, on) => {
  const files = Array.from({ length: 3000 }, (_, i) => `pkg${i % 30}/sub${i % 7}/f${i}.ts`)
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.exists', () => ({ value: false }))
  on('fs.list', (_, e) => {
    const rel = e.path === '/repo' ? '' : (e.path ?? '').slice('/repo/'.length)
    const names = new Map<string, boolean>()
    for (const f of files) {
      if (rel && !f.startsWith(rel + '/')) continue
      const rest = rel ? f.slice(rel.length + 1) : f
      const [head = '', ...more] = rest.split('/')
      names.set(head, more.length > 0)
    }
    return {
      value: [...names].map(([name, isDir]) => ({
        name,
        kind: isDir ? ('dir' as const) : ('file' as const),
        size: 1,
        mtimeMs: 0,
        isLink: false,
      })),
    }
  })
  on('process.run', (_, e) => {
    const args = e.argv.slice(3).join(' ')
    const out = (stdout: string, exitCode = 0) => ({
      value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    })
    if (args === 'rev-parse --show-toplevel') return out('/repo\n')
    if (args === 'branch --show-current') return out('feat/big\n')
    if (args.startsWith('rev-parse --verify -q main')) return out('abc\n')
    if (args.startsWith('rev-parse --verify')) return out('', 1)
    if (args.startsWith('rev-list --count')) return out('565\n')
    if (args.startsWith('merge-base')) return out('abc\n')
    if (args.startsWith('diff --name-status')) return out(files.map(f => `M\t${f}`).join('\n'))
    return out('')
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'toggle-changed' })
  expect(await ui.find({ type: 'Text', text: /✓ changed only/ })).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /\(100\)/ }))?.text).toContain('(100)')
  // a big folder opened by hand still draws
  await ui.press({ key: 'pkg0' })
  expect(await ui.find({ type: 'Text', text: /sub0/ })).toBeTruthy()
  await ui.unmount()
})

test('clicking a file previews it, and a changed file shows its diff', async ($, on) => {
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.exists', () => ({ value: false }))
  on('fs.list', () => ({ value: [{ name: 'a.md', kind: 'file', size: 20, mtimeMs: 0, isLink: false }] }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 20, mtimeMs: 0, isLink: false } }))
  on('fs.read', () => ({ value: 'first line\nsecond line' }))
  on('process.run', (_, e) => {
    const args = e.argv.slice(3).join(' ')
    const out = (stdout: string, exitCode = 0) => ({
      value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    })
    if (args === 'rev-parse --show-toplevel') return out('/repo\n')
    if (args === 'branch --show-current') return out('feat/x\n')
    if (args.startsWith('rev-parse --verify -q main')) return out('abc\n')
    if (args.startsWith('rev-parse --verify')) return out('', 1)
    if (args.startsWith('rev-list --count')) return out('1\n')
    if (args.startsWith('merge-base')) return out('abc\n')
    if (args.startsWith('diff --name-status')) return out('M\ta.md\n')
    if (args.startsWith('diff --no-color')) return out('diff --git a/a.md b/a.md\n@@ -1 +1 @@\n-old line\n+second line\n')
    return out('')
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'a.md' })
  expect((await ui.find({ type: 'Text', text: /second line/ }))?.text).toContain('2 second line')
  await ui.press({ key: 'preview-mode' })
  expect((await ui.find({ type: 'Text', text: /old line/ }))?.text).toBe('-old line')
  await ui.press({ key: 'preview-back' })
  expect(await ui.find({ type: 'Text', text: /feat\/x/ })).toBeTruthy()
  await ui.unmount()
})
