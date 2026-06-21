/**
 * 数据转换脚本
 * 将三个源 JSON 文件转换为网页使用的统一格式 exam1.json / exam2.json / exam3.json
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', '..');
const outDir = __dirname;

const categoryMap = {
  '计算机网络概述': 'ch01_概述与体系结构',
  '物理层': 'ch02_物理层',
  '数据链路层': 'ch03_数据链路层',
  '网络层': 'ch04_网络层',
  '传输层': 'ch05_传输层',
  '应用层': 'ch06_应用层',
  '网络安全': 'ch07_网络安全与新趋势',
  '其他': 'ch07_网络安全与新趋势'
};

function inferCategory(text) {
  if (!text) return 'ch07_网络安全与新趋势';
  const t = String(text).toLowerCase();
  if (t.includes('osi') || t.includes('拓扑') || t.includes('体系') || t.includes('协议三要素') || t.includes('带宽') || t.includes('分组交换')) return 'ch01_概述与体系结构';
  if (t.includes('物理层') || t.includes('双绞线') || t.includes('光纤') || t.includes('曼彻斯特') || t.includes('集线器') || t.includes('中继器') || t.includes('hub') || t.includes('modem')) return 'ch02_物理层';
  if (t.includes('数据链路层') || t.includes('mac') || t.includes('以太网') || t.includes('交换机') || t.includes('ppp') || t.includes('vlan') || t.includes('csma') || t.includes('crc') || t.includes('网桥')) return 'ch03_数据链路层';
  if (t.includes('网络层') || t.includes('ip') || t.includes('路由') || t.includes('子网') || t.includes('arp') || t.includes('icmp') || t.includes('ospf') || t.includes('rip') || t.includes('bgp') || t.includes('cidr')) return 'ch04_网络层';
  if (t.includes('传输层') || t.includes('tcp') || t.includes('udp') || t.includes('三次握手') || t.includes('四次挥手') || t.includes('拥塞控制') || t.includes('滑动窗口')) return 'ch05_传输层';
  if (t.includes('应用层') || t.includes('http') || t.includes('ftp') || t.includes('dns') || t.includes('dhcp') || t.includes('smtp') || t.includes('pop') || t.includes('www')) return 'ch06_应用层';
  if (t.includes('安全') || t.includes('防火墙') || t.includes('ssl') || t.includes('tls') || t.includes('vpn') || t.includes('nat') || t.includes('攻击') || t.includes('dos')) return 'ch07_网络安全与新趋势';
  return 'ch07_网络安全与新趋势';
}

function buildMeta(title, counts) {
  return {
    title,
    course: 'Computer Networks',
    reference: '谢希仁《计算机网络》第8版 知识框架',
    total: { choice: counts.choices, judge: counts.judges, fill: counts.fills, essay: counts.essays },
    categories: [
      'ch01_概述与体系结构',
      'ch02_物理层',
      'ch03_数据链路层',
      'ch04_网络层',
      'ch05_传输层',
      'ch06_应用层',
      'ch07_网络安全与新趋势'
    ]
  };
}

function boolAnswer(ans) {
  if (typeof ans === 'boolean') return ans;
  return ans === '正确' || ans === '对' || ans === '是' || ans === 'T' || ans === 'True' || ans === 'true';
}

// ===== exam1：来自文件1（中文键） =====
const f1 = JSON.parse(fs.readFileSync(path.join(srcDir, '新建 文本文档.js'), 'utf8'));
const dist1 = f1.题型分布;

const exam1Choices = (dist1.选择题.题目列表 || []).map((q, idx) => ({
  id: idx + 1,
  category: categoryMap[q.章节] || inferCategory(q.题干),
  difficulty: 1,
  question: q.题干,
  options: q.选项,
  answer: q.答案,
  explanation: q.解析 || ''
}));

const exam1Judges = (dist1.判断题.题目列表 || []).map((q, idx) => ({
  id: idx + 1,
  category: categoryMap[q.章节] || inferCategory(q.题干),
  difficulty: 1,
  question: q.题干,
  answer: boolAnswer(q.答案),
  explanation: q.解析 || ''
}));

const exam1Fills = (dist1.填空题.题目列表 || []).map((q, idx) => ({
  id: idx + 1,
  category: categoryMap[q.章节] || inferCategory(q.题干),
  difficulty: 1,
  question: q.题干,
  answer: q.答案,
  explanation: q.解析 || ''
}));

const exam1Essays = (dist1.大题.题目列表 || []).map((q, idx) => ({
  id: idx + 1,
  category: categoryMap[q.章节] || inferCategory(q.题干),
  difficulty: q.题型 === '计算题' ? 2 : 1,
  question: q.题干,
  answer: q.参考答案,
  explanation: ''
}));

const exam1 = {
  meta: buildMeta('计算机网络期末试题（卷一）', {
    choices: exam1Choices.length,
    judges: exam1Judges.length,
    fills: exam1Fills.length,
    essays: exam1Essays.length
  }),
  choices: exam1Choices,
  judges: exam1Judges,
  fills: exam1Fills,
  essays: exam1Essays
};

// ===== exam2：来自文件2（英文键，选项为数组） =====
const f2 = JSON.parse(fs.readFileSync(path.join(srcDir, '新建 文本文档 (2).js'), 'utf8'));
const cat2 = f2.exam.categories;

function arrayOptionsToObject(arr) {
  const obj = {};
  (arr || []).forEach(item => {
    const m = item.match(/^([A-D])\.\s*(.+)$/);
    if (m) obj[m[1]] = m[2].trim();
    else {
      const first = item.charAt(0);
      if (/[A-D]/.test(first)) obj[first] = item.slice(1).replace(/^\.\s*/, '').trim();
      else obj[String.fromCharCode(65 + Object.keys(obj).length)] = item;
    }
  });
  return obj;
}

