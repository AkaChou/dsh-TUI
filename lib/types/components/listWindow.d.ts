/**
 * 焦点居中的列表窗口（Select/ResumePicker 同款 clamp）：长列表只渲染焦点
 * 附近的一段，保证焦点行始终可见。瞬态面板走 OverlayAbove 零高度浮层后，
 * 超高部分会被 overflow 裁掉且焦点可能落在被裁区（P1 审查实证：30 行
 * 终端 30 个模型时焦点在索引 0 完全不可见），窗口化是硬要求。
 *
 * @param length - 列表总长。
 * @param focusIndex - 键盘焦点行下标。
 * @param maxVisible - 最多渲染的行数（按终端高度减去面板自身框架行计算）。
 * @returns [start, end) 切片区间。
 */
export declare function listWindow(length: number, focusIndex: number, maxVisible: number): {
    start: number;
    end: number;
};
//# sourceMappingURL=listWindow.d.ts.map