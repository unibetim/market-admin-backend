#!/usr/bin/env node
/**
 * 🔧 修复logo路径显示问题
 * 确保前端能正确加载球队logo
 */

const path = require('path');
const fs = require('fs');

// 🎯 修复logo路径问题
const fixLogoPaths = () => {
  console.log('🔧 修复logo路径配置...\n');

  // 1. 检查静态文件配置
  console.log('📁 检查静态文件配置...');
  
  const staticPaths = [
    './market-admin-backend/public/logos/football/premier-league',
    './oddsmarketweb/public/logos/football/premier-league'
  ];

  staticPaths.forEach(staticPath => {
    const fullPath = path.resolve(staticPath);
    console.log(`📍 检查路径: ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ 找到 ${files.length} 个logo文件`);
      
      // 显示前5个文件作为示例
      files.slice(0, 5).forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      if (files.length > 5) {
        console.log(`   ... 和其他 ${files.length - 5} 个文件`);
      }
    } else {
      console.log(`❌ 路径不存在: ${fullPath}`);
    }
    console.log('');
  });

  // 2. 生成正确的logo映射
  console.log('🎯 生成logo路径映射...');
  
  const logoMapping = {
    // 英超球队logo映射
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
    'Wolverhampton_Wanderers': '/static/logos/football/premier-league/Wolves.svg'
  };

  // 3. 创建logo配置文件
  const logoConfigPath = './market-admin-backend/src/config/logoConfig.js';
  const logoConfigContent = `/**
 * 🏈 球队Logo配置
 * 自动生成 - 请勿手动编辑
 */

const TEAM_LOGOS = {
  // 英超球队
  premier_league: {
${Object.entries(logoMapping).map(([team, path]) => 
    `    '${team}': '${path}'`
  ).join(',\n')}
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
    teamName.replace(/\\s+/g, '_'),
    teamName.replace(/[^a-zA-Z0-9]/g, '_'),
    teamName.split(' ').join('_')
  ];
  
  for (const key of possibleKeys) {
    if (leagueLogos[key]) {
      return leagueLogos[key];
    }
  }
  
  return null;
};

/**
 * 为市场元数据添加logo路径
 */
const enhanceMarketWithLogos = (market) => {
  if (!market.metadata) return market;
  
  const metadata = typeof market.metadata === 'string' 
    ? JSON.parse(market.metadata) 
    : market.metadata;
    
  const league = metadata.league;
  
  if (league && (metadata.teamA || metadata.teamB)) {
    metadata.teamLogos = {
      teamA: getTeamLogo(league, metadata.teamA),
      teamB: getTeamLogo(league, metadata.teamB)
    };
  } else if (league && metadata.teams && Array.isArray(metadata.teams)) {
    metadata.teamLogos = {};
    metadata.teams.forEach((team, index) => {
      metadata.teamLogos[\`team\${String.fromCharCode(65 + index)}\`] = getTeamLogo(league, team);
    });
  }
  
  return {
    ...market,
    metadata: typeof market.metadata === 'string' 
      ? JSON.stringify(metadata)
      : metadata
  };
};

module.exports = {
  TEAM_LOGOS,
  getTeamLogo,
  enhanceMarketWithLogos
};
`;

  // 确保目录存在
  const configDir = path.dirname(logoConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(logoConfigPath, logoConfigContent);
  console.log(`✅ Logo配置文件已创建: ${logoConfigPath}`);

  // 4. 更新市场路由以使用logo配置
  console.log('\\n🔄 更新市场路由...');
  
  const routeUpdateInstructions = `
📝 手动步骤：在 src/routes/markets.js 中添加以下代码：

1. 在文件顶部添加导入：
   const { enhanceMarketWithLogos } = require('../config/logoConfig');

2. 在获取市场列表的路由中，添加logo增强：
   const markets = await req.app.locals.db.getMarkets(filters);
   const enhancedMarkets = markets.map(enhanceMarketWithLogos);
   
   res.json({
     success: true,
     data: enhancedMarkets,
     pagination: { ... }
   });

3. 在获取单个市场的路由中也添加相同的处理。
`;

  console.log(routeUpdateInstructions);

  // 5. 生成前端logo配置
  const frontendConfigPath = './oddsmarketweb/src/config/logoConfig.js';
  const frontendConfigContent = `/**
 * 🏈 前端Logo配置
 * 用于前端组件中正确显示球队logo
 */

export const TEAM_LOGOS = {
${Object.entries(logoMapping).map(([team, path]) => 
    `  '${team}': '${path}'`
  ).join(',\n')}
};

/**
 * 获取球队logo URL
 */
export const getTeamLogoUrl = (teamName) => {
  if (!teamName) return null;
  
  // 尝试多种匹配方式
  const possibleKeys = [
    teamName,
    teamName.replace(/\\s+/g, '_'),
    teamName.replace(/[^a-zA-Z0-9]/g, '_'),
    teamName.split(' ').join('_')
  ];
  
  for (const key of possibleKeys) {
    if (TEAM_LOGOS[key]) {
      return TEAM_LOGOS[key];
    }
  }
  
  return null;
};

/**
 * 处理logo加载错误的fallback
 */
export const getLogoFallback = (teamName) => {
  return \`https://via.placeholder.com/60x60/3B82F6/FFFFFF?text=\${encodeURIComponent(teamName?.charAt(0) || '?')}\`;
};
`;

  const frontendConfigDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, frontendConfigContent);
  console.log(`✅ 前端Logo配置文件已创建: ${frontendConfigPath}`);

  // 6. 测试URL生成
  console.log('\\n🧪 测试logo URL生成...');
  
  const testTeams = ['Arsenal', 'Manchester_City', 'Liverpool', 'Chelsea'];
  testTeams.forEach(team => {
    const logoPath = logoMapping[team];
    const fullUrl = `http://localhost:3001${logoPath}`;
    console.log(`🔗 ${team}: ${fullUrl}`);
  });

  console.log('\\n🎉 Logo路径修复完成！');
  console.log('\\n📋 下一步操作：');
  console.log('1. 重启后端服务器以加载新的静态文件配置');
  console.log('2. 手动更新 markets.js 路由文件（见上面的指示）');
  console.log('3. 在前端组件中使用 logoConfig 来获取正确的logo路径');
  console.log('4. 测试logo显示是否正常');
};

// 运行修复
if (require.main === module) {
  fixLogoPaths();
}

module.exports = { fixLogoPaths };