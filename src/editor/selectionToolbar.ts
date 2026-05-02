/**
 * [INPUT]: 依赖 DOM selection 与 Obsidian 命令回调，接收高亮颜色与便签动作
 * [OUTPUT]: 对外提供 SelectionToolbar，在选中文本附近显示非侵入式阅读工具条
 * [POS]: editor 模块的交互入口，被 main.ts 装配并调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { setIcon } from "obsidian";

import { ANNOTATION_COLORS, AnnotationColor } from "../storage/types";

interface SelectionToolbarOptions {
  onHighlight: (color: AnnotationColor) => void;
  onComment: () => void;
  onCopy: () => void;
  onOpenSidebar: () => void;
}

export class SelectionToolbar {
  private readonly element: HTMLElement;
  private visible = false;

  constructor(private readonly options: SelectionToolbarOptions) {
    this.element = document.body.createDiv({ cls: "oa-selection-toolbar" });
    this.render();
    this.hide();
  }

  destroy(): void {
    this.element.remove();
  }

  showForSelection(): void {
    const range = window.getSelection()?.rangeCount ? window.getSelection()?.getRangeAt(0) : null;
    const text = window.getSelection()?.toString().trim() ?? "";
    if (!range || !text) {
      this.hide();
      return;
    }

    const rect = range.getBoundingClientRect();
    this.element.style.left = `${Math.max(8, rect.left + rect.width / 2)}px`;
    this.element.style.top = `${Math.max(8, rect.top - 46)}px`;
    this.element.toggleClass("is-visible", true);
    this.visible = true;
  }

  hide(): void {
    this.element.toggleClass("is-visible", false);
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  private render(): void {
    const swatches = this.element.createDiv({ cls: "oa-toolbar-swatches" });
    for (const color of ANNOTATION_COLORS) {
      const button = swatches.createEl("button", {
        cls: "oa-toolbar-swatch",
        attr: {
          type: "button",
          "aria-label": `Highlight ${color}`,
          "data-oa-color": color,
        },
      });
      button.addEventListener("click", () => this.options.onHighlight(color));
    }

    const commentButton = this.iconButton("message-square", "Add sticky note");
    commentButton.addEventListener("click", () => this.options.onComment());

    const copyButton = this.iconButton("copy", "Copy selection");
    copyButton.addEventListener("click", () => this.options.onCopy());

    const sidebarButton = this.iconButton("panel-right-open", "Open annotations");
    sidebarButton.addEventListener("click", () => this.options.onOpenSidebar());
  }

  private iconButton(icon: string, label: string): HTMLButtonElement {
    const button = this.element.createEl("button", {
      cls: "oa-toolbar-button",
      attr: {
        type: "button",
        "aria-label": label,
        title: label,
      },
    });
    setIcon(button, icon);
    return button;
  }
}
