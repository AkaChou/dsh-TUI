import React from 'react'
import { Box, Text, useTerminalSize } from '../ui.js'
import type { ChatRow } from '../channel.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import { listWindow } from './listWindow.js'

/**
 * Double-Esc rewind picker (CC's "Double-tap esc to rewind the code and/or
 * conversation to a previous point in time"): lists the user's past messages
 * newest-first; selecting one and confirming rewinds the conversation to
 * that point (the message comes back into the input for re-editing).
 */
export function RewindPicker({
  rows,
  focusIndex,
  confirmRow,
}: {
  rows: readonly ChatRow[]
  focusIndex: number
  confirmRow: ChatRow | null
}): React.ReactNode {
  if (confirmRow !== null) {
    return (
      <Pane color="permission">
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="remember" bold>
              Rewind conversation to this message?
            </Text>
          </Box>
          <ListItem isFocused={false} description="conversation restarts here">
            {preview(confirmRow.text)}
          </ListItem>
          <Text dimColor italic>
            <Byline>
              <KeyboardShortcutHint shortcut="Enter" action="rewind" bold />
              <KeyboardShortcutHint shortcut="Esc" action="back" />
            </Byline>
          </Text>
        </Box>
      </Pane>
    )
  }

  const { rows: terminalRows } = useTerminalSize()
  // 焦点窗口化（Select 同款）：浮层 maxHeight 裁剪下全量渲染会藏掉焦点行，
  // rewind 是不可见确认的高危操作，焦点必须始终在屏。
  // 框架行：浮层预留 8 + 标题块/页脚/边距约 5。
  const { start, end } = listWindow(rows.length, focusIndex, Math.max(terminalRows - 13, 4))
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>
            Rewind
          </Text>
          <Text dimColor>Pick a message to rewind the conversation to</Text>
        </Box>
        {rows.length === 0 ? (
          <ListItem isFocused={false}>No messages to rewind to</ListItem>
        ) : (
          rows.slice(start, end).map((row, index) => {
            const absoluteIndex = start + index
            return (
              <ListItem
                key={row.id}
                isFocused={absoluteIndex === focusIndex}
                description={absoluteIndex === 0 ? 'last message' : undefined}
                showScrollUp={absoluteIndex === start && start > 0}
                showScrollDown={absoluteIndex === end - 1 && end < rows.length}
              >
                {preview(row.text)}
              </ListItem>
            )
          })
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="select" bold />
          <KeyboardShortcutHint shortcut="Esc" action="exit" />
        </Byline>
      </Text>
    </Pane>
  )
}

/** One-line preview of a message (newlines flattened, capped). */
function preview(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length <= 80 ? flat : `${flat.slice(0, 80)}…`
}
