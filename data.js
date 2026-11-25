(() => {
  'use strict';

  /**
   * 聚福楼中餐馆营业模拟数据集
   * 包含：用餐区域配置、多周期经营指标、菜系品类占比、渠道分布、热销菜品及实时订单流水
   */
  const AREAS = {
    all: { name: '全店区域汇总', scale: 1.0, subtitle: '新派淮扬融合菜 · 24桌散台 / 8间雅座包厢 / 线上外卖', occupancy: 88, waitTables: 6 },
    hall: { name: '一楼堂食散台 (24桌)', scale: 0.48, subtitle: '一楼大厅散台区 · 当前在座 21/24 桌', occupancy: 88, waitTables: 6 },
    vip: { name: '二楼雅间包厢 (8间)', scale: 0.28, subtitle: '二楼商务宴请与家庭聚餐包厢 · 客单价高', occupancy: 75, waitTables: 0 },
    online: { name: '外卖及小程序自提', scale: 0.24, subtitle: '美团外卖 · 饿了么 · 门店小程序自提专窗', occupancy: 92, waitTables: 0 }
  };

  const RANGE_DATA = {
    today: {
      label: '今日 (11月25日)',
      revenue: 31860,
      target: 35000,
      revDelta: '13.8%',
      orders: 164,
      orderDelta: '9.2%',
      orderSplit: [96, 16, 52],
      ticket: 194.3,
      ticketDelta: '4.6%',
      partySize: '3.4人',
      turnover: '3.5次',
      margin: 65.2,
      marginDelta: '1.2pt',
      periodMix: ['午市 39%', '晚市 53%', '宵夜 8%'],
      sparkline: [24, 36, 52, 44, 60, 82, 91, 74],
      trendLabels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
      trendRevenue: [860, 2240, 4680, 3890, 1480, 920, 1210, 2860, 4980, 5260, 2410, 1070],
      trendOrders: [5, 13, 24, 20, 9, 6, 7, 15, 24, 25, 11, 5],
      trendDineIn: [580, 1680, 3420, 2860, 980, 560, 780, 2140, 3860, 4120, 1820, 710],
      trendDelivery: [280, 560, 1260, 1030, 500, 360, 430, 720, 1120, 1140, 590, 360],
      hourlyOccupancy: [20, 48, 90, 82, 36, 22, 28, 64, 94, 98, 72, 34],
      peakHour: '19:00'
    },
    week: {
      label: '近7日 (11/19 - 11/25)',
      revenue: 218400,
      target: 230000,
      revDelta: '11.4%',
      orders: 1138,
      orderDelta: '7.9%',
      orderSplit: [665, 114, 359],
      ticket: 191.9,
      ticketDelta: '3.5%',
      partySize: '3.4人',
      turnover: '3.3次',
      margin: 64.9,
      marginDelta: '0.8pt',
      periodMix: ['午市 37%', '晚市 55%', '宵夜 8%'],
      sparkline: [54, 59, 64, 68, 86, 94, 76, 82],
      trendLabels: ['11/19 周四', '11/20 周五', '11/21 周六', '11/22 周日', '11/23 周一', '11/24 周二', '11/25 周三'],
      trendRevenue: [26200, 31900, 39600, 38100, 25100, 25640, 31860],
      trendOrders: [138, 166, 198, 191, 136, 145, 164],
      trendDineIn: [19400, 24100, 30600, 29300, 18400, 18900, 23510],
      trendDelivery: [6800, 7800, 9000, 8800, 6700, 6740, 8350],
      hourlyOccupancy: [22, 50, 88, 80, 35, 21, 29, 61, 92, 96, 70, 33],
      peakHour: '周六 19:00'
    },
    month: {
      label: '本月累计 (11月)',
      revenue: 864200,
      target: 920000,
      revDelta: '15.9%',
      orders: 4460,
      orderDelta: '11.6%',
      orderSplit: [2610, 450, 1400],
      ticket: 193.8,
      ticketDelta: '4.0%',
      partySize: '3.5人',
      turnover: '3.4次',
      margin: 65.5,
      marginDelta: '1.5pt',
      periodMix: ['午市 38%', '晚市 54%', '宵夜 8%'],
      sparkline: [46, 54, 58, 63, 70, 76, 82, 88],
      trendLabels: ['第1周', '第2周', '第3周', '第4周(至今)'],
      trendRevenue: [201200, 216800, 227800, 218400],
      trendOrders: [1042, 1118, 1162, 1138],
      trendDineIn: [149500, 162400, 171200, 164210],
      trendDelivery: [51700, 54400, 56600, 54190],
      hourlyOccupancy: [24, 51, 89, 81, 36, 22, 30, 63, 93, 97, 71, 35],
      peakHour: '周末晚市'
    },
    quarter: {
      label: '本季度 (Q4)',
      revenue: 2486000,
      target: 2700000,
      revDelta: '18.2%',
      orders: 12740,
      orderDelta: '14.1%',
      orderSplit: [7480, 1290, 3970],
      ticket: 195.1,
      ticketDelta: '3.7%',
      partySize: '3.5人',
      turnover: '3.4次',
      margin: 65.8,
      marginDelta: '1.9pt',
      periodMix: ['午市 37%', '晚市 55%', '宵夜 8%'],
      sparkline: [60, 65, 72, 71, 80, 86, 90, 95],
      trendLabels: ['9月', '10月', '11月(至今)'],
      trendRevenue: [748000, 873800, 864200],
      trendOrders: [3860, 4420, 4460],
      trendDineIn: [558000, 654000, 647310],
      trendDelivery: [190000, 219800, 216890],
      hourlyOccupancy: [23, 50, 87, 79, 34, 21, 29, 61, 91, 95, 69, 34],
      peakHour: '节假日 19:00'
    }
  };

  const CATEGORIES = [
    { name: '热炒招牌', share: 0.42, color: '#C83E37', margin: '64.2%' },
    { name: '烧腊卤味', share: 0.21, color: '#C8922D', margin: '67.5%' },
    { name: '老火汤煲', share: 0.14, color: '#2E7D6B', margin: '71.2%' },
    { name: '手工点心', share: 0.13, color: '#3B5B6D', margin: '69.0%' },
    { name: '茶饮酒水', share: 0.10, color: '#7D4E5D', margin: '78.8%' }
  ];

  const CHANNELS = [
    { name: '一楼散台堂食', share: 0.48, color: '#C83E37', note: '翻台率 3.8 次' },
    { name: '二楼雅间包厢', share: 0.28, color: '#C8922D', note: '桌均消费 ¥1,120' },
    { name: '美团 / 饿了么外卖', share: 0.17, color: '#3B5B6D', note: '准时率 99.2%' },
    { name: '小程序预约自提', share: 0.07, color: '#2E7D6B', note: '会员复购 44%' }
  ];

  const DISHES = [
    { id: 'd1', name: '金鼎片皮烤鸭', category: '烧腊', tag: '镇店招牌', price: 228, qty: 32, margin: 66.8, cost: 75.7, prepMin: 15, weekTrend: [25, 29, 36, 34, 27, 30, 32] },
    { id: 'd2', name: '古法黑松露红烧肉', category: '热炒', tag: '点击率Top1', price: 118, qty: 44, margin: 64.5, cost: 41.9, prepMin: 11, weekTrend: [35, 39, 48, 46, 37, 40, 44] },
    { id: 'd3', name: '金汤酸菜黑鱼片', category: '热炒', tag: '鲜香微辣', price: 108, qty: 41, margin: 66.2, cost: 36.5, prepMin: 12, weekTrend: [32, 36, 45, 43, 35, 38, 41] },
    { id: 'd4', name: '清蒸深海东星斑', category: '热炒', tag: '包厢必点', price: 298, qty: 12, margin: 56.8, cost: 128.7, prepMin: 17, weekTrend: [8, 11, 15, 14, 9, 10, 12] },
    { id: 'd5', name: '松茸老鸡功夫炖汤', category: '汤煲', tag: '温润滋补', price: 88, qty: 36, margin: 72.5, cost: 24.2, prepMin: 8, weekTrend: [28, 32, 39, 38, 30, 33, 36] },
    { id: 'd6', name: '黑金流沙虾饺皇', category: '点心', tag: '现包现蒸', price: 42, qty: 68, margin: 71.8, cost: 11.8, prepMin: 9, weekTrend: [52, 59, 73, 70, 56, 63, 68] },
    { id: 'd7', name: '蜜汁叉烧拼脆皮烧鹅', category: '烧腊', tag: '明档现斩', price: 108, qty: 26, margin: 63.4, cost: 39.5, prepMin: 7, weekTrend: [20, 23, 29, 28, 22, 24, 26] },
    { id: 'd8', name: '竹蔗茅根马蹄水 (扎)', category: '茶饮', tag: '现熬解腻', price: 52, qty: 45, margin: 81.0, cost: 9.9, prepMin: 4, weekTrend: [36, 40, 51, 48, 38, 42, 45] },
    { id: 'd9', name: '生拆蟹粉豆腐煲', category: '汤煲', tag: '时令主推', price: 98, qty: 22, margin: 65.0, cost: 34.3, prepMin: 11, weekTrend: [17, 19, 25, 24, 18, 20, 22] },
    { id: 'd10', name: '金丝脆皮萝卜丝酥', category: '点心', tag: '手工起酥', price: 36, qty: 54, margin: 74.2, cost: 9.3, prepMin: 9, weekTrend: [41, 46, 58, 56, 44, 49, 54] }
  ];

  const ORDERS = [
    { id: '#1125-164', area: 'vip', table: '二楼 · 牡丹厅', summary: '片皮烤鸭、清蒸东星斑等 7道', amount: 1426, channel: '微信支付', status: 'paid', time: '11:21', items: [['金鼎片皮烤鸭', 1, 228], ['清蒸深海东星斑', 1, 298], ['松茸老鸡功夫炖汤', 4, 352], ['古法黑松露红烧肉', 2, 236], ['生拆蟹粉豆腐煲', 2, 196], ['竹蔗茅根马蹄水', 1, 52], ['手工茶位费', 6, 64]] },
    { id: '#1125-163', area: 'hall', table: '一楼 · A08桌', summary: '金汤酸菜黑鱼片、虾饺皇等 4道', amount: 286, channel: '支付宝', status: 'cooking', time: '11:18', items: [['金汤酸菜黑鱼片', 1, 108], ['黑金流沙虾饺皇', 2, 84], ['金丝脆皮萝卜丝酥', 1, 36], ['竹蔗茅根马蹄水', 1, 52], ['五常米饭', 1, 6]] },
    { id: '#1125-162', area: 'online', table: '美团外卖 · #52', summary: '黑松露红烧肉、萝卜丝酥', amount: 162, channel: '美团外卖', status: 'delivery', time: '11:14', items: [['古法黑松露红烧肉', 1, 118], ['金丝脆皮萝卜丝酥', 1, 36], ['餐盒打包费', 1, 8]] },
    { id: '#1125-161', area: 'hall', table: '一楼 · B12桌', summary: '叉烧拼烧鹅、蟹粉豆腐煲', amount: 336, channel: '会员储值', status: 'paid', time: '11:05', items: [['蜜汁叉烧拼脆皮烧鹅', 1, 108], ['生拆蟹粉豆腐煲', 1, 98], ['松茸老鸡功夫炖汤', 1, 88], ['黑金流沙虾饺皇', 1, 42]] },
    { id: '#1125-160', area: 'online', table: '小程序自提 · #19', summary: '片皮烤鸭半套 + 虾饺皇', amount: 170, channel: '小程序', status: 'paid', time: '10:58', items: [['金鼎片皮烤鸭(半套)', 1, 128], ['黑金流沙虾饺皇', 1, 42]] },
    { id: '#1125-159', area: 'hall', table: '一楼 · C05桌', summary: '黑松露红烧肉、酸菜黑鱼片', amount: 366, channel: '微信支付', status: 'cooking', time: '10:51', items: [['古法黑松露红烧肉', 1, 118], ['金汤酸菜黑鱼片', 1, 108], ['松茸老鸡功夫炖汤', 1, 88], ['竹蔗茅根马蹄水', 1, 52]] },
    { id: '#1125-158', area: 'vip', table: '二楼 · 兰亭阁', summary: '片皮烤鸭、叉烧双拼等 6道', amount: 984, channel: '企业签单', status: 'paid', time: '10:40', items: [['金鼎片皮烤鸭', 1, 228], ['蜜汁叉烧拼脆皮烧鹅', 2, 216], ['清蒸深海东星斑', 1, 298], ['生拆蟹粉豆腐煲', 1, 98], ['黑金流沙虾饺皇', 2, 84], ['金丝脆皮萝卜丝酥', 1, 36], ['五常米饭', 4, 24]] },
    { id: '#1125-157', area: 'online', table: '饿了么 · #28', summary: '酸菜黑鱼片 + 马蹄水', amount: 164, channel: '饿了么', status: 'delivery', time: '10:32', items: [['金汤酸菜黑鱼片', 1, 108], ['竹蔗茅根马蹄水', 1, 52], ['餐盒打包费', 1, 4]] }
  ];

  window.RESTAURANT_DATA = {
    AREAS,
    RANGE_DATA,
    CATEGORIES,
    CHANNELS,
    DISHES,
    ORDERS
  };
})();
