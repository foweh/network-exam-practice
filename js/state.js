/**
 * 全局状态与本地存储
 */

const State = {
  data: {
    allQuestions: [],     // 所有已加载题目 { source, type, ...原字段 }
    sources: [],          // 已选数据源
    categories: [],       // 可用章节列表
    currentMode: 'study',
    filters: {
      categories: [],
      types: ['choice', 'judge', 'fill', 'essay'],
      difficulties: ['1', '2', '3']
    },
    quizCount: 20,
    showExplanation: 'auto'
  },

  // AI 评分配置（单独 key，方便管理）
  aiConfig: {
    apiKey: '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com'
  },
  aiConfigKey: 'network-exam-ai-config-v1',

  // 持久化数据（按题目唯一键存储）
  persistKey: 'network-exam-state-v1',
  persisted: {
    wrongKeys: new Set(),    // 错题唯一键
    starredKeys: new Set(),  // 收藏唯一键
    history: []              // 答题历史 { key, correct, timestamp }
  },

  init() {
    this.loadPersisted();
    this.loadAiConfig();
  },

  loadAiConfig() {
    try {
      const raw = localStorage.getItem(this.aiConfigKey);
      if (raw) {
        this.aiConfig = { ...this.aiConfig, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('读取 AI 配置失败', e);
    }
  },

  saveAiConfig(cfg) {
    this.aiConfig = { ...this.aiConfig, ...cfg };
    try {
      localStorage.setItem(this.aiConfigKey, JSON.stringify(this.aiConfig));
    } catch (e) {
      console.warn('保存 AI 配置失败', e);
    }
  },

  loadPersisted() {
    try {
      const raw = localStorage.getItem(this.persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.persisted.wrongKeys = new Set(parsed.wrongKeys || []);
        this.persisted.starredKeys = new Set(parsed.starredKeys || []);
        this.persisted.history = parsed.history || [];
      }
    } catch (e) {
      console.warn('读取本地状态失败', e);
    }
  },

  savePersisted() {
    try {
      localStorage.setItem(this.persistKey, JSON.stringify({
        wrongKeys: Array.from(this.persisted.wrongKeys),
        starredKeys: Array.from(this.persisted.starredKeys),
        history: this.persisted.history.slice(-500) // 只保留最近 500 条
      }));
    } catch (e) {
      console.warn('保存本地状态失败', e);
    }
  },

  questionKey(q) {
    return `${q.source}-${q.type}-${q.id}`;
  },

  isWrong(q) {
    return this.persisted.wrongKeys.has(this.questionKey(q));
  },

  isStarred(q) {
    return this.persisted.starredKeys.has(this.questionKey(q));
  },

  toggleStar(q) {
    const key = this.questionKey(q);
    const set = this.persisted.starredKeys;
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this.savePersisted();
    return set.has(key);
  },

  recordAnswer(q, correct) {
    const key = this.questionKey(q);
    const set = this.persisted.wrongKeys;
    if (correct) set.delete(key);
    else set.add(key);
    this.persisted.history.push({ key, correct, timestamp: Date.now() });
    this.savePersisted();
  },

  clearAll() {
    this.persisted.wrongKeys.clear();
    this.persisted.starredKeys.clear();
    this.persisted.history = [];
    this.savePersisted();
  },

  getFilteredQuestions() {
    return this.data.allQuestions.filter(q => {
      if (!this.data.sources.includes(q.source)) return false;
      if (this.data.filters.categories.length && !this.data.filters.categories.includes(q.category)) return false;
      if (!this.data.filters.types.includes(q.type)) return false;
      if (!this.data.filters.difficulties.includes(String(q.difficulty || 1))) return false;
      return true;
    });
  },

  getWrongQuestions() {
    return this.data.allQuestions.filter(q => this.isWrong(q));
  },

  getStarredQuestions() {
    return this.data.allQuestions.filter(q => this.isStarred(q));
  },

  setFilter(key, value) {
    this.data.filters[key] = value;
  },

  setMode(mode) {
    this.data.currentMode = mode;
  }
};

State.init();
