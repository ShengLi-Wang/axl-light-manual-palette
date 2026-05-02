/**
 * [INPUT]: 依赖 SVG 容器、原文锚点坐标与便利贴坐标
 * [OUTPUT]: 对外提供 drawLeaderLines，用 SVG 曲线连接正文与便签
 * [POS]: utils 模块的连接线绘制器，被 stickyNoteWidget 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export interface LeaderLineInput {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

export function drawLeaderLines(svg: SVGSVGElement, lines: LeaderLineInput[]): void {
  svg.empty();

  for (const line of lines) {
    const path = svg.createSvg("path", {
      cls: "oa-leader-line",
      attr: {
        d: curvePath(line.fromX, line.fromY, line.toX, line.toY),
        "data-oa-id": line.id,
        stroke: line.color,
      },
    });
    path.setAttr("fill", "none");
  }
}

function curvePath(fromX: number, fromY: number, toX: number, toY: number): string {
  const middle = Math.max(40, Math.abs(toX - fromX) * 0.45);
  const c1x = fromX + middle;
  const c2x = toX - middle;
  return `M ${fromX} ${fromY} C ${c1x} ${fromY}, ${c2x} ${toY}, ${toX} ${toY}`;
}
