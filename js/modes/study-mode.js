/**
 * 学习模式：先隐藏答案，用户作答后再显示，强化主动回忆
 */

const StudyMode = {
  name: 'study',
  questions: [],
  index: 0,
  revealed: new Set(),
  userAnswers: {},
  correctCount: 0,
  wrongCount: 0,

  init() {
    this.questions = State.getFilteredQuestions();
    this.index = 0;
    this.revealed.clear();
    this.userAnswers = {};
    this.correctCount = 0;
    this.wrongCount = 0;
    this.render();
    this.updateProgress();
  },

  hasAnswered(q) {
    return this.revealed.has(State.questionKey(q));
  },

  isCorrect(q, answer) {
    if (q.type === 'choice' || q.type === 'judge') return String(answer) === String(q.answer);
    if (q.type === 'fill') return Utils.answersEqual(answer, q.answer);
    return true;
  },

  render() {
    const main = document.getElementById('mainArea');
    main.innerHTML = '';

    if (!this.questions.length) {
      main.appendChild(this.emptyState());
      this.updateFooter([]);
      return;
    }

    const q = this.questions[this.index];
    const showAnswer = this.hasAnswered(q);
    const userAnswer = this.userAnswers[State.questionKey(q)];
    const card = QuestionRenderer.render(q, {
      showAnswer,
      disabled: showAnswer,
      userAnswer,
      onAnswer: (answer, correct) => {
        this.revealed.add(State.questionKey(q));
        this.userAnswers[State.questionKey(q)] = answer;
        if (correct) this.correctCount++;
        else this.wrongCount++;
        this.render();
        this.updateProgress();
      },
      onStar: () => this.updateProgress()
    });
    main.appendChild(card);

    const buttons = [
      { text: '上一题', class: 'btn', disabled: this.index === 0, onClick: () => this.prev() },
      { text: '下一题', class: 'btn btn-primary', disabled: this.index === this.questions.length - 1, onClick: () => this.next() }
    ];
    if (!showAnswer) {
      buttons.push({ text: '显示答案', class: 'btn btn-ghost', onClick: () => {
        this.revealed.add(State.questionKey(q));
        this.render();
      }});
    }
    buttons.push({ text: '随机一题', class: 'btn btn-ghost', onClick: () => this.random() });
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

  random() {
    this.index = Math.floor(Math.random() * this.questions.length);
    this.render();
    this.updateProgress();
  },

  updateProgress() {
    const total = this.questions.length;
    const current = total ? this.index + 1 : 0;
    const stats = `正确 ${this.correctCount} · 错误 ${this.wrongCount}`;
    document.getElementById('progressText').textContent = `${current} / ${total} · ${stats}`;
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

  emptyState() {
    return Utils.el('div', { class: 'empty-state' }, [
      Utils.el('div', { class: 'big-emoji', text: '📚' }),
      Utils.el('h3', { text: '没有符合条件的题目' }),
      Utils.el('p', { text: '请调整左侧筛选条件或选择题库来源。' })
    ]);
  }
};
