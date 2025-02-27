// 向量点积
export const dotProduct = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    throw new Error('向量必须是相同长度的数组');
  }
  
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
};

// 向量幅值
export const magnitude = (vec) => {
  if (!Array.isArray(vec)) {
    throw new Error('向量必须是数组');
  }
  
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
};

// 余弦相似度
export const cosineSimilarity = (vecA, vecB) => {
  const dotProd = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  
  if (magA === 0 || magB === 0) return 0;
  
  return dotProd / (magA * magB);
};

// 欧几里得距离
export const euclideanDistance = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    throw new Error('向量必须是相同长度的数组');
  }
  
  const sum = vecA.reduce((acc, val, i) => {
    const diff = val - vecB[i];
    return acc + diff * diff;
  }, 0);
  
  return Math.sqrt(sum);
};

// 向量相似度（使用余弦相似度）
export const vectorSimilarity = (vecA, vecB) => {
  return cosineSimilarity(vecA, vecB);
};

// 生成随机向量（测试用）
export const generateRandomVector = (size) => {
  return Array(size).fill(0).map(() => Math.random() * 2 - 1);
};

// 向量归一化
export const normalizeVector = (vec) => {
  const mag = magnitude(vec);
  if (mag === 0) return vec;
  
  return vec.map(val => val / mag);
};