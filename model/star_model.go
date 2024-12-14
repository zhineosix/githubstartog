package model

type StarInfo struct {
	Name            string   `json:"name"`
	FullName        string   `json:"full_name"`
	Url             string   `json:"url"`
	HtmlUrl         string   `json:"html_url"`
	Description     *string  `json:"description"`
	Homepage        *string  `json:"homepage"`
	Language        *string  `json:"language"`
	Topics          []string `json:"topics"`
	StargazersCount int      `json:"stargazers_count"`
	AI_tag          AI_tag   `json:"ai_tag"`
}
type ReadmeData struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Sha         string `json:"sha"`
	Size        int    `json:"size"`
	Url         string `json:"url"`
	HtmlUrl     string `json:"html_url"`
	GitUrl      string `json:"git_url"`
	DownloadUrl string `json:"download_url"`
	Type        string `json:"type"`
	Content     string `json:"content"`
	RawContent  string

	Encoding string `json:"encoding"`
	Links    struct {
		Self string `json:"self"`
		Git  string `json:"git"`
		Html string `json:"html"`
	} `json:"_links"`
}
type AI_tag struct {
	Group string   `json:"group"`
	Tags  []string `json:"tags"`
	Desc  string   `json:"desc"`
}
