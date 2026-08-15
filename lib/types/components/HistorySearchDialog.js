import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useTerminalSize } from '../ui.js';
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { SearchBox } from './SearchBox.js';
import { listWindow } from './listWindow.js';
import { historyEntryId } from '../history.js';
/**
 * The ctrl+r history search dialog, in the shape of the leak's
 * HistorySearchDialog/FuzzyPicker: a permission-colored Pane with a bold
 * title, the ⌕ SearchBox, the filtered history as ListItem rows (newest
 * first), and the ↑/↓ · Enter · Esc hint line. Keyboard handling lives in
 * the caller (Chat).
 */
export function HistorySearchDialog({ query, cursorOffset, matches, focusIndex, }) {
    const isTerminalFocused = useTerminalFocus();
    const { rows: terminalRows } = useTerminalSize();
    // 焦点窗口化（Select 同款）：浮层 maxHeight 裁剪下全量渲染会藏掉焦点行。
    // 框架行：浮层预留 8 + 标题/搜索框/页脚/gap 约 8。
    const { start, end } = listWindow(matches.length, focusIndex, Math.max(terminalRows - 16, 3));
    return (_jsx(Pane, { color: "permission", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: "permission", children: "Search history" }), _jsx(SearchBox, { query: query, cursorOffset: cursorOffset, isFocused: true, isTerminalFocused: isTerminalFocused, placeholder: "Type to search\u2026" }), matches.length === 0 ? (_jsx(Text, { dimColor: true, children: "No matching commands" })) : (matches.slice(start, end).map((entry, index) => {
                    const absoluteIndex = start + index;
                    return (_jsx(ListItem, { isFocused: absoluteIndex === focusIndex, description: formatRelativeAge(entry.ts), showScrollUp: absoluteIndex === start && start > 0, showScrollDown: absoluteIndex === end - 1 && end < matches.length, children: entry.text }, historyEntryId(entry)));
                })), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191/\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" })] }) })] }) }));
}
/** "now", "5m ago", "2h ago", "3d ago" — like CC's formatRelativeTimeAgo. */
function formatRelativeAge(ts) {
    const elapsed = Date.now() - ts;
    if (elapsed < 60_000)
        return 'now';
    if (elapsed < 3_600_000)
        return `${Math.floor(elapsed / 60_000)}m ago`;
    if (elapsed < 86_400_000)
        return `${Math.floor(elapsed / 3_600_000)}h ago`;
    return `${Math.floor(elapsed / 86_400_000)}d ago`;
}
