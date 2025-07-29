const axios = require('axios');

/**
 * IPFS管理器 - 复用前端的免费IPFS策略
 * 兼容前端的ipfsManager.js逻辑
 */
class IPFSManager {
  constructor() {
    this.gateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.infura.io/ipfs/'
    ];
    
    this.cache = new Map();
    this.performance = new Map();
  }

  /**
   * 生成确定性IPFS哈希 (模拟)
   * 复用前端逻辑确保一致性
   */
  generateHash(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const positiveHash = Math.abs(hash);
    const paddedHash = positiveHash.toString(16).padStart(12, '0');
    return `Qm${paddedHash}abcd1234567890`;
  }

  /**
   * 上传元数据到IPFS (模拟存储)
   */
  async uploadMetadata(metadata) {
    try {
      // 标准化元数据格式，与前端保持一致
      const standardizedMetadata = {
        version: '2.0',
        basic: {
          title: metadata.title || '',
          description: metadata.description || '',
          category: metadata.category || 'other',
          tags: metadata.tags || []
        },
        outcomes: metadata.outcomes || [
          { id: 0, name: '是', color: '#10B981' },
          { id: 1, name: '否', color: '#EF4444' }
        ],
        timestamps: {
          created: Math.floor(Date.now() / 1000),
          updated: Math.floor(Date.now() / 1000)
        },
        system: {
          version: '2.0',
          platform: 'OddsMarket',
          ipfsManager: 'admin-backend-v1.0',
          storage: 'simulated'
        },
        ...metadata
      };

      const ipfsHash = this.generateHash(standardizedMetadata);
      
      // 缓存到本地存储 (模拟IPFS)
      this.cache.set(ipfsHash, standardizedMetadata);
      
      console.log(`📤 IPFS元数据上传成功: ${ipfsHash}`);
      
      return {
        success: true,
        ipfsHash,
        url: `${this.gateways[0]}${ipfsHash}`,
        metadata: standardizedMetadata
      };
      
    } catch (error) {
      console.error('IPFS上传失败:', error);
      throw new Error(`IPFS上传失败: ${error.message}`);
    }
  }

  /**
   * 从IPFS获取元数据
   */
  async getMetadata(ipfsHash) {
    try {
      // 先检查本地缓存
      if (this.cache.has(ipfsHash)) {
        return {
          success: true,
          data: this.cache.get(ipfsHash),
          source: 'cache'
        };
      }

      // 尝试从IPFS网关获取
      for (const gateway of this.gateways) {
        try {
          const response = await axios.get(`${gateway}${ipfsHash}`, {
            timeout: 5000,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.data) {
            // 缓存结果
            this.cache.set(ipfsHash, response.data);
            
            return {
              success: true,
              data: response.data,
              source: 'ipfs'
            };
          }
        } catch (gatewayError) {
          console.warn(`IPFS网关 ${gateway} 获取失败:`, gatewayError.message);
          continue;
        }
      }

      throw new Error('所有IPFS网关都无法访问');

    } catch (error) {
      console.error('IPFS获取失败:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * 上传图片到IPFS (Base64编码)
   */
  async uploadImage(imageBuffer, filename, mimeType) {
    try {
      const base64Data = imageBuffer.toString('base64');
      const imageData = {
        name: filename,
        data: base64Data,
        mimeType: mimeType,
        size: imageBuffer.length,
        uploadTime: Math.floor(Date.now() / 1000)
      };

      const ipfsHash = this.generateHash(imageData);
      this.cache.set(ipfsHash, imageData);

      console.log(`🖼️ IPFS图片上传成功: ${filename} -> ${ipfsHash}`);

      return {
        success: true,
        ipfsHash,
        url: `${this.gateways[0]}${ipfsHash}`,
        name: filename,
        size: imageBuffer.length
      };

    } catch (error) {
      console.error('IPFS图片上传失败:', error);
      throw new Error(`图片上传失败: ${error.message}`);
    }
  }

  /**
   * 生成市场描述 (与前端格式一致)
   */
  generateDescription(ipfsHash, title) {
    return `ipfs://${ipfsHash}#${title}`;
  }

  /**
   * 验证IPFS哈希格式
   */
  validateIPFSHash(hash) {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const stats = {};
    for (const [gateway, perf] of this.performance.entries()) {
      stats[gateway] = {
        successRate: perf.success / (perf.success + perf.failure) * 100,
        averageTime: perf.totalTime / perf.success || 0,
        totalRequests: perf.success + perf.failure
      };
    }
    return stats;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ IPFS缓存已清理');
  }

  /**
   * 获取缓存状态
   */
  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

module.exports = IPFSManager;