/**
 * DeepSeek AI 配置
 * 从环境变量读取 API 密钥与模型参数
 */
const aiConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY,
  apiBase: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS, 10) || 4096,
  temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.7,
}

function validate() {
  if (!aiConfig.apiKey) {
    throw new Error('[AI Config] 缺少必要环境变量: DEEPSEEK_API_KEY')
  }
}

/**
 * 返回适用于 OpenAI 兼容 SDK 的请求参数
 */
function getRequestOptions() {
  return {
    baseURL: aiConfig.apiBase,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    maxTokens: aiConfig.maxTokens,
    temperature: aiConfig.temperature,
  }
}

module.exports = {
  aiConfig,
  validate,
  getRequestOptions,
}
