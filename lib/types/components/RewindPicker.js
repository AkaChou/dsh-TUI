import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useTerminalSize } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { listWindow } from './listWindow.js';
/**
 * Double-Esc rewind picker (CC's "Double-tap esc to rewind the code and/or
 * conversation to a previous point in time"): lists the user's past messages
 * newest-first; selecting one and confirming rewinds the conversation to
 * that point (the message comes back into the input for re-editing).
 */
export function RewindPicker({ rows, focusIndex, confirmRow, }) {
    if (confirmRow !== null) {
        return (_jsx(Pane, { color: "permission", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "remember", bold: true, children: "Rewind conversation to this message?" }) }), _jsx(ListItem, { isFocused: false, description: "conversation restarts here", children: preview(confirmRow.text) }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "rewind", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "back" })] }) })] }) }));
    }
    const { rows: terminalRows } = useTerminalSize();
    // 焦点窗口化（Select 同款）：浮层 maxHeight 裁剪下全量渲染会藏掉焦点行，
    // rewind 是不可见确认的高危操作，焦点必须始终在屏。
    // 框架行：浮层预留 8 + 标题块/页脚/边距约 5。
    const { start, end } = listWindow(rows.length, focusIndex, Math.max(terminalRows - 13, 4));
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "remember", bold: true, children: "Rewind" }), _jsx(Text, { dimColor: true, children: "Pick a message to rewind the conversation to" })] }), rows.length === 0 ? (_jsx(ListItem, { isFocused: false, children: "No messages to rewind to" })) : (rows.slice(start, end).map((row, index) => {
                        const absoluteIndex = start + index;
                        return (_jsx(ListItem, { isFocused: absoluteIndex === focusIndex, description: absoluteIndex === 0 ? 'last message' : undefined, showScrollUp: absoluteIndex === start && start > 0, showScrollDown: absoluteIndex === end - 1 && end < rows.length, children: preview(row.text) }, row.id));
                    }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "exit" })] }) })] }));
}
/** One-line preview of a message (newlines flattened, capped). */
function preview(text) {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length <= 80 ? flat : `${flat.slice(0, 80)}…`;
}
