# Project Name
## Chinese README

 [中文](README_CN.md).

## Description

This project is a Go application that uses GitHub Actions to automate the build, compile, and execution of the project. It fetches the user's stars, applies AI tagging, and generates a Markdown file.

## Features

* Fetches all stars for a given GitHub username
* Applies AI tagging to each star
* Generates a Markdown file with the AI-tagged stars

## Getting Started

1. Clone the repository: `git clone https://github.com/your-username/your-repo-name.git`
2. Set the required environment variables: `export GITHUB_TOKEN=<your-github-token>`, `export LLM_TOKEN=<your-llm-token>`, `export LLM_BASEURL=<your-llm-baseurl>`
3. Run the application: `go run main.go`


## Dependencies

* Go version 1.23 or higher
* The `resty` package for making HTTP requests
* The `openai-go` package for interacting with OpenAI models

## Contributing

Contributions are welcome! Please submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.