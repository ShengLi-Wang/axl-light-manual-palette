/**
 * [INPUT]: 依赖 Obsidian ItemView、AnnotationStore 数据与插件主类回调
 * [OUTPUT]: 对外提供 AnnotationSidebarView，总览当前 Markdown/PDF 注释并支持搜索、过滤、排序、导出、跳转
 * [POS]: views 模块的右侧 Leaf 总览面板，被 main.ts 注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { ItemView, MarkdownView, Notice, TFile, WorkspaceLeaf } from "obsidian";

import type OverlayAnnotationsPlugin from "../../main";
import { ANNOTATION_COLORS, AnnotationColor, AnnotationSortMode } from "../storage/types";

export const ANNOTATION_SIDEBAR_VIEW = "axl-light-sidebar";

export class AnnotationSidebarView extends ItemView {
  private query = "";
  private color: AnnotationColor | "all" = "all";
  private sort: AnnotationSortMode = "document";

  constructor(leaf: WorkspaceLeaf, private readonly plugin: OverlayAnnotationsPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return ANNOTATION_SIDEBAR_VIEW;
  }

  getDisplayText(): string {
    return "Annotations";
  }

  getIcon(): string {
    return "sticky-note";
  }

  async onOpen(): Promise<void> {
    this.containerEl.addClass("oa-sidebar");
    await this.render();
  }

  async render(): Promise<void> {
    const container = this.containerEl.children[1] ?? this.containerEl;
    container.empty();

    const file = this.app.workspace.getActiveFile();
    container.createEl("h3", { text: "Annotations" });
    this.renderControls(container, file);

    if (!file) {
      container.createDiv({ cls: "oa-empty", text: "Open a Markdown or PDF file to inspect annotations." });
      return;
    }

    const document = await this.plugin.store.getDocument(file);
    const rows = [
      ...document.highlights.map((item) => ({
        id: item.id,
        type: "highlight" as const,
        color: item.color,
        text: item.anchor.selectedText,
        content: "",
        createdAt: item.createdAt,
        startOffset: item.anchor.startOffset,
        pageNumber: null,
        orphaned: item.orphaned,
      })),
      ...document.comments.map((item) => ({
        id: item.id,
        type: "note" as const,
        color: item.color,
        text: item.anchor.selectedText,
        content: item.content,
        createdAt: item.createdAt,
        startOffset: item.anchor.startOffset,
        pageNumber: null,
        orphaned: item.orphaned,
      })),
      ...document.pdfHighlights.map((item) => ({
        id: item.id,
        type: "pdf highlight" as const,
        color: item.color,
        text: item.anchor.selectedText,
        content: "",
        createdAt: item.createdAt,
        startOffset: Number.MAX_SAFE_INTEGER,
        pageNumber: item.anchor.pageNumber,
        orphaned: item.orphaned,
      })),
      ...document.pdfComments.map((item) => ({
        id: item.id,
        type: "pdf note" as const,
        color: item.color,
        text: item.anchor.selectedText,
        content: item.content,
        createdAt: item.createdAt,
        startOffset: Number.MAX_SAFE_INTEGER,
        pageNumber: item.anchor.pageNumber,
        orphaned: item.orphaned,
      })),
    ]
      .filter((row) => this.color === "all" || row.color === this.color)
      .filter((row) => {
        const haystack = `${row.text} ${row.content}`.toLowerCase();
        return haystack.includes(this.query.toLowerCase());
      })
      .sort((a, b) => {
        if (this.sort === "newest") {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (this.sort === "oldest") {
          return a.createdAt.localeCompare(b.createdAt);
        }
        return (a.pageNumber ?? 0) - (b.pageNumber ?? 0) || a.startOffset - b.startOffset;
      });

    if (!rows.length) {
      container.createDiv({ cls: "oa-empty", text: "No matching annotations." });
      return;
    }

    const list = container.createDiv({ cls: "oa-sidebar-list" });
    for (const row of rows) {
      const item = list.createDiv({ cls: "oa-sidebar-item" });
      item.toggleClass("is-orphaned", !!row.orphaned);
      const meta = item.createDiv({ cls: "oa-sidebar-meta" });
      meta.createSpan({ cls: "oa-color-chip", text: row.color, attr: { "data-oa-color": row.color } });
      meta.createSpan({ text: row.type });
      if (row.pageNumber) {
        meta.createSpan({ text: `page ${row.pageNumber}` });
      }
      meta.createSpan({ text: new Date(row.createdAt).toLocaleString() });
      item.createDiv({ cls: "oa-sidebar-quote", text: row.text });
      if (row.content) {
        item.createDiv({ cls: "oa-sidebar-content", text: row.content });
      }

      const actions = item.createDiv({ cls: "oa-sidebar-actions" });
      const jump = actions.createEl("button", { text: "Jump", attr: { type: "button" } });
      jump.addEventListener("click", () => this.jumpTo(file, row.startOffset, row.pageNumber));
      const remove = actions.createEl("button", { text: "Delete", attr: { type: "button" } });
      remove.addEventListener("click", async () => {
        await this.plugin.store.removeAnnotation(file, row.id);
        new Notice("Annotation deleted");
        await this.plugin.refreshAnnotations();
      });
    }
  }

  private renderControls(container: Element, file: TFile | null): void {
    const controls = container.createDiv({ cls: "oa-sidebar-controls" });
    const search = controls.createEl("input", {
      cls: "oa-sidebar-search",
      attr: { type: "search", placeholder: "Search annotations" },
    });
    search.value = this.query;
    search.addEventListener("input", async () => {
      this.query = search.value;
      await this.render();
    });

    const color = controls.createEl("select");
    color.createEl("option", { text: "All colors", value: "all" });
    for (const item of ANNOTATION_COLORS) {
      color.createEl("option", { text: item, value: item });
    }
    color.value = this.color;
    color.addEventListener("change", async () => {
      this.color = color.value as AnnotationColor | "all";
      await this.render();
    });

    const sort = controls.createEl("select");
    for (const item of ["document", "newest", "oldest"] as const) {
      sort.createEl("option", { text: item, value: item });
    }
    sort.value = this.sort;
    sort.addEventListener("change", async () => {
      this.sort = sort.value as AnnotationSortMode;
      await this.render();
    });

    const exportButton = controls.createEl("button", { text: "Export", attr: { type: "button" } });
    exportButton.disabled = !file;
    exportButton.addEventListener("click", async () => {
      if (!file) {
        return;
      }
      const exported = await this.plugin.store.exportNotes(file);
      new Notice(`Exported notes to ${exported.path}`);
    });
  }

  private async jumpTo(file: TFile, offset: number, pageNumber: number | null): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    if (file.extension.toLowerCase() === "pdf") {
      window.setTimeout(() => {
        const page = document.querySelector<HTMLElement>(
          `.workspace-leaf.mod-active .pdf-page[data-page-number="${pageNumber}"], .workspace-leaf.mod-active .page[data-page-number="${pageNumber}"]`,
        );
        page?.scrollIntoView({ block: "center" });
        page?.addClass("oa-flash-target");
        window.setTimeout(() => page?.removeClass("oa-flash-target"), 850);
      }, 120);
      return;
    }

    const view = leaf.view instanceof MarkdownView ? leaf.view : this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return;
    }

    const pos = view.editor.offsetToPos(offset);
    view.editor.setCursor(pos);
    view.editor.scrollIntoView({ from: pos, to: pos }, true);
    view.containerEl.addClass("oa-flash-target");
    window.setTimeout(() => view.containerEl.removeClass("oa-flash-target"), 850);
  }
}
