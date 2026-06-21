/**
 * 数据加载与归一化
 */

const DataLoader = {
  sources: [
    { key: 'exam1', name: '卷一（综合）', url: 'data/exam1.json' },
    { key: 'exam2', name: '卷二（选择/判断/填空）', url: 'data/exam2.json' },
    { key: 'exam3', name: '卷三（补全题库）', url: 'data/exam3.json' }
  ],

  async loadAll() {
    const loaded = await Promise.all(
      this.sources.map(async src => {
        try {
          const res = await fetch(src.url);
          if (!res.ok) throw new Error(`${src.url} ${res.status}`);
          const data = await res.json();
          return { key: src.key, name: src.name, data };
        } catch (e) {
          console.error('加载题库失败', src.url, e);
          return { key: src.key, name: src.name, data: null, error: e.message };
        }
      })
    );

    const allQuestions = [];
    const categoriesSet = new Set();

    loaded.forEach(item => {
      if (!item.data) return;
      const source = item.key;
      ['choices', 'judges', 'fills', 'essays'].forEach(typeKey => {
        const type = typeKey.replace('choices', 'choice').replace('judges', 'judge').replace('fills', 'fill').replace('essays', 'essay');
        const list = item.data[typeKey] || [];
        list.forEach(q => {
          allQuestions.push({ ...q, source, type });
          if (q.category) categoriesSet.add(q.category);
        });
      });
    });

    State.data.allQuestions = allQuestions;
    State.data.categories = Array.from(categoriesSet).sort();
    State.data.sources = loaded.filter(i => i.data).map(i => i.key);

    return {
      total: allQuestions.length,
      categories: State.data.categories,
      loaded: loaded.map(i => ({ key: i.key, name: i.name, ok: !!i.data, error: i.error }))
    };
  }
};
