/**
 * 🏈 球队Logo配置
 * 自动生成 - 请勿手动编辑
 */

const TEAM_LOGOS = {
  // 英超球队
  'premier-league': {
    'Arsenal': '/static/logos/football/premier-league/Arsenal.svg',
    'Aston_Villa': '/static/logos/football/premier-league/Aston_Villa.png',
    'AFC_Bournemouth': '/static/logos/football/premier-league/Bournemouth.svg',
    'Brentford': '/static/logos/football/premier-league/Brentford.svg',
    'Brighton_Hove_Albion': '/static/logos/football/premier-league/Brighton.svg',
    'Chelsea': '/static/logos/football/premier-league/Chelsea.svg',
    'Crystal_Palace': '/static/logos/football/premier-league/Crystal_Palace.svg',
    'Everton': '/static/logos/football/premier-league/Everton.png',
    'Fulham': '/static/logos/football/premier-league/Fulham.svg',
    'Ipswich_Town': '/static/logos/football/premier-league/Ipswich.svg',
    'Leicester_City': '/static/logos/football/premier-league/Leicester_City.png',
    'Liverpool': '/static/logos/football/premier-league/Liverpool.svg',
    'Manchester_City': '/static/logos/football/premier-league/Manchester_City.svg',
    'Manchester_United': '/static/logos/football/premier-league/Manchester_United.svg',
    'Newcastle_United': '/static/logos/football/premier-league/Newcastle.svg',
    'Nottingham_Forest': '/static/logos/football/premier-league/Nottingham_Forest.svg',
    'Southampton': '/static/logos/football/premier-league/Southampton.svg',
    'Tottenham_Hotspur': '/static/logos/football/premier-league/Tottenham_Hotspur.png',
    'West_Ham_United': '/static/logos/football/premier-league/West_Ham.svg',
    'Wolverhampton_Wanderers': '/static/logos/football/premier-league/Wolves.svg',
    'Wolves': '/static/logos/football/premier-league/Wolves.svg'
  },

  // 其他联赛可以在这里扩展
  la_liga: {
    'Real_Madrid': '/static/logos/football/la-liga/Real_Madrid.svg',
    'Barcelona': '/static/logos/football/la-liga/Barcelona.svg',
    'Atletico_Madrid': '/static/logos/football/la-liga/Atletico_Madrid.svg'
  },

  serie_a: {
    'Juventus': '/static/logos/football/serie-a/Juventus.svg',
    'AC_Milan': '/static/logos/football/serie-a/AC_Milan.svg',
    'Inter_Milan': '/static/logos/football/serie-a/Inter_Milan.svg'
  },

  bundesliga: {
    'Bayern_Munich': '/static/logos/football/bundesliga/Bayern_Munich.svg',
    'Dortmund': '/static/logos/football/bundesliga/Dortmund.svg'
  }
};

/**
 * 获取球队logo路径
 */
const getTeamLogo = (league, teamName) => {
  if (!league || !teamName) return null;

  const leagueLogos = TEAM_LOGOS[league];
  if (!leagueLogos) return null;

  // 尝试多种匹配方式
  const possibleKeys = [
    teamName,
    teamName.replace(/\s+/g, '_'),
    teamName.replace(/[^a-zA-Z0-9]/g, '_'),
    teamName.split(' ').join('_'),
    // 添加首字母大写的转换
    teamName.charAt(0).toUpperCase() + teamName.slice(1),
    teamName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_'),
    // 处理连字符情况并转换为下划线
    teamName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_')
  ];

  for (const key of possibleKeys) {
    if (leagueLogos[key]) {
      return leagueLogos[key];
    }
  }

  return null;
};

/**
 * 为市场元数据添加logo路径和链上统计数据
 */
const enhanceMarketWithLogos = async (market) => {
  // 总是返回market，即使metadata为空也要保持原始结构
  if (!market.metadata) {
    return {
      ...market,
      // 保持metadata的原始值（可能是null、空字符串等）
    };
  }

  const metadata = typeof market.metadata === 'string'
    ? JSON.parse(market.metadata)
    : market.metadata;

  const league = metadata.league;

  // 只有当teamLogos不存在时才生成
  if (!metadata.teamLogos) {
    if (league && (metadata.teamA || metadata.teamB)) {
      metadata.teamLogos = {
        teamA: getTeamLogo(league, metadata.teamA),
        teamB: getTeamLogo(league, metadata.teamB)
      };
    } else if (league && metadata.teams && Array.isArray(metadata.teams)) {
      metadata.teamLogos = {};
      metadata.teams.forEach((team, index) => {
        metadata.teamLogos[`team${String.fromCharCode(65 + index)}`] = getTeamLogo(league, team);
      });
    }
  }

  // 添加链上统计数据
  let chainStats = null;
  if (market.chain_market_id) {
    try {
      const { getMarketTraderCountForAPI } = require('../../utils/chainStatsHelper');
      chainStats = await getMarketTraderCountForAPI(market.chain_market_id);
    } catch (error) {
      console.warn(`获取市场${market.chain_market_id}链上统计失败:`, error.message);
    }
  }

  // 构建增强后的市场对象
  const enhancedMarket = {
    ...market,
    metadata: typeof market.metadata === 'string'
      ? JSON.stringify(metadata)
      : metadata
  };

  // 如果有链上统计数据，添加到市场对象中
  if (chainStats) {
    enhancedMarket.traders = chainStats.uniqueTraders;
    enhancedMarket.volume_24h = chainStats.totalVolume;
    enhancedMarket.liquidity_providers = chainStats.liquidityProviders;
  } else {
    // 如果是活跃市场但没有链上ID，设为0而不是随机数
    const isActiveMarket = market.status === 'active' && market.chain_market_id;
    enhancedMarket.traders = isActiveMarket ? 0 : 0;
    enhancedMarket.volume_24h = isActiveMarket ? '0' : '0';
    enhancedMarket.liquidity_providers = isActiveMarket ? 0 : 0;
  }

  return enhancedMarket;
};

module.exports = {
  TEAM_LOGOS,
  getTeamLogo,
  enhanceMarketWithLogos
};
