/**
 * 复习模式：错题本 + 收藏夹，针对性强化记忆
 */

const ReviewMode = {
  name: 'review',
  questions: [],
  index: 0,
  subMode: 'wrong', // 'wrong' | 'starred'

  init() {
    this.subMode = 'wrong';
    this.refresh();
  },

  refresh() {
    const pool = this.subMode === 'wrong' ? State.getWrongQuestions() : State.getStarredQuestions();
    this.questions = pool.filter(q => {
      // 仍要遵循题型/难度筛选，章节筛选可选
      if (!State.data.filters.types.includes(q.type)) return false;
      if (!State.data.filters.difficulties.includes(String(q.difficulty || 1))) return false;
      if (State.data.filters.categories.length && !State.data.filters.categories.includes(q.category)) return false;
      return true;
    });
    if (this.index >= this.questions.length) {
      this.index = Math.max(0, this.questions.length - 1);
    }
    this.render();
    this.updateProgress();
  },

  render() {
    const main = document.getElementById('mainArea');
    main.innerHTML = '';

    // 子模式切换
    const tabs = Utils.el('div', { class: 'mode-tabs', style: 'margin-bottom:1rem;' }, [
      this.subTab('wrong', '❌ 错题本'),
      this.subTab('starred', '⭐ 收藏夹')
    ]);
    main.appendChild(tabs);

    if (!this.questions.length) {
      const msg = this.subMode === 'wrong'
        ? '还没有错题，去测验一下吧！'
        : '还没有收藏题目，点击题目右上角的☆收藏。';
      main.appendChild(this.emptyState(msg));
      this.updateFooter([]);
      return;
    }

    const q = this.questions[this.index];
    const card = QuestionRenderer.render(q, {
      showAnswer: true,
      disabled: true,
      onStar: () => this.refresh()
    });
    main.appendChild(card);

    this.updateFooter([
      { text: '上一题', class: 'btn', disabled: this.index === 0, onClick: () => this.prev() },
      { text: '下一题', class: 'btn btn-primary', disabled: this.index === this.questions.length - 1, onClick: () => this.next() },
      { text: '移除复习', class: 'btn btn-danger', onClick: () => this.removeCurrent() }
    ]);
  },

  subTab(key, text) {
    const btn = Utils.el('button', {
      class: `mode-tab ${this.subMode === key ? 'active' : ''}`,
      text
    });
    btn.addEventListener('click', () => {
      this.subMode = key;
      this.refresh();
    });
    return btn;
  },

  prev() {
    if (this.index > 0) {
      this.index--;
      this.render();
      this.updateProgress();
    }
  },

  next() {
    if (this.index < this.questions.length - 1) {
      this.index++;
      this.render();
      this.updateProgress();
    }
  },

  removeCurrent() {
    const q = this.questions[this.index];
    if (this.subMode === 'wrong') {
      State.persisted.wrongKeys.delete(State.questionKey(q));
    } else {
      State.persisted.starredKeys.delete(State.questionKey(q));
    }
    State.savePersisted();
    Utils.showToast('已移除');
    this.refresh();
  },

  updateProgress() {
    const total = this.questions.length;
    const current = total ? this.index + 1 : 0;
    const label = this.subMode === 'wrong' ? '错题' : '收藏';
    document.getElementById('progressText').textContent = `${label} ${current} / ${total}`;
    document.getElementById('progressFill').style.width = total ? `${(current / total) * 100}%` : '0%';
  },

  updateFooter(buttons) {
    const footerActions = document.getElementById('footerActions');
    footerActions.innerHTML = '';
    buttons.forEach(btn => {
      const el = Utils.el('button', { class: btn.class, text: btn.text });
      if (btn.disabled) el.disabled = true;
      el.addEventListener('click', btn.onClick);
      footerActions.appendChild(el);
    });
  },

  emptyState(msg) {
    return Utils.el('div', { class: 'empty-state' }, [
      Utils.el('div', { class: 'big-emoji', text: this.subMode === 'wrong' ? '✅' : '⭐' }),
      Utils.el('h3', { text: this.subMode === 'wrong' ? '暂无错题' : '暂无收藏' }),
      Utils.el('p', { text: msg })
    ]);
  }
};
