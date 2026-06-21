/**
 * 题目渲染器
 */

const QuestionRenderer = {
  /**
   * 渲染一道题的 DOM
   * @param {Object} q 题目对象
   * @param {Object} opts
   *   - showAnswer: boolean 是否显示答案
   *   - disabled: boolean 是否禁用交互
   *   - userAnswer: string 用户答案
   *   - onAnswer: function(answer, correct) 答题回调
   *   - onStar: function(isStarred) 收藏回调
   */
  render(q, opts = {}) {
    const { showAnswer = false, disabled = false, userAnswer = '', onAnswer, onStar } = opts;
    const card = Utils.el('article', { class: 'question-card slide-in' });
    card.dataset.key = State.questionKey(q);

    const checkCorrect = (q, ans) => {
      if (ans === undefined || ans === '') return null;
      if (q.type === 'choice' || q.type === 'judge') return String(ans) === String(q.answer);
      if (q.type === 'fill') return Utils.answersEqual(ans, q.answer);
      return true;
    };

    // 头部：元信息与收藏按钮
    const header = Utils.el('div', { class: 'question-header' });
    const meta = Utils.el('div', { class: 'question-meta' });
    meta.appendChild(Utils.el('span', { class: `badge ${q.type}` }, [Utils.typeName(q.type)]));
    meta.appendChild(Utils.el('span', { class: 'badge' }, [Utils.categoryName(q.category)]));
    if (q.difficulty) {
      meta.appendChild(Utils.el('span', { class: 'badge' }, [`难度 ${q.difficulty}`]));
    }
    header.appendChild(meta);

    const actions = Utils.el('div', { class: 'question-actions' });
    const starBtn = Utils.el('button', {
      class: `star ${State.isStarred(q) ? 'active' : ''}`,
      title: '收藏/取消收藏',
      html: State.isStarred(q) ? '★' : '☆'
    });
    starBtn.addEventListener('click', () => {
      const active = State.toggleStar(q);
      starBtn.classList.toggle('active', active);
      starBtn.innerHTML = active ? '★' : '☆';
      if (onStar) onStar(active);
    });
    actions.appendChild(starBtn);
    header.appendChild(actions);
    card.appendChild(header);

    // 题干
    const body = Utils.el('div', { class: 'question-body', html: Utils.formatText(q.question) });
    card.appendChild(body);

    // 答题结果横幅
    if (showAnswer) {
      const correct = checkCorrect(q, userAnswer);
      if (correct !== null) {
        const bannerClass = correct ? 'result-banner correct' : 'result-banner wrong';
        const bannerText = correct ? '✅ 回答正确' : '❌ 回答错误';
        card.appendChild(Utils.el('div', { class: bannerClass, text: bannerText }));
      }
    }

    // 答案区
    const answerArea = this.renderAnswerArea(q, { showAnswer, disabled, userAnswer, onAnswer });
    card.appendChild(answerArea.root);

    // 解析
    if (showAnswer && q.explanation) {
      card.appendChild(Utils.el('div', { class: 'explanation' }, [
        Utils.el('div', { class: 'explanation-title', text: '解析' }),
        Utils.el('div', { html: Utils.formatText(q.explanation) })
      ]));
    }

    return card;
  },

  renderAnswerArea(q, opts) {
    const { showAnswer, disabled, userAnswer, onAnswer } = opts;
    const root = Utils.el('div', { class: 'answer-area' });
    let controls = [];

    if (q.type === 'choice') {
      const options = Utils.optionKeys(q.options);
      options.forEach(({ key, value }) => {
        const label = Utils.el('label', { class: 'option-label' });
        const input = Utils.el('input', { type: 'radio', name: State.questionKey(q), value: key });
        if (disabled || showAnswer) input.disabled = true;
        if (userAnswer === key) input.checked = true;

        if (showAnswer) {
          const isCorrect = key === String(q.answer);
          const isSelected = key === String(userAnswer);
          if (isCorrect) label.classList.add('correct');
          else if (isSelected) label.classList.add('wrong');
          label.classList.add('disabled');
        }

        input.addEventListener('change', () => {
          const correct = key === String(q.answer);
          State.recordAnswer(q, correct);
          if (onAnswer) onAnswer(key, correct);
        });

        label.appendChild(input);
        label.appendChild(Utils.el('span', { html: `<strong>${key}.</strong> ${Utils.formatText(value)}` }));
        root.appendChild(label);
      });

    } else if (q.type === 'judge') {
      [
        { key: 'true', text: '正确' },
        { key: 'false', text: '错误' }
      ].forEach(({ key, text }) => {
        const label = Utils.el('label', { class: 'option-label' });
        const input = Utils.el('input', { type: 'radio', name: State.questionKey(q), value: key });
        if (disabled || showAnswer) input.disabled = true;
        const expected = String(q.answer) === 'true' ? 'true' : 'false';
        if (String(userAnswer) === key) input.checked = true;

        if (showAnswer) {
          const isCorrect = key === expected;
          const isSelected = key === String(userAnswer);
          if (isCorrect) label.classList.add('correct');
          else if (isSelected) label.classList.add('wrong');
          label.classList.add('disabled');
        }

        input.addEventListener('change', () => {
          const correct = key === expected;
          State.recordAnswer(q, correct);
          if (onAnswer) onAnswer(key, correct);
        });

        label.appendChild(input);
        label.appendChild(Utils.el('span', { text }));
        root.appendChild(label);
      });

    } else if (q.type === 'fill') {
      const input = Utils.el('input', {
        class: 'answer-input',
        type: 'text',
        placeholder: '请输入答案',
        value: userAnswer || ''
      });
      if (disabled || showAnswer) input.disabled = true;
      if (showAnswer) {
        input.classList.add(Utils.answersEqual(userAnswer, q.answer) ? 'correct' : 'wrong');
      }
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          const correct = Utils.answersEqual(input.value.trim(), q.answer);
          State.recordAnswer(q, correct);
          if (onAnswer) onAnswer(input.value.trim(), correct);
        }
      });
      root.appendChild(input);
      controls.push(input);

    } else if (q.type === 'essay') {
      const textarea = Utils.el('textarea', {
        class: 'answer-input',
        rows: 4,
        placeholder: '简答题可直接查看参考答案，或使用 AI 评分',
        value: userAnswer || ''
      });
      if (disabled || showAnswer) textarea.disabled = true;
      root.appendChild(textarea);
      controls.push(textarea);

      // AI 评分结果容器
      const aiResult = Utils.el('div', { class: 'ai-result', style: 'display:none;' });
      root.appendChild(aiResult);

      const aiBtn = Utils.el('button', { class: 'btn btn-ghost', text: '🤖 AI 评分' });
      aiBtn.addEventListener('click', async () => {
        const val = controls[0].value.trim();
        if (!val) {
          Utils.showToast('请先输入答案再评分');
          return;
        }
        aiBtn.disabled = true;
        aiBtn.textContent = '评分中...';
        aiResult.style.display = 'block';
        aiResult.innerHTML = '<p>正在请求 AI 评分...</p>';
        try {
          const result = await AiClient.grade(q.question, q.answer, val);
          const scoreClass = result.score >= 7 ? 'good' : (result.score >= 4 ? 'medium' : 'poor');
          aiResult.innerHTML = `
            <div class="ai-score ${scoreClass}">${result.score}<span>/10</span></div>
            <div class="ai-feedback"><strong>评语：</strong>${Utils.formatText(result.feedback)}</div>
            ${result.missing ? `<div class="ai-missing"><strong>遗漏：</strong>${Utils.formatText(result.missing)}</div>` : ''}
          `;
        } catch (err) {
          aiResult.innerHTML = `<div class="ai-error">评分失败：${Utils.formatText(err.message)}</div>`;
        } finally {
          aiBtn.disabled = false;
          aiBtn.textContent = '🤖 AI 评分';
        }
      });
      root.appendChild(aiBtn);
    }

    // 填空/简答的提交按钮
    if (q.type === 'fill' || q.type === 'essay') {
      const checkBtn = Utils.el('button', { class: 'btn btn-primary', text: '查看答案' });
      checkBtn.addEventListener('click', () => {
        if (q.type === 'fill') {
          const val = controls[0].value.trim();
          const correct = Utils.answersEqual(val, q.answer);
          State.recordAnswer(q, correct);
          if (onAnswer) onAnswer(val, correct);
        } else {
          if (onAnswer) onAnswer(controls[0].value, true);
        }
      });
      root.appendChild(checkBtn);
    }

    // 显示答案区域
    if (showAnswer) {
      const ansBox = Utils.el('div', { class: 'explanation', style: 'margin-top:0.75rem;' }, [
        Utils.el('div', { class: 'explanation-title', text: '正确答案' }),
        Utils.el('div', { html: Utils.formatText(q.answer) })
      ]);
      root.appendChild(ansBox);
    }

    return { root, controls };
  }
};
