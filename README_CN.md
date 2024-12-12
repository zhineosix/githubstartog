# 项目名称

## 项目描述

这是一个使用 GitHub Actions 自动化构建、编译和执行的 Go 应用程序。它获取用户的星标，应用 AI 标签，并生成一个 Markdown 文件。

## 项目特点

* 获取指定 GitHub 用户名的所有星标
* 为每个星标应用 AI 标签
* 生成一个包含 AI 标签的 Markdown 文件

## 快速开始

1. 克隆仓库：`git clone https://github.com/your-username/your-repo-name.git`
2. 设置必要的环境变量：`export GITHUB_TOKEN=<your-github-token>`, `export LLM_TOKEN=<your-llm-token>`, `export LLM_BASEURL=<your-llm-baseurl>`
3. 运行应用程序：`go run main.go`

## 依赖项

* Go 版本 1.23 或更高
* 使用 `resty` 包进行 HTTP 请求
* 使用 `openai-go` 包与 OpenAI 模型交互

## 贡献

欢迎贡献！请提交一个 pull request 以包含您的更改。

## 许可

本项目使用 MIT 许可。请参阅 `LICENSE` 文件以获取更多信息。