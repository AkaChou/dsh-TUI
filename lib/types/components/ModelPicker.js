import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useTerminalSize } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { listWindow } from './listWindow.js';
/**
 * Model picker in the CC ModelPicker style: a permission-colored Pane with
 * the model list as Select rows (❯ focus pointer, ✓ on the active model,
 * descriptions), plus the Enter/Esc hint line. The DSH agent's model is
 * fixed at creation time, so a selection notifies "restart to apply".
 *
 * 长列表按焦点窗口化（Select 同款）：picker 经 OverlayAbove 浮层挂载后有
 * maxHeight 裁剪，全量渲染会让焦点行被裁掉（看不到焦点按 Enter）。
 */
export function ModelPicker({ models, focusIndex, currentModel, }) {
    const { rows: terminalRows } = useTerminalSize();
    // 框架行：浮层预留 8 + 面板标题/页脚/边距约 5。
    const { start, end } = listWindow(models.length, focusIndex, Math.max(terminalRows - 13, 4));
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "remember", bold: true, children: "Model" }) }), models.slice(start, end).map((model, index) => {
                        const absoluteIndex = start + index;
                        return (_jsxs(ListItem, { isFocused: absoluteIndex === focusIndex, isSelected: `${model.provider}/${model.id}` === currentModel, description: model.description, showScrollUp: absoluteIndex === start && start > 0, showScrollDown: absoluteIndex === end - 1 && end < models.length, children: [model.provider, " / ", model.name] }, `${model.provider}/${model.id}`));
                    })] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "exit" })] }) })] }));
}
