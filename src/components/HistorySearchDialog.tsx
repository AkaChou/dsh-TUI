import React from 'react'
import { Box, Text, useTerminalSize } from '../ui.js'
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import { SearchBox } from './SearchBox.js'
import { listWindow } from './listWindow.js'
import { historyEntryId, type HistoryEntry } from '../history.js'

/**
 * The ctrl+r history search dialog, in the shape of the leak's
 * HistorySearchDialog/FuzzyPicker: a permission-colored Pane with a bold
 * title, the ⌕ SearchBox, the filtered history as ListItem rows (newest
 * first), and the ↑/↓ · Enter · Esc hint line. Keyboard handling lives in
 * the caller (Chat).
 */
export function HistorySearchDialog({
  query,
  cursorOffset,
  matches,
  focusIndex,
}: {
  query: string
  cursorOffset: number
  matches: readonly HistoryEntry[]
  focusIndex: number
}): React.ReactNode {
  const isTerminalFocused = useTerminalFocus()
  const { rows: terminalRows } = useTerminalSize()
  // 焦点窗口化（Select 同款）：浮层 maxHeight 裁剪下全量渲染会藏掉焦点行。
  // 框架行：浮层预留 8 + 标题/搜索框/页脚/gap 约 8。
  const { start, end } = listWindow(matches.length, focusIndex, Math.max(terminalRows - 16, 3))
  return (
    <Pane color="permission">
      <Box flexDirection="column" gap={1}>
        <Text bold color="permission">
          Search history
        </Text>
        <SearchBox
          query={query}
          cursorOffset={cursorOffset}
          isFocused
          isTerminalFocused={isTerminalFocused}
          placeholder="Type to search…"
        />
        {matches.length === 0 ? (
          <Text dimColor>No matching commands</Text>
        ) : (
          matches.slice(start, end).map((entry, index) => {
            const absoluteIndex = start + index
            return (
              <ListItem
                key={historyEntryId(entry)}
                isFocused={absoluteIndex === focusIndex}
                description={formatRelativeAge(entry.ts)}
                showScrollUp={absoluteIndex === start && start > 0}
                showScrollDown={absoluteIndex === end - 1 && end < matches.length}
              >
                {entry.text}
              </ListItem>
            )
          })
        )}
        <Text dimColor italic>
          <Byline>
            <KeyboardShortcutHint shortcut="↑/↓" action="navigate" />
            <KeyboardShortcutHint shortcut="Enter" action="select" bold />
            <KeyboardShortcutHint shortcut="Esc" action="cancel" />
          </Byline>
        </Text>
      </Box>
    </Pane>
  )
}

/** "now", "5m ago", "2h ago", "3d ago" — like CC's formatRelativeTimeAgo. */
function formatRelativeAge(ts: number): string {
  const elapsed = Date.now() - ts
  if (elapsed < 60_000) return 'now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`
  return `${Math.floor(elapsed / 86_400_000)}d ago`
}
