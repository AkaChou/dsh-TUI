import React from 'react'
import { Box, Text, useTerminalSize } from '../ui.js'
import type { LlmModelInfo } from '@deepseek-ai/dsh-llm'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import { listWindow } from './listWindow.js'

/**
 * Model picker in the CC ModelPicker style: a permission-colored Pane with
 * the model list as Select rows (❯ focus pointer, ✓ on the active model,
 * descriptions), plus the Enter/Esc hint line. The DSH agent's model is
 * fixed at creation time, so a selection notifies "restart to apply".
 *
 * 长列表按焦点窗口化（Select 同款）：picker 经 OverlayAbove 浮层挂载后有
 * maxHeight 裁剪，全量渲染会让焦点行被裁掉（看不到焦点按 Enter）。
 */
export function ModelPicker({
  models,
  focusIndex,
  currentModel,
}: {
  models: readonly LlmModelInfo[]
  focusIndex: number
  currentModel: string
}): React.ReactNode {
  const { rows: terminalRows } = useTerminalSize()
  // 框架行：浮层预留 8 + 面板标题/页脚/边距约 5。
  const { start, end } = listWindow(models.length, focusIndex, Math.max(terminalRows - 13, 4))
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>
            Model
          </Text>
        </Box>
        {models.slice(start, end).map((model, index) => {
          const absoluteIndex = start + index
          return (
            <ListItem
              key={`${model.provider}/${model.id}`}
              isFocused={absoluteIndex === focusIndex}
              isSelected={`${model.provider}/${model.id}` === currentModel}
              description={model.description}
              showScrollUp={absoluteIndex === start && start > 0}
              showScrollDown={absoluteIndex === end - 1 && end < models.length}
            >
              {model.provider} / {model.name}
            </ListItem>
          )
        })}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="confirm" bold />
          <KeyboardShortcutHint shortcut="Esc" action="exit" />
        </Byline>
      </Text>
    </Pane>
  )
}
