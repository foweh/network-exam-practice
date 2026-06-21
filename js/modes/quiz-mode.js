/**
 * 测验模式：抽题作答，提交后评分，帮助巩固记忆
 */

const QuizMode = {
  name: 'quiz',
  questions: [],
  index: 0,
  answers: {},       // key -> user answer
  revealed: new Set(), // key -> 是否已揭示答案
  finished: false,

  init() {
    const pool = State.getFilteredQuestions();
    const count = Math.min(Math.max(parseInt(State.data.quizCount, 10) || 20, 1), pool.length);
    this.questions = Utils.sample(pool, count);
    this.index = 0;
    this.answers = {};
    this.revealed = new Set();
    this.finished = false;
    this.render();
    this.updateProgress();
  },

  render() {
    const main = document.getElementById('mainArea');
    main.innerHTML = '';

    if (!this.questions.length) {
      main.appendChild(this.emptyState('没有符合条件的题目，请调整筛选条件。'));
      this.updateFooter([]);
      return;
    }

    if (this.finished) {
      this.renderResult(main);
      this.updateFooter([
        { text: '再来一组', class: 'btn btn-primary', onClick: () => this.init() },
        { text: '返回学习', class: 'btn', onClick: () => this.switchMode('study') }
      ]);
      document.getElementById('progressText').textContent = '测验结束';
      document.getElementById('progressFill').style.width = '100%';
      return;
    }

    const q = this.questions[this.index];
    const key = State.questionKey(q);
    const showAnswer = this.revealed.has(key);
    const userAnswer = this.answers[key] || '';

    const card = QuestionRenderer.render(q, {
      showAnswer,
      disabled: showAnswer,
      userAnswer,
      onAnswer: (ans, correct) => {
        this.answers[key] = ans;
        this.revealed.add(key);
        this.render();
        this.updateProgress();
      }
    });
    main.appendChild(card);

    const buttons = [];
    if (this.index > 0) {
      buttons.push({ text: '上一题', class: 'btn', onClick: () => this.prev() });
    }
    if (!showAnswer) {
      buttons.push({ text: '跳过/看答案', class: 'btn btn-ghost', onClick: () => {
        this.revealed.add(key);
        State.recordAnswer(q, false);
        this.render();
        this.updateProgress();
      }});
    }
    if (this.index < this.questions.length - 1) {
      buttons.push({ text: '下一题', class: 'btn btn-primary', onClick: () => this.next() });
    } else {
      buttons.push({ text: '提交并查看结果', class: 'btn btn-success', onClick: () => this.finish() });
    }
    this.updateFooter(buttons);
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

  finish() {
    this.finished = true;
    this.render();
  },

  renderResult(container) {
    let correct = 0, wrong = 0, skipped = 0;
    this.questions.forEach(q => {
      const key = State.questionKey(q);
      const ans = this.answers[key];
      if (!this.revealed.has(key) || ans === undefined || ans === '') {
        skipped++;
      } else if (this.isCorrect(q, ans)) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = this.questions.length;
    const score = Math.round((correct / total) * 100);

    const summary = Utils.el('div', { class: 'result-summary slide-in' }, [
      Utils.el('h2', { text: '测验结果' }),
      Utils.el('div', { class: 'result-score', text: `${score}分` }),
      Utils.el('div', { class: 'result-detail' }, [
        Utils.el('div', {}, [Utils.el('span', { class: 'num', text: correct }), Utils.el('span', { class: 'label', text: '正确' })]),
        Utils.el('div', {}, [Utils.el('span', { class: 'num', text: wrong }), Utils.el('span', { class: 'label', text: '错误' })]),
        Utils.el('div', {}, [Utils.el('span', { class: 'num', text: skipped }), Utils.el('span', { class: 'label', text: '未答' })])
      ])
    ]);
    container.appendChild(summary);

    // 列出答错的题
    if (wrong > 0) {
      container.appendChild(Utils.el('h3', { text: '错题回顾', style: 'margin-top:1.5rem;' }));
      this.questions.forEach(q => {
        const key = State.questionKey(q);
        const ans = this.answers[key];
        if (!this.isCorrect(q, ans)) {
          const card = QuestionRenderer.render(q, {
            showAnswer: true,
            disabled: true,
            userAnswer: ans
          });
          container.appendChild(card);
        }
      });
    }
  },

  isCorrect(q, ans) {
    if (ans === undefined || ans === '') return false;
    if (q.type === 'choice' || q.type === 'judge') {
      return String(ans) === String(q.answer);
    }
    if (q.type === 'fill') {
      return Utils.answersEqual(ans, q.answer);
    }
    return true;
  },

  updateProgress() {
    const total = this.questions.length;
    const current = total ? this.index + 1 : 0;
    const done = Object.keys(this.answers).length;
    document.getElementById('progressText').textContent = `第 ${current}/${total} 题 · 已答 ${done}`;
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
      Utils.el('div', { class: 'big-emoji', text: '✏️' }),
      Utils.el('h3', { text: '暂无题目' }),
      Utils.el('p', { text: msg })
    ]);
  },

  switchMode(mode) {
    document.querySelector(`.mode-tab[data-mode="${mode}"]`).click();
  }
};
