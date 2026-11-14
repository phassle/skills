import type { Register } from 'claude-code'

import { register as files, start as startFiles } from './files'
import { register as implementSpecBoard, start as startImplementSpecBoard } from './implement-spec-board'

// One plugin, many mods: each mod is a file in this folder exporting `register`,
// and `start` when it has work at session start. An event may be hooked once per
// plugin without a matcher, so session.start lives here and calls each mod.
export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    await startFiles($)
    await startImplementSpecBoard($, e.cwd)
    return next(e)
  })
  files(on, options)
  implementSpecBoard(on, options)
}
