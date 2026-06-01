# scripts/
> L2 | 父级: /Users/epiphanyxiao/Documents/Playground/obsidian-annotation-plugin/AGENTS.md

成员清单
install.sh: 一条命令安装器，从 GitHub release 下载 main.js、manifest.json、styles.css 到指定 Obsidian vault。
install.ps1: Windows PowerShell 安装器，提示 vault 路径、下载校验 release 产物并复制插件目录到剪贴板。
install.cmd: Windows cmd 双击包装器，复用本地或远程 install.ps1，屏蔽执行策略细节。

法则: 安装脚本只搬运 release 产物·不修改 vault 内容·失败信息必须可执行

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
