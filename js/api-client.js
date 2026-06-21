/**
 * AI 评分客户端
 * 通过本地服务器代理调用 DeepSeek API
 */

const AiClient = {
  async grade(question, referenceAnswer, userAnswer, cfg = {}) {
    const { apiKey, model, baseUrl } = { ...State.aiConfig, ...cfg };
    if (!apiKey) throw new Error('请先填写 DeepSeek API Key');

    const prompt = this.buildPrompt(question, referenceAnswer, userAnswer);

    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, baseUrl, prompt })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `评分失败: ${res.status}`);
    }

    const data = await res.json();
    return this.parseResult(data);
  },

  buildPrompt(question, referenceAnswer, userAnswer) {
    return `你是一位计算机网络课程助教。请根据参考答案对学生的简答题作答进行评分。

题目：${question}

参考答案：${referenceAnswer}

学生答案：${userAnswer}

请按以下 JSON 格式返回，不要包含其他内容：
{
  "score": 0-10 的整数,
  "correctness": 0-100 的整数（得分百分比）,
  "feedback": "简要评语，指出优缺点",
  "missing": "学生答案中遗漏的关键点"
}`;
  },

  parseResult(data) {
    const content = data.choices?.[0]?.message?.content || '';
    try {
      // 尝试从 markdown 代码块中提取 JSON
      const match = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonText = match ? (match[1] || match[0]) : content;
      return JSON.parse(jsonText);
    } catch (e) {
      return {
        score: 0,
        correctness: 0,
        feedback: 'AI 返回格式异常：' + content,
        missing: ''
      };
    }
  }
};
