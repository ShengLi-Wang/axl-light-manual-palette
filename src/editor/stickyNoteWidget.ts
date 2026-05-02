/**
 * [INPUT]: 依赖 CodeMirror coordsAtPos、storage/types 的评论数据、stickyNoteView 的卡片渲染与 leaderLine/positioning 工具
 * [OUTPUT]: 对外提供 createStickyNoteExtension，在宽屏编辑器右侧渲染同步滚动的便利贴和连接线
 * [POS]: editor 模块的便签叠加层，不修改 Markdown doc，只管理视觉 DOM
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { editorInfoField } from "obsidian";

import { drawLeaderLines, type LeaderLineInput } from "../utils/leaderLine";
import { layoutStickyNotes } from "../utils/positioning";
import { renderStickyNoteCard } from "../views/stickyNoteView";
import { AnnotationPluginSettings, CommentAnnotation, FileAnnotationDocument } from "../storage/types";
import type OverlayAnnotationsPlugin from "../../main";

interface StickyNoteExtensionOptions {
  plugin: OverlayAnnotationsPlugin;
  getDocument: (filePath: string) => FileAnnotationDocument | null;
  getSettings: () => AnnotationPluginSettings;
  getVersion: () => number;
  onCommentChanged: (filePath: string, comment: CommentAnnotation) => void;
  onCommentDeleted: (filePath: string, comment: CommentAnnotation) => void;
}

export function createStickyNoteExtension(options: StickyNoteExtensionOptions) {
  return ViewPlugin.fromClass(
    class StickyNotePlugin {
      private readonly layer: HTMLElement;
      private readonly lane: HTMLElement;
      private readonly svg: SVGSVGElement;
      private readonly host: HTMLElement;
      private version = -1;
      private frame: number | null = null;
      private resizeObserver: ResizeObserver;

      constructor(private readonly view: EditorView) {
        this.host = this.view.dom.parentElement ?? this.view.dom;
        this.host.addClass("oa-editor-host");
        this.layer = this.host.createDiv({ cls: "oa-sticky-layer" });
        this.svg = this.layer.createSvg("svg", { cls: "oa-leader-svg" });
        this.lane = this.layer.createDiv({ cls: "oa-sticky-lane" });
        this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
        this.resizeObserver.observe(this.host);
        this.view.scrollDOM.addEventListener("scroll", this.scheduleRender, { passive: true });
        this.scheduleRender();
      }

      update(update: ViewUpdate): void {
        const nextVersion = options.getVersion();
        if (update.docChanged || update.viewportChanged || this.version !== nextVersion) {
          this.version = nextVersion;
          this.scheduleRender();
        }
      }

      destroy(): void {
        if (this.frame !== null) {
          cancelAnimationFrame(this.frame);
        }
        this.resizeObserver.disconnect();
        this.view.scrollDOM.removeEventListener("scroll", this.scheduleRender);
        this.host.removeClass("oa-sticky-active");
        this.host.removeClass("oa-sticky-active-left");
        this.host.removeClass("oa-sticky-active-right");
        this.host.style.removeProperty("--oa-sticky-width");
        this.layer.remove();
      }

      private scheduleRender = (): void => {
        if (this.frame !== null) {
          return;
        }
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          this.render();
        });
      };

      private render(): void {
        const filePath = this.filePath();
        const settings = options.getSettings();
        const hostRect = this.host.getBoundingClientRect();
        const collapsed = hostRect.width < settings.stickyCollapseWidth;
        const visible = Boolean(filePath && settings.stickyNotesVisible && !collapsed);

        this.layer.toggleClass("is-hidden", !visible);
        this.host.toggleClass("oa-sticky-active", visible);
        this.host.toggleClass("oa-sticky-active-left", visible && settings.stickySide === "left");
        this.host.toggleClass("oa-sticky-active-right", visible && settings.stickySide === "right");
        this.host.style.setProperty("--oa-sticky-width", `${settings.stickyWidth}px`);

        if (!visible || !filePath) {
          this.lane.empty();
          this.svg.empty();
          return;
        }

        const document = options.getDocument(filePath);
        const comments = (document?.comments ?? []).filter((comment) => !comment.orphaned && !comment.resolved);
        this.lane.empty();
        this.lane.style.width = `${settings.stickyWidth}px`;
        this.layer.toggleClass("is-left", settings.stickySide === "left");
        this.layer.toggleClass("is-right", settings.stickySide === "right");

        const laneX = settings.stickySide === "right" ? hostRect.width - settings.stickyWidth : 0;
        const inputs = comments.map((comment) => {
          const coords = this.view.coordsAtPos(comment.anchor.startOffset);
          const anchorTop = coords ? coords.top - hostRect.top + this.view.scrollDOM.scrollTop : 0;
          return {
            id: comment.id,
            anchorTop,
            height: comment.collapsed ? 64 : 190,
            offsetY: comment.position.offsetY,
          };
        });
        const layout = new Map(layoutStickyNotes(inputs).map((item) => [item.id, item.top]));
        const lines: LeaderLineInput[] = [];

        for (const comment of comments) {
          const wrapper = this.lane.createDiv({ cls: "oa-sticky-wrapper" });
          wrapper.style.top = `${layout.get(comment.id) ?? 0}px`;
          wrapper.style.transform = `translateX(${comment.position.offsetX}px)`;

          renderStickyNoteCard(wrapper, {
            app: options.plugin.app,
            component: options.plugin,
            sourcePath: filePath,
            comment,
            onToggle: (item) => {
              options.onCommentChanged(filePath, {
                ...item,
                collapsed: !item.collapsed,
                updatedAt: new Date().toISOString(),
              });
            },
            onUpdate: (item, content) => {
              options.onCommentChanged(filePath, {
                ...item,
                content,
                updatedAt: new Date().toISOString(),
              });
            },
            onDelete: (item) => options.onCommentDeleted(filePath, item),
          });

          if (settings.showLeaderLines) {
            const coords = this.view.coordsAtPos(comment.anchor.startOffset);
            if (coords) {
              const fromX = coords.right - hostRect.left;
              const fromY = coords.top - hostRect.top + this.view.scrollDOM.scrollTop;
              const toX = laneX + (settings.stickySide === "right" ? 0 : settings.stickyWidth);
              const toY = (layout.get(comment.id) ?? 0) + 24;
              lines.push({
                id: comment.id,
                fromX,
                fromY,
                toX,
                toY,
                color: `var(--oa-${comment.color})`,
              });
            }
          }
        }

        this.svg.setAttr("width", `${hostRect.width}`);
        this.svg.setAttr("height", `${Math.max(hostRect.height, this.view.scrollDOM.scrollHeight)}`);
        drawLeaderLines(this.svg, lines);
      }

      private filePath(): string | null {
        return this.view.state.field(editorInfoField).file?.path ?? null;
      }
    },
  );
}
