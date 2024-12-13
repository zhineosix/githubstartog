package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"githubstartog/model"
	"os"
	"strconv"
	"strings"
	"sync"
	//"github.com/sashabaranov/go-openai"
)

func FetchUserStar(user string, page int) *[]model.StarInfo {
	client := resty.New()
	// 请求https://api.github.com/users/mran/starred?page=10
	url := "https://api.github.com/users/" + user + "/starred"
	token := os.Getenv("GITHUB_TOKEN")
	resp, err := client.R().
		SetQueryParam("page", strconv.Itoa(page)).
		SetHeader("Authorization", "token "+token).
		Get(url)
	if err != nil {
		panic(err)
	}
	body := resp.String()
	if len(body) == 0 {
		return nil
	}
	//转为json 对象
	var infos []model.StarInfo
	er := json.Unmarshal([]byte(body), &infos)
	if er != nil {
		fmt.Println(body)
		panic(er)
	}
	return &infos
}

// openai 通用请求代码
func OpenaiRequest(prompt string) string {
	// 如果 prompt 的长度（以字节计）大于 65536 则截断（注意中文字符）
	if len([]rune(prompt)) > 60000 {
		prompt = string([]rune(prompt)[:60000])
	}
	a := []option.RequestOption{
		option.WithAPIKey(LLMTOKEN),
		option.WithBaseURL(LLMBASEURL),
	}
	client := openai.NewClient(a...)
	chatCompletion, err := client.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
		Messages: openai.F([]openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(`我有一个标过star的github库需要进行分类和标记，给出最相关的8个标记。我会给你它的的readme文件，请你分析后给出一个json结构的标签，
限制：只给出严格的json结果，其他内容比如json标签等不需要。
输出格式严格如下
{
  "tags": []
}`),
			openai.UserMessage(prompt),
		}),
		Model: openai.F("deepseek-chat"),
	})
	if err != nil {
		fmt.Println(prompt)
		return ""
	}
	return chatCompletion.Choices[0].Message.Content
}

// 获取指定的github项目的readme 内容
func GetReadme(redmeUrl string) *model.ReadmeData {
	client := resty.New()
	//client.SetProxy("http://127.0.0.1:11081")
	url := redmeUrl + "/readme"
	resp, err := client.R().
		SetHeader("Authorization", "token "+gtihubToken).
		Get(url)
	if err != nil {
		return nil

	}
	body := resp.String()
	var data model.ReadmeData
	err = json.Unmarshal([]byte(body), &data)
	if err != nil {
		return nil
	}
	decodedContent, _ := base64.StdEncoding.DecodeString(data.Content)
	data.RawContent = string(decodedContent)
	return &data
}

// 并行处理
func AIParallelProcess(data []model.StarInfo) []model.StarInfo {

	var wg sync.WaitGroup
	results := make(chan model.StarInfo, len(data))
	//增加一个限速
	limiter := make(chan struct{}, 30)
	for _, star := range data {
		wg.Add(1)
		go func(star model.StarInfo) {
			defer wg.Done()
			limiter <- struct{}{}
			defer func() { <-limiter }()
			// 获取readme
			readme := GetReadme(star.Url)
			if readme == nil {
				return
			}
			fmt.Println(star.FullName)
			// 调用openai接口
			result := OpenaiRequest(readme.RawContent)
			var ai_tag model.AI_tag
			err := json.Unmarshal([]byte(result), &ai_tag)
			if err != nil {
				return
			}
			star.AI_tag = ai_tag
			//还results需要添加对应的github项目标签
			results <- star
		}(star)
	}

	go func() {
		wg.Wait()
		close(results)
	}()
	//取出结果
	var resultlist []model.StarInfo
	for result := range results {
		resultlist = append(resultlist, result)
		fmt.Println("Result from OpenAI:", result)
	}
	return resultlist
}

func SaveMiddleResult(allStar interface{}, fileName string) {
	//	结果写入文件
	file, err := os.Create(fileName)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	err = encoder.Encode(allStar)
	if err != nil {
		panic(err)
	}
}
func readFileCache(filename string) []model.StarInfo {
	//读取allStar.json
	var allStar []model.StarInfo

	file, err := os.Open(filename)
	if err != nil {
		return allStar
	}
	defer file.Close()
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&allStar)
	if err != nil {
		panic(err)
	}
	return allStar
}
func Json2md(aiTagProcess []model.StarInfo) string {
	var md string
	for _, star := range aiTagProcess {
		md += fmt.Sprintf("### [%s](%s)\n", star.FullName, star.HtmlUrl)
		if star.Description != nil {
			md += fmt.Sprintf("- **Description:** %s\n", *star.Description)
		}
		if len(star.AI_tag.Tags) > 0 {
			md += fmt.Sprintf("- **Tags:** %s\n", strings.Join(star.AI_tag.Tags, ", "))
		}
		md += "\n"
	}
	//保存md到文件
	file, err := os.Create("starProject.md")
	if err != nil {
		panic(err)
	}
	defer file.Close()
	_, err = file.WriteString(md)
	if err != nil {
		panic(err)
	}
	return md

}

var gtihubToken = os.Getenv("GITHUB_TOKEN")
var LLMTOKEN = os.Getenv("LLM_TOKEN")
var LLMBASEURL = os.Getenv("LLM_BASEURL")
var username = os.Getenv("USERNAME")

// main 加入启动参数
func main() {
	if len(username) == 0 {
		panic("need username")
	}
	if len(gtihubToken) == 0 {
		panic("need gtihubToken")

	}

	//分页获取用户所有的star，加入数组
	var allStar []model.StarInfo
	page := 1
	for {
		stars := FetchUserStar(username, page)
		if len(*stars) == 0 {
			break
		}
		for _, star := range *stars {
			println(star.FullName)
			allStar = append(allStar, star)
		}

		page++
	}
	//保存两份
	SaveMiddleResult(allStar, "allStar.json")
	SaveMiddleResult(allStar, "aiTagProcess.json")

	var aiTagProcess []model.StarInfo
	aiTagProcess = readFileCache("aiTagProcess.json")
	//需要AI标签的处理
	if len(LLMTOKEN) != 0 && len(LLMBASEURL) != 0 {
		if len(allStar) != 0 {
			aiTagProcess := AIParallelProcess(allStar)
			SaveMiddleResult(aiTagProcess, "aiTagProcess.json")
		}
	}

	Json2md(aiTagProcess)
}
