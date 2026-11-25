(() => {
  'use strict';

  const dataSource = window.RESTAURANT_DATA;
  if (!dataSource) {
    throw new Error('未找到 window.RESTAURANT_DATA，请先在 index.html 中引入 data.js');
  }

  const { AREAS, RANGE_DATA, CATEGORIES, CHANNELS, DISHES, ORDERS } = dataSource;

  const state = {
    range: 'today',
    area: 'all',
    trendMode: 'revenue',
    dishCat: 'all',
    dishSort: 'revenue',
    orderStatus: 'all',
    orderQuery: '',
    hoveredCatIndex: null,
    liveJitter: 1
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const formatMoney = (num) => '¥ ' + Math.round(num).toLocaleString('zh-CN');
  const formatNum = (num) => Math.round(num).toLocaleString('zh-CN');

  /**
   * 按当前时间周期与用餐区域聚合分析经营指标
   */
  function analyzeMetrics() {
    const base = RANGE_DATA[state.range];
    const area = AREAS[state.area];
    const factor = area.scale * state.liveJitter;
    const revenue = Math.round(base.revenue * factor);
    const target = Math.round(base.target * area.scale);
    const orders = Math.max(1, Math.round(base.orders * factor));
    const split = base.orderSplit.map((v) => Math.round(v * factor));
    const ticket = revenue / orders;

    return {
      ...base,
      areaName: area.name,
      areaSubtitle: area.subtitle,
      occupancy: area.occupancy,
      waitTables: area.waitTables,
      revenue,
      target,
      orders,
      split,
      ticket,
      trendRevenue: base.trendRevenue.map((v) => Math.round(v * factor)),
      trendOrders: base.trendOrders.map((v) => Math.max(1, Math.round(v * factor))),
      trendDineIn: base.trendDineIn.map((v) => Math.round(v * factor)),
      trendDelivery: base.trendDelivery.map((v) => Math.round(v * factor))
    };
  }

  function renderKpis(m) {
    $('#headerContextText').textContent = `${m.label} · ${m.areaSubtitle}`;
    $('#kpiRevenue').textContent = formatMoney(m.revenue);
    $('#kpiRevDelta').textContent = `↑ ${m.revDelta}`;

    const pct = Math.min(100, (m.revenue / m.target) * 100);
    $('#kpiTargetLabel').textContent = `目标达成率 ${pct.toFixed(1)}%`;
    $('#kpiTargetValue').textContent = `目标 ${formatMoney(m.target)}`;
    $('#kpiTargetBar').style.width = `${pct.toFixed(1)}%`;

    $('#kpiOrders').innerHTML = `${formatNum(m.orders)} <small>单</small>`;
    $('#kpiOrderDelta').textContent = `↑ ${m.orderDelta}`;
    $('#kpiOrderSplit').textContent = `散台 ${m.split[0]} · 包厢 ${m.split[1]} · 外卖/自提 ${m.split[2]}`;

    const sparkMax = Math.max(...m.sparkline);
    $('#ordersSparkline').innerHTML = m.sparkline
      .map((v) => `<div class="spark-bar" style="height:${Math.max(18, (v / sparkMax) * 100)}%"></div>`)
      .join('');

    $('#kpiTicket').textContent = `¥ ${m.ticket.toFixed(1)}`;
    $('#kpiTicketDelta').textContent = `↑ ${m.ticketDelta}`;
    $('#kpiPartySize').textContent = m.partySize;
    $('#kpiTurnover').textContent = m.turnover;
    $('#diningPeriodMix').innerHTML = m.periodMix.map((t) => `<span>${t}</span>`).join('');

    $('#kpiMargin').textContent = `${m.margin.toFixed(1)}%`;
    $('#kpiMarginDelta').textContent = `↑ ${m.marginDelta}`;
    $('#kpiMarginBar').style.width = `${m.margin}%`;
  }

  /**
   * 渲染 SVG 营收趋势与客流双系列组合图
   */
  function renderTrendChart(m) {
    const svg = $('#trendChartSvg');
    const tooltip = $('#trendTooltip');
    const W = 760;
    const H = 268;
    const pad = { top: 20, right: 44, bottom: 32, left: 54 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const labels = m.trendLabels;
    const n = labels.length;
    const isRevMode = state.trendMode === 'revenue';
    const s1 = isRevMode ? m.trendRevenue : m.trendDineIn;
    const s2 = isRevMode ? m.trendOrders : m.trendDelivery;

    $('#trendSubtitle').textContent = isRevMode
      ? `${m.label} · 营收金额与订单量联动走势`
      : `${m.label} · 堂食与外卖营收结构对比`;

    $('#trendLegend').innerHTML = isRevMode
      ? `<span class="legend-item"><i class="swatch vermilion"></i>总营收 (元)</span>
         <span class="legend-item"><i class="swatch gold"></i>有效订单 (单)</span>`
      : `<span class="legend-item"><i class="swatch vermilion"></i>堂食营收 (元)</span>
         <span class="legend-item"><i class="swatch jade"></i>外卖及自提 (元)</span>`;

    const max1 = Math.max(...s1, 1) * 1.16;
    const max2 = isRevMode ? Math.max(...s2, 1) * 1.25 : max1;

    const xAt = (i) => (n === 1 ? pad.left + plotW / 2 : pad.left + (i / (n - 1)) * plotW);
    const y1At = (v) => pad.top + plotH - (v / max1) * plotH;
    const y2At = (v) => pad.top + plotH - (v / max2) * plotH;

    let html = `
      <defs>
        <linearGradient id="vermilionArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#C83E37" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#C83E37" stop-opacity="0.01" />
        </linearGradient>
      </defs>
    `;

    for (let t = 0; t <= 4; t++) {
      const y = pad.top + (t / 4) * plotH;
      const val = Math.round(max1 * (1 - t / 4));
      const formatted = val >= 10000 ? `${(val / 10000).toFixed(1)}w` : val.toLocaleString('zh-CN');
      html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#EFE8DC" stroke-dasharray="${t === 4 ? '0' : '4 4'}" />`;
      html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#978D83">${formatted}</text>`;
    }

    const barW = Math.min(24, Math.max(10, (plotW / Math.max(n, 1)) * 0.34));
    s2.forEach((v, i) => {
      const cx = xAt(i);
      const y = y2At(v);
      const bh = Math.max(2, pad.top + plotH - y);
      const fill = isRevMode ? 'rgba(200, 146, 45, 0.36)' : 'rgba(46, 125, 107, 0.34)';
      const stroke = isRevMode ? '#C8922D' : '#2E7D6B';
      html += `<rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="${fill}" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1" />`;
    });

    const pts = s1.map((v, i) => [xAt(i), y1At(v)]);
    let lineD = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const mx = (x0 + x1) / 2;
      lineD += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    const areaD = `${lineD} L ${pts[pts.length - 1][0]} ${pad.top + plotH} L ${pts[0][0]} ${pad.top + plotH} Z`;

    html += `<path d="${areaD}" fill="url(#vermilionArea)" />`;
    html += `<path d="${lineD}" fill="none" stroke="#C83E37" stroke-width="2.6" stroke-linecap="round" />`;

    labels.forEach((lbl, i) => {
      const [cx, cy] = pts[i];
      html += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#8D8379">${lbl}</text>`;
      html += `<circle cx="${cx}" cy="${cy}" r="4.2" fill="#FFFFFF" stroke="#C83E37" stroke-width="2.2" />`;
      const hitW = plotW / Math.max(n, 1);
      html += `<rect class="chart-hit" data-idx="${i}" x="${cx - hitW / 2}" y="${pad.top}" width="${hitW}" height="${plotH}" fill="transparent" style="cursor:crosshair" />`;
    });

    svg.innerHTML = html;

    svg.querySelectorAll('.chart-hit').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const idx = Number(el.dataset.idx);
        const cx = xAt(idx);
        const cy = y1At(s1[idx]);
        tooltip.innerHTML = isRevMode
          ? `<strong>${labels[idx]}</strong><br/>营收：${formatMoney(s1[idx])}<br/>订单：${s2[idx]} 单`
          : `<strong>${labels[idx]}</strong><br/>堂食：${formatMoney(s1[idx])}<br/>外卖/自提：${formatMoney(s2[idx])}`;
        tooltip.style.left = `${(cx / W) * 100}%`;
        tooltip.style.top = `${Math.max(18, (cy / H) * 100)}%`;
        tooltip.hidden = false;
      });
      el.addEventListener('mouseleave', () => {
        tooltip.hidden = true;
      });
    });
  }

  /**
   * 渲染菜系品类占比 SVG 环形图
   */
  function renderCategoryDonut(m) {
    const svg = $('#categoryDonutSvg');
    const list = $('#categoryList');
    const r = 78;
    const C = 2 * Math.PI * r;

    let offset = 0;
    let svgHtml = `<circle cx="110" cy="110" r="${r}" fill="none" stroke="#F1ECE4" stroke-width="26" />`;

    const items = CATEGORIES.map((c) => ({ ...c, revenue: Math.round(m.revenue * c.share) }));

    items.forEach((cat, idx) => {
      const segLen = cat.share * C;
      const isActive = state.hoveredCatIndex === idx;
      const opacity = state.hoveredCatIndex === null || isActive ? 1 : 0.42;
      svgHtml += `
        <circle class="donut-segment" data-cat-idx="${idx}" cx="110" cy="110" r="${r}"
          fill="none" stroke="${cat.color}" stroke-width="${isActive ? 30 : 25}"
          stroke-dasharray="${Math.max(0, segLen - 3)} ${C}"
          stroke-dashoffset="${-offset}" opacity="${opacity}" />
      `;
      offset += segLen;
    });

    svg.innerHTML = svgHtml;

    const activeCat = state.hoveredCatIndex !== null ? items[state.hoveredCatIndex] : null;
    $('#donutCenterLabel').textContent = activeCat ? activeCat.name : '全品类营收';
    $('#donutCenterValue').textContent = formatMoney(activeCat ? activeCat.revenue : m.revenue);
    $('#donutCenterSub').textContent = activeCat
      ? `占比 ${(activeCat.share * 100).toFixed(0)}% · 毛利 ${activeCat.margin}`
      : '100.0%';

    list.innerHTML = items.map((cat, idx) => `
      <li class="category-row ${state.hoveredCatIndex === idx ? 'active' : ''}" data-cat-idx="${idx}">
        <span class="cat-dot" style="background:${cat.color}"></span>
        <span class="cat-name">${cat.name}</span>
        <span class="cat-share">${(cat.share * 100).toFixed(0)}%</span>
        <span class="cat-rev">${formatMoney(cat.revenue)}</span>
      </li>
    `).join('');

    const bindHover = (sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener('mouseenter', () => {
          state.hoveredCatIndex = Number(el.dataset.catIdx);
          renderCategoryDonut(analyzeMetrics());
        });
        el.addEventListener('mouseleave', () => {
          state.hoveredCatIndex = null;
          renderCategoryDonut(analyzeMetrics());
        });
      });
    };
    bindHover('.donut-segment');
    bindHover('.category-row');
  }

  /**
   * 渲染分时段上座率柱状图
   */
  function renderHourlyChart(m) {
    const hours = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
    $('#peakHourTag').textContent = `峰值 ${m.peakHour}`;
    $('#currentOccupancy').textContent = `${m.occupancy}%`;
    $('#waitingTables').textContent = `${m.waitTables} 桌`;

    $('#hourlyChart').innerHTML = m.hourlyOccupancy.map((pct, i) => {
      const cls = pct >= 85 ? 'peak' : pct >= 55 ? 'warm' : '';
      return `
        <div class="hour-col" title="${hours[i]}:00 上座率 ${pct}%">
          <div class="hour-bar-wrap">
            <div class="hour-bar ${cls}" style="height:${Math.max(12, pct)}%"></div>
          </div>
          <span class="hour-label">${hours[i]}时</span>
        </div>
      `;
    }).join('');
  }

  /**
   * 渲染消费渠道占比条形图
   */
  function renderChannels(m) {
    $('#channelBars').innerHTML = CHANNELS.map((ch) => {
      const rev = Math.round(m.revenue * ch.share);
      const pct = Math.round(ch.share * 100);
      return `
        <div class="channel-item">
          <div class="channel-row-top">
            <span class="channel-name">${ch.name}</span>
            <span class="channel-val"><strong>${formatMoney(rev)}</strong>(${pct}% · ${ch.note})</span>
          </div>
          <div class="channel-track">
            <div class="channel-fill" style="width:${pct}%; background:${ch.color}"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDishesTable() {
    const areaScale = AREAS[state.area].scale;
    const rangeScale = state.range === 'today' ? 1 : state.range === 'week' ? 6.8 : state.range === 'month' ? 27 : 76;

    const rows = DISHES
      .filter((d) => state.dishCat === 'all' || d.category === state.dishCat)
      .map((d) => {
        const qty = Math.max(1, Math.round(d.qty * areaScale * rangeScale * state.liveJitter));
        return { ...d, scaledQty: qty, scaledRevenue: qty * d.price };
      })
      .sort((a, b) => {
        if (state.dishSort === 'qty') return b.scaledQty - a.scaledQty;
        if (state.dishSort === 'margin') return b.margin - a.margin;
        return b.scaledRevenue - a.scaledRevenue;
      });

    const tbody = $('#dishesTbody');
    tbody.innerHTML = rows.map((d, idx) => `
      <tr data-dish-id="${d.id}">
        <td><span class="rank-pill ${idx < 3 ? `rank-${idx + 1}` : ''}">${idx + 1}</span></td>
        <td>
          <div class="dish-cell">
            <span class="dish-name">${d.name}</span>
            <span class="dish-sub"><span class="dish-tag">${d.tag}</span>${d.category}</span>
          </div>
        </td>
        <td class="num">¥${d.price}</td>
        <td class="num">${formatNum(d.scaledQty)}</td>
        <td class="num"><strong>${formatMoney(d.scaledRevenue)}</strong></td>
        <td class="num">${d.margin.toFixed(1)}%</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const dish = rows.find((item) => item.id === tr.dataset.dishId);
        if (dish) openDishDrawer(dish);
      });
    });
  }

  function renderOrdersTable() {
    const q = state.orderQuery.trim().toLowerCase();
    const filtered = ORDERS.filter((o) => {
      const matchArea = state.area === 'all' || o.area === state.area;
      const matchStatus = state.orderStatus === 'all' || o.status === state.orderStatus;
      const matchQuery = !q || o.id.toLowerCase().includes(q) || o.table.toLowerCase().includes(q) || o.summary.toLowerCase().includes(q);
      return matchArea && matchStatus && matchQuery;
    });

    const statusLabel = {
      paid: { text: '已结账', cls: 'status-paid' },
      cooking: { text: '备菜中', cls: 'status-cooking' },
      delivery: { text: '配送中', cls: 'status-delivery' }
    };

    const tbody = $('#ordersTbody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">暂无匹配的订单记录</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((o) => {
      const st = statusLabel[o.status];
      return `
        <tr data-order-id="${o.id}">
          <td>
            <div class="order-id">${o.id}</div>
            <div class="order-table-sub">${o.table} · ${o.time}</div>
          </td>
          <td>${o.summary}</td>
          <td class="num"><strong>${formatMoney(o.amount)}</strong></td>
          <td>${o.channel}</td>
          <td><span class="status-pill ${st.cls}">${st.text}</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const order = ORDERS.find((o) => o.id === tr.dataset.orderId);
        if (order) openOrderDrawer(order);
      });
    });
  }

  function openDishDrawer(dish) {
    $('#drawerEyebrow').textContent = `${dish.category} · ${dish.tag}`;
    $('#drawerTitle').textContent = dish.name;
    const maxTrend = Math.max(...dish.weekTrend);
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];

    $('#drawerBody').innerHTML = `
      <div class="drawer-stat-grid">
        <div class="drawer-stat"><span>当前周期销售额</span><strong>${formatMoney(dish.scaledRevenue)}</strong></div>
        <div class="drawer-stat"><span>累计销量</span><strong>${formatNum(dish.scaledQty)} 份</strong></div>
        <div class="drawer-stat"><span>售价 / 单份食材成本</span><strong>¥${dish.price} / ¥${dish.cost}</strong></div>
        <div class="drawer-stat"><span>毛利率 / 平均出品时长</span><strong>${dish.margin}% · ${dish.prepMin}分钟</strong></div>
      </div>
      <div>
        <div class="drawer-section-title">近 7 日销量走势 (份)</div>
        <div class="hourly-chart" style="grid-template-columns: repeat(7, 1fr); height: 130px;">
          ${dish.weekTrend.map((v, idx) => `
            <div class="hour-col" title="${days[idx]}: ${v}份">
              <div class="hour-bar-wrap">
                <div class="hour-bar ${idx === 6 ? 'peak' : 'warm'}" style="height:${Math.round((v / maxTrend) * 100)}%"></div>
              </div>
              <span class="hour-label">${days[idx]}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="alert-row">
        <span>运营建议：与「${dish.category === '茶饮' ? '热炒招牌菜' : '竹蔗茅根马蹄水'}」组合套餐可进一步提升客单价</span>
      </div>
    `;
    showDrawer();
  }

  function openOrderDrawer(order) {
    const statusMap = { paid: '已结账', cooking: '后厨备菜中', delivery: '骑手配送中' };
    $('#drawerEyebrow').textContent = `聚福楼 · ${order.time}`;
    $('#drawerTitle').textContent = `账单明细 ${order.id}`;

    $('#drawerBody').innerHTML = `
      <div class="drawer-stat-grid">
        <div class="drawer-stat"><span>桌台 / 来源</span><strong>${order.table}</strong></div>
        <div class="drawer-stat"><span>结算方式 / 状态</span><strong>${order.channel} · ${statusMap[order.status]}</strong></div>
      </div>
      <div>
        <div class="drawer-section-title">点单小票明细</div>
        <ul class="receipt-list">
          ${order.items.map(([name, qty, sub]) => `
            <li><span>${name} × ${qty}</span><span>${formatMoney(sub)}</span></li>
          `).join('')}
          <li class="receipt-total"><span>实付合计</span><span>${formatMoney(order.amount)}</span></li>
        </ul>
      </div>
    `;
    showDrawer();
  }

  function showDrawer() {
    $('#detailBackdrop').hidden = false;
    $('#detailDrawer').classList.add('open');
    $('#detailDrawer').setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    $('#detailBackdrop').hidden = true;
    $('#detailDrawer').classList.remove('open');
    $('#detailDrawer').setAttribute('aria-hidden', 'true');
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = $('#toastEl');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }

  function exportCsvReport() {
    const m = analyzeMetrics();
    const lines = [
      ['餐厅名称', '聚福楼'],
      ['统计周期', m.label],
      ['区域范围', m.areaName],
      ['总营业额(元)', m.revenue],
      ['有效订单数(单)', m.orders],
      ['客单价(元)', m.ticket.toFixed(1)],
      ['综合毛利率(%)', m.margin.toFixed(1)],
      [],
      ['菜系品类', '营收占比', '估算营收(元)', '参考毛利率'],
      ...CATEGORIES.map((c) => [c.name, `${(c.share * 100).toFixed(0)}%`, Math.round(m.revenue * c.share), c.margin])
    ];
    const csv = '\uFEFF' + lines.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `聚福楼销售报表_${state.range}_${state.area}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已导出「${m.areaName} · ${m.label}」销售报表`);
  }

  function renderAll() {
    const m = analyzeMetrics();
    renderKpis(m);
    renderTrendChart(m);
    renderCategoryDonut(m);
    renderHourlyChart(m);
    renderChannels(m);
    renderDishesTable();
    renderOrdersTable();
  }

  function bindEvents() {
    $$('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.seg-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.range = btn.dataset.range;
        renderAll();
      });
    });

    $('#areaSelect').addEventListener('change', (e) => {
      state.area = e.target.value;
      renderAll();
    });

    $$('.mini-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.mini-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.trendMode = btn.dataset.trendMode;
        renderTrendChart(analyzeMetrics());
      });
    });

    $$('#dishCategoryChips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('#dishCategoryChips .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.dishCat = chip.dataset.cat;
        renderDishesTable();
      });
    });

    $('#dishSortSelect').addEventListener('change', (e) => {
      state.dishSort = e.target.value;
      renderDishesTable();
    });

    $$('#orderStatusChips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('#orderStatusChips .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.orderStatus = chip.dataset.status;
        renderOrdersTable();
      });
    });

    $('#orderSearchInput').addEventListener('input', (e) => {
      state.orderQuery = e.target.value;
      renderOrdersTable();
    });

    $('#refreshBtn').addEventListener('click', () => {
      state.liveJitter = 0.99 + Math.random() * 0.03;
      renderAll();
      showToast('已同步门店收银 POS 与外卖平台最新数据');
    });

    $('#exportCsvBtn').addEventListener('click', exportCsvReport);
    $('#closeDrawerBtn').addEventListener('click', closeDrawer);
    $('#detailBackdrop').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  bindEvents();
  renderAll();
})();