const exam2Choices = (cat2.选择题.questions || []).map((q, idx) => ({
  id: idx + 1,
  category: inferCategory(q.question),
  difficulty: 1,
  question: q.question,
  options: arrayOptionsToObject(q.options),
  answer: q.answer,
  explanation: ''
}));

const exam2Judges = (cat2.判断题.questions || []).map((q, idx) => ({
  id: idx + 1,
  category: inferCategory(q.question),
  difficulty: 1,
  question: q.question,
  answer: boolAnswer(q.answer),
  explanation: ''
}));

const exam2Fills = (cat2.填空题.questions || []).map((q, idx) => ({
  id: idx + 1,
  category: inferCategory(q.question),
  difficulty: 1,
  question: q.question,
  answer: q.answer,
  explanation: ''
}));

const exam2 = {
  meta: buildMeta('计算机网络期末试题（卷二）', {
    choices: exam2Choices.length,
    judges: exam2Judges.length,
    fills: exam2Fills.length,
    essays: 0
  }),
  choices: exam2Choices,
  judges: exam2Judges,
  fills: exam2Fills,
  essays: []
};

// ===== exam3：来自文件3（已经是统一格式） =====
const exam3 = JSON.parse(fs.readFileSync(path.join(srcDir, '新建 文本文档 (3).js'), 'utf8'));

fs.writeFileSync(path.join(outDir, 'exam1.json'), JSON.stringify(exam1, null, 2), 'utf8');
fs.writeFileSync(path.join(outDir, 'exam2.json'), JSON.stringify(exam2, null, 2), 'utf8');
fs.writeFileSync(path.join(outDir, 'exam3.json'), JSON.stringify(exam3, null, 2), 'utf8');

console.log('数据生成完成');
console.log('exam1:', exam1.meta.total);
console.log('exam2:', exam2.meta.total);
console.log('exam3:', exam3.meta.total);
