/**
 * 长列表 picker 焦点窗口化回归（P1 审查实证）：限高浮层（OverlayAbove
 * maxHeight + overflow hidden）下全量渲染的列表会把焦点行裁出屏外——
 * 30 行终端 30 个模型时焦点在索引 0 完全不可见，用户可能盲按 Enter。
 *
 * 断言：打开 /model 时焦点行（当前模型）在屏；↓×20 后新焦点行在屏；
 * 全程缓冲区零增长（零高度浮层不被窗口化破坏）。
 *
 * 运行：node --import tsx/esm scripts/repro-picker-windowing.tsx
 */
process.env.FORCE_COLOR = '3'
process.env.TERM_PROGRAM = 'WezTerm'
process.env.CC_TUI_THEME = 'dark'
process.env.CC_TUI_LANG = 'zh'

// 隔离 HOME：picker 交互不落任何真实偏好文件（modelPrefs 在模块加载时解析）。
const { mkdtempSync } = await import('node:fs')
const { tmpdir } = await import('node:os')
const { join: joinPath } = await import('node:path')
process.env.HOME = mkdtempSync(joinPath(tmpdir(), 'dsh-cc-repro-home-'))

const [{ PassThrough, Writable }, React, { Terminal: XTerm }, { render }, { Chat }, { QuestionStore }, { createChannel }] = await Promise.all([
  import('node:stream'),
  import('react'),
  import('@xterm/headless'),
  import('../src/ui.js'),
  import('../src/screens/Chat.js'),
  import('../src/questions.js'),
  import('../src/channel.js'),
])

const COLS = 100
const ROWS = 30
const term = new XTerm({ cols: COLS, rows: ROWS, scrollback: 2000, allowProposedApi: true })
class FakeStdout extends Writable {
  columns = COLS
  rows = ROWS
  isTTY = true
  _write(chunk: unknown, _e: BufferEncoding, cb: () => void) {
    term.write(String(chunk), () => cb())
  }
}
class FakeStderr extends Writable {
  isTTY = true
  _write(_c: unknown, _e: BufferEncoding, cb: () => void) { cb() }
}
class FakeStdin extends PassThrough {
  isTTY = true
  setRawMode() { return this }
  ref() { return this }
  unref() { return this }
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

let failed = 0
function check(name: string, ok: boolean, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  if (!ok) failed += 1
}
function screenLines(): string[] {
  const buf = term.buffer.active
  const out: string[] = []
  for (let y = buf.baseY; y < buf.baseY + ROWS; y++) out.push(buf.getLine(y)?.translateToString(true) ?? '')
  return out
}

const events: Array<Record<string, unknown>> = [
  { seq: 0, time: Date.now(), type: 'turn/start', data: { turn: 0 } },
  { seq: 1, time: Date.now() + 5, type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: '一轮对话垫底' }] } },
  { seq: 2, time: Date.now() + 10, type: 'assistant/message', data: { turn: 0, step: 0, message: { role: 'assistant', content: [{ type: 'text', text: '好的。' }] }, usage: { inputTokens: 10, outputTokens: 5 } } },
  { seq: 3, time: Date.now() + 15, type: 'turn/end', data: { turn: 0, reason: { kind: 'completed' } } },
]
const stubAgentCtx = { on: () => () => {} }
function makeAgent(id: string, sessionEvents: readonly unknown[]) {
  return {
    id, status: 'idle',
    session: { id: `s-${id}`, seq: sessionEvents.length, events: sessionEvents, header: {} },
    ctx: stubAgentCtx, followup() {}, steer() {}, inbox: { remove: () => true },
  }
}
// 30 个模型：远超 30 行终端里浮层的可见容量
const MODELS = Array.from({ length: 30 }, (_, i) => ({
  provider: 'fake-provider',
  id: `model-${String(i).padStart(2, '0')}`,
  name: `Model ${String(i).padStart(2, '0')}`,
}))
const services: Record<string, unknown> = {
  sessions: { fork(session: { events: readonly unknown[] }) { return { events: session.events } } },
  agents: {
    async create(options: { sessionId: string; seed: readonly unknown[] }) {
      return { agent: makeAgent('fork-1', options.seed), dispose: async () => {} }
    },
  },
  llm: {
    listProviders: () => [{ id: 'fake-provider' }],
    listModels: async () => MODELS,
  },
}
const ctx = {
  on: () => () => {},
  get: (name: string) => services[name],
  logger: { warn() {} },
}
const channel = createChannel(ctx as never, makeAgent('a1', events) as never, {
  model: 'model-00', cwd: '/tmp/demo', provider: 'fake-provider', activity: false,
})

const stdin = new FakeStdin()
const instance = await render(
  <Chat channel={channel as never} questionStore={new QuestionStore()} onExit={() => {}} />,
  { stdout: new FakeStdout(), stdin, stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)
await sleep(1200)

const bufAtBoot = term.buffer.active.length
for (const ch of '/model') { stdin.write(ch); await sleep(40) }
await sleep(200)
stdin.write('\r')
await sleep(600)

// 焦点初始落在当前模型 model-00（索引 0）：窗口化前它被裁出屏外
check('焦点在索引 0 时 Model 00 在屏', screenLines().some(l => l.includes('Model 00') && l.includes('❯')),
  screenLines().filter(l => l.includes('Model')).map(l => l.trim().slice(0, 40)).join(' | '))
check('打开 picker 缓冲区零增长', term.buffer.active.length === bufAtBoot,
  `${bufAtBoot} → ${term.buffer.active.length}`)

for (let i = 0; i < 20; i++) { stdin.write('\x1b[B'); await sleep(25) }
await sleep(400)
check('↓×20 后焦点行 Model 20 在屏', screenLines().some(l => l.includes('Model 20') && l.includes('❯')),
  screenLines().filter(l => l.includes('Model')).map(l => l.trim().slice(0, 40)).join(' | '))
if (process.env.DUMP === '1') {
  screenLines().forEach((l, i) => console.log(String(i).padStart(2), l.replace(/\s+$/u, '').slice(0, 90)))
}

instance.unmount()
if (failed > 0) {
  console.log(`\n${failed} 项失败`)
  process.exit(1)
}
console.log('\n全部通过')
process.exit(0)
