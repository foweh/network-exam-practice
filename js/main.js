/**
 * 应用入口
 */

const App = {
  modes: {
    study: StudyMode,
    quiz: QuizMode,
    review: ReviewMode
  },

  async init() {
    this.loadTheme();
    const info = await DataLoader.loadAll();
    this.renderSources();
    this.renderCategories();
    this.renderAiConfig();
    this.bindEvents();

    if (info.total === 0) {
      Utils.showToast('题库加载失败，请检查 JSON 文件', 3000);
    } else {
      Utils.showToast(`已加载 ${info.total} 道题`, 1500);
    }

    this.switchMode('dashboard');
  },

  loadTheme() {
    const saved = localStorage.getItem('network-exam-theme') || 'light';
    document.body.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('network-exam-theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  renderSources() {
    const list = document.getElementById('sourceList');
    list.innerHTML = '';
    const sourceMeta = {
      exam1: DataLoader.sources[0],
      exam2: DataLoader.sources[1],
      exam3: DataLoader.sources[2]
    };

    ['exam1', 'exam2', 'exam3'].forEach(key => {
      const count = State.data.allQuestions.filter(q => q.source === key).length;
      const item = Utils.el('label', { class: 'source-item' });
      const cb = Utils.el('input', { type: 'checkbox', value: key, checked: true });
      cb.addEventListener('change', () => this.onFilterChange());
      item.appendChild(cb);
      item.appendChild(Utils.el('span', { class: 'source-name', text: sourceMeta[key].name }));
      item.appendChild(Utils.el('span', { class: 'source-count', text: `${count}题` }));
      list.appendChild(item);
    });
  },

  renderCategories() {
    const select = document.getElementById('categoryFilter');
    select.innerHTML = '';
    State.data.categories.forEach(cat => {
      const opt = Utils.el('option', { value: cat, text: Utils.categoryName(cat) });
      select.appendChild(opt);
    });
  },

  renderAiConfig() {
    document.getElementById('aiApiKey').value = State.aiConfig.apiKey || '';
    document.getElementById('aiModel').value = State.aiConfig.model || 'deepseek-chat';
    document.getElementById('aiBaseUrl').value = State.aiConfig.baseUrl || 'https://api.deepseek.com';
  },

  bindEvents() {
    // 模式切换
    document.querySelectorAll('.mode-tab[data-mode]').forEach(tab => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
    });

    // 点击标题回到概览
    document.querySelector('.brand h1').addEventListener('click', () => this.switchMode('dashboard'));
    document.querySelector('.brand .logo').addEventListener('click', () => this.switchMode('dashboard'));

    // 筛选变化
    document.getElementById('categoryFilter').addEventListener('change', () => this.onFilterChange());
    document.getElementById('typeFilter').addEventListener('change', () => this.onFilterChange());
    document.getElementById('difficultyFilter').addEventListener('change', () => this.onFilterChange());

    // 设置
    document.getElementById('quizCount').addEventListener('change', e => {
      State.data.quizCount = parseInt(e.target.value, 10) || 20;
    });
    document.getElementById('showExplanation').addEventListener('change', e => {
      State.data.showExplanation = e.target.value;
    });

    // AI 配置
    ['aiApiKey', 'aiModel', 'aiBaseUrl'].forEach(id => {
      document.getElementById(id).addEventListener('change', e => {
        const key = id.replace('ai', '').replace(/^[A-Z]/, c => c.toLowerCase());
        State.saveAiConfig({ [key]: e.target.value });
      });
    });

    // 移动端菜单
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleSidebar = () => {
      const isOpen = sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // 主题与重置
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('确定要清空所有答题记录、错题本和收藏夹吗？')) {
        State.clearAll();
        Utils.showToast('已清空本地记录');
        this.refreshCurrentMode();
        this.updateDashboard();
      }
    });
  },

  onFilterChange() {
    // 数据源
    const sources = Array.from(document.querySelectorAll('#sourceList input:checked')).map(cb => cb.value);
    State.data.sources = sources;

    // 章节
    const cats = Array.from(document.getElementById('categoryFilter').selectedOptions).map(o => o.value);
    State.setFilter('categories', cats);

    // 题型
    const types = Array.from(document.querySelectorAll('#typeFilter input:checked')).map(cb => cb.value);
    State.setFilter('types', types);

    // 难度
    const diffs = Array.from(document.querySelectorAll('#difficultyFilter input:checked')).map(cb => cb.value);
    State.setFilter('difficulties', diffs);

    this.refreshCurrentMode();
    this.updateDashboard();
  },

  switchMode(mode) {
    State.setMode(mode);
    document.querySelectorAll('.mode-tab[data-mode]').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    this.refreshCurrentMode();
  },

  refreshCurrentMode() {
    if (State.data.currentMode === 'dashboard') {
      this.renderDashboard();
      return;
    }
    const mode = this.modes[State.data.currentMode];
    if (mode) mode.init();
  },

  renderDashboard() {
    const main = document.getElementById('mainArea');
    main.innerHTML = `
      <div class="dashboard slide-in">
        <h2>欢迎来到计算机网络记忆练习</h2>
        <p>选择题库后开始学习、测验或复习错题。</p>
        <div class="stats-grid" id="statsGrid"></div>
      </div>
    `;
    document.getElementById('progressText').textContent = '概览';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('footerActions').innerHTML = `
      <button class="btn btn-primary" onclick="App.switchMode('study')">开始学习</button>
      <button class="btn" onclick="App.switchMode('quiz')">开始测验</button>
    `;
    this.updateDashboard();
  },

  updateDashboard() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    const total = State.data.allQuestions.length;
    const wrong = State.persisted.wrongKeys.size;
    const starred = State.persisted.starredKeys.size;
    const answered = State.persisted.history.length;

    grid.innerHTML = '';
    [
      { value: total, label: '总题数' },
      { value: wrong, label: '错题数' },
      { value: starred, label: '收藏数' },
      { value: answered, label: '已答题' }
    ].forEach(s => {
      const card = Utils.el('div', { class: 'stat-card' }, [
        Utils.el('div', { class: 'stat-value', text: s.value }),
        Utils.el('div', { class: 'stat-label', text: s.label })
      ]);
      grid.appendChild(card);
    });
  }
};

// 启动
App.init();
