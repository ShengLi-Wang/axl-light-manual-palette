/**
 * [INPUT]: 依赖 Obsidian MarkdownRenderer、CommentAnnotation 数据与便签操作回调
 * [OUTPUT]: 对外提供 renderStickyNoteCard，用于渲染可折叠、可编辑的便签卡片
 * [POS]: views 模块的便签卡片组件，被 editor/stickyNoteWidget 管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { App, Component, MarkdownRenderer, setIcon } from "obsidian";

import { CommentAnnotation } from "../storage/types";

interface StickyNoteCardOptions {
  app: App;
  component: Component;
  sourcePath: string;
  comment: CommentAnnotation;
  onToggle: (comment: CommentAnnotation) => void;
  onUpdate: (comment: CommentAnnotation, content: string) => void;
  onDelete: (comment: CommentAnnotation) => void;
}

export function renderStickyNoteCard(container: HTMLElement, options: StickyNoteCardOptions): HTMLElement {
  container.empty();
  const card = container.createDiv({
    cls: "oa-sticky-card",
    attr: {
      "data-oa-color": options.comment.color,
      "data-oa-id": options.comment.id,
    },
  });

  const header = card.createDiv({ cls: "oa-sticky-header" });
  const color = header.createSpan({ cls: "oa-sticky-color", attr: { "data-oa-color": options.comment.color } });
  color.setAttr("aria-hidden", "true");
  header.createSpan({ cls: "oa-sticky-author", text: options.comment.author });

  const collapse = header.createEl("button", {
    cls: "oa-icon-button",
    attr: { type: "button", title: options.comment.collapsed ? "Expand" : "Collapse" },
  });
  setIcon(collapse, options.comment.collapsed ? "chevron-down" : "chevron-up");
  collapse.addEventListener("click", () => options.onToggle(options.comment));

  const remove = header.createEl("button", {
    cls: "oa-icon-button",
    attr: { type: "button", title: "Delete note" },
  });
  setIcon(remove, "trash-2");
  remove.addEventListener("click", () => options.onDelete(options.comment));

  if (options.comment.collapsed) {
    card.createDiv({ cls: "oa-sticky-excerpt", text: options.comment.anchor.selectedText });
    return card;
  }

  const body = card.createDiv({ cls: "oa-sticky-body" });
  MarkdownRenderer.render(options.app, options.comment.content, body, options.sourcePath, options.component);

  const editor = card.createEl("textarea", {
    cls: "oa-sticky-editor",
    attr: { rows: "4", placeholder: "Write a Markdown note..." },
  });
  editor.value = options.comment.content;
  editor.addEventListener("change", () => options.onUpdate(options.comment, editor.value));

  return card;
}
