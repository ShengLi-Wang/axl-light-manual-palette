/**
 * [INPUT]: 依赖 Obsidian PluginSettingTab/Setting 与 storage/types 的设置模型
 * [OUTPUT]: 对外提供 AnnotationSettingsTab，负责选区工具条、默认颜色、便签栏、窄屏折叠、连接线、作者、备份、重命名迁移设置
 * [POS]: settings 模块的用户配置界面，被 main.ts 注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { PluginSettingTab, Setting } from "obsidian";

import type OverlayAnnotationsPlugin from "../../main";
import { ANNOTATION_COLORS, AnnotationColor, SidebarSide } from "../storage/types";

export class AnnotationSettingsTab extends PluginSettingTab {
  constructor(private readonly plugin: OverlayAnnotationsPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Axl Light" });

    new Setting(containerEl)
      .setName("Show selection toolbar automatically")
      .setDesc("When disabled, use the Show highlight palette for selection command.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoShowSelectionToolbar).onChange(async (value) => {
          await this.plugin.setAutoShowSelectionToolbar(value);
        });
      });

    new Setting(containerEl)
      .setName("Default highlight color")
      .addDropdown((dropdown) => {
        for (const color of ANNOTATION_COLORS) {
          dropdown.addOption(color, color);
        }
        dropdown.setValue(this.plugin.settings.defaultHighlightColor).onChange(async (value) => {
          this.plugin.settings.defaultHighlightColor = value as AnnotationColor;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Sticky note width")
      .addSlider((slider) => {
        slider
          .setLimits(220, 420, 10)
          .setValue(this.plugin.settings.stickyWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.stickyWidth = value;
            await this.plugin.saveSettings();
            this.plugin.refreshAnnotations();
          });
      });

    new Setting(containerEl)
      .setName("Sticky note side")
      .setDesc("Right is the intended reader layout; left is kept as an advanced preference.")
      .addDropdown((dropdown) => {
        dropdown.addOption("right", "Right");
        dropdown.addOption("left", "Left");
        dropdown.setValue(this.plugin.settings.stickySide).onChange(async (value) => {
          this.plugin.settings.stickySide = value as SidebarSide;
          await this.plugin.saveSettings();
          this.plugin.refreshAnnotations();
        });
      });

    new Setting(containerEl)
      .setName("Collapse sticky lane below width")
      .setDesc("When the editor pane is narrower than this, notes open as popovers instead of a permanent lane.")
      .addSlider((slider) => {
        slider
          .setLimits(640, 1200, 20)
          .setValue(this.plugin.settings.stickyCollapseWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.stickyCollapseWidth = value;
            await this.plugin.saveSettings();
            this.plugin.refreshAnnotations();
          });
      });

    new Setting(containerEl)
      .setName("Show leader lines")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showLeaderLines).onChange(async (value) => {
          this.plugin.settings.showLeaderLines = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAnnotations();
        });
      });

    new Setting(containerEl)
      .setName("Default author")
      .addText((text) => {
        text.setValue(this.plugin.settings.defaultAuthor).onChange(async (value) => {
          this.plugin.settings.defaultAuthor = value.trim() || "Reader";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Data backup frequency")
      .setDesc("Minutes between future backup hooks. The sidecar files are still saved immediately.")
      .addSlider((slider) => {
        slider
          .setLimits(5, 240, 5)
          .setValue(this.plugin.settings.backupFrequencyMinutes)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.backupFrequencyMinutes = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Migrate annotations on rename")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.migrateOnRename).onChange(async (value) => {
          this.plugin.settings.migrateOnRename = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
