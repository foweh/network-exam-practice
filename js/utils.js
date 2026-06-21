/**
 * 通用工具函数
 */

const Utils = {
  /**
   * 防抖
   */
  debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  /**
   * 洗牌算法（Fisher-Yates）
   */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /**
   * 从数组中随机取样
   */
  sample(arr, n) {
    if (n >= arr.length) return Utils.shuffle(arr);
    return Utils.shuffle(arr).slice(0, n);
  },

  /**
   * 转义 HTML
   */
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * 将换行符转为 <br>，并转义 HTML
   */
  formatText(text) {
    return Utils.escapeHtml(text).replace(/\n/g, '<br>');
  },

  /**
   * 题型中文名
   */
  typeName(type) {
    const map = { choice: '选择题', judge: '判断题', fill: '填空题', essay: '简答题' };
    return map[type] || type;
  },

  /**
   * 章节中文名
   */
  categoryName(cat) {
    const map = {
      'ch01_概述与体系结构': '概述与体系结构',
      'ch02_物理层': '物理层',
      'ch03_数据链路层': '数据链路层',
      'ch04_网络层': '网络层',
      'ch05_传输层': '传输层',
      'ch06_应用层': '应用层',
      'ch07_网络安全与新趋势': '网络安全与新趋势'
    };
    return map[cat] || cat;
  },

  /**
   * 解析选项键，支持 A/B/C/D
   */
  optionKeys(options) {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options.map((opt, i) => ({
        key: String.fromCharCode(65 + i),
        value: opt
      }));
    }
    return Object.keys(options).sort().map(k => ({ key: k, value: options[k] }));
  },

  /**
   * 规范化答案用于比较
   */
  normalizeAnswer(ans) {
    return String(ans)
      .toLowerCase()
      .replace(/[\s;；,，]/g, '')
      .trim();
  },

  /**
   * 判断两个答案是否相等（填空题支持多答案）
   */
  answersEqual(input, correct) {
    const user = Utils.normalizeAnswer(input);
    const corr = String(correct).split(/[;；,，]/).map(s => Utils.normalizeAnswer(s));
    return corr.some(c => c && c === user);
  },

  /**
   * 显示 Toast
   */
  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },

  /**
   * 创建 DOM 元素
   */
  el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }
};
