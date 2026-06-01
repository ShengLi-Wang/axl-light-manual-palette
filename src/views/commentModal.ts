/**
 * [INPUT]: 依赖 Obsidian App/Modal 与固定便签类型选项
 * [OUTPUT]: 对外提供 CommentModal，返回便签标题与内容或取消状态
 * [POS]: views 模块的便签输入弹窗，被 main.ts 在 Markdown/PDF 注释创建时调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { App, Modal } from "obsidian";

interface CommentModalValue {
  title: string;
  content: string;
}

const NOTE_TITLE_OPTIONS = [
  { value: "Insight", label: "💡 Insight" },
  { value: "Question", label: "❓ Question" },
  { value: "Reminder", label: "🔔 Reminder" },
] as const;

export class CommentModal extends Modal {
  private value: CommentModalValue | null = null;
  private resolve!: (value: CommentModalValue | null) => void;

  constructor(
    app: App,
    private readonly initialTitle: string,
    private readonly initialContent: string,
  ) {
    super(app);
  }

  openAndRead(): Promise<CommentModalValue | null> {
    this.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Sticky note" });

    const title = this.renderTitleInput();
    const input = this.renderContentInput();
    const actions = this.contentEl.createDiv({ cls: "axl-modal-actions" });
    const cancel = actions.createEl("button", { text: "Cancel", cls: "axl-modal-cancel", attr: { type: "button" } });
    const save = actions.createEl("button", { text: "Save", cls: "axl-modal-save", attr: { type: "button" } });

    cancel.addEventListener("click", () => {
      this.value = null;
      this.close();
    });
    save.addEventListener("click", () => {
      this.value = {
        title: title.value.trim(),
        content: input.value.trim(),
      };
      this.close();
    });
  }

  onClose(): void {
    this.resolve?.(this.value);
  }

  private renderTitleInput(): HTMLSelectElement {
    const titleRow = this.contentEl.createDiv({ cls: "axl-modal-row" });
    titleRow.createEl("label", { cls: "axl-modal-label", text: "Type" });
    const title = titleRow.createEl("select", { cls: "axl-modal-select" });
    for (const option of NOTE_TITLE_OPTIONS) {
      title.createEl("option", { text: option.label, attr: { value: option.value } });
    }
    title.value = normalizedNoteTitle(this.initialTitle);
    return title;
  }

  private renderContentInput(): HTMLTextAreaElement {
    const contentRow = this.contentEl.createDiv({ cls: "axl-modal-row" });
    contentRow.createEl("label", { cls: "axl-modal-label", text: "Note" });
    const input = contentRow.createEl("textarea", {
      cls: "axl-modal-textarea",
      attr: { rows: "8", placeholder: "Write your thoughts..." },
    });
    input.value = this.initialContent;
    return input;
  }
}

function normalizedNoteTitle(value: string): string {
  return NOTE_TITLE_OPTIONS.some((option) => option.value === value) ? value : NOTE_TITLE_OPTIONS[0].value;
}
