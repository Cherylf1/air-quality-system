// 1. 初始化温州地图（替换原initZhejiangMap）
function initWenzhouMap() {
  // 创建ECharts实例（确保HTML中有id="map"的容器）
  const mapChart = echarts.init(document.getElementById('map'));

  // 加载温州区县GeoJSON
  $.get('data/wenzhou.json', function(geoJson) {
    echarts.registerMap('wenzhou', geoJson); // 注册温州地图

    // 2. 获取温州各区县多污染物数据（基于目标网页+摘要数据构造）
    fetchWenzhouPollutionData().then(pollutionData => {
      // 3. 配置ECharts选项（支持多污染物切换）
      const option = {
        // 标题（说明数据来源）
        
        // 图例（控制显示哪个污染物）
        legend: {
          data: ['PM2.5', 'PM10', 'NO2', 'SO2'],
          top: 30,
          left: 'left',
          selected: { 'PM2.5': true, 'PM10': false, 'NO2': false, 'SO2': false } // 默认显示PM2.5
        },
        // 提示框（hover显示所有4个指标）
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const areaData = pollutionData.find(item => item.name === params.name);
            return `
              <div style="font-size:14px">${params.name}</div>
              <div>PM2.5: ${areaData.pm25} μg/m³（${getAQILevel(areaData.pm25, 'pm25')}）</div>
              <div>PM10: ${areaData.pm10} μg/m³</div>
              <div>NO2: ${areaData.no2} μg/m³</div>
              <div>SO2: ${areaData.so2} μg/m³</div>
            `;
          }
        },
        // 视觉映射（按当前选中的污染物动态调整范围）
        visualMap: {
          type: 'piecewise',
          pieces: getVisualMapPieces('PM2.5'), // 默认PM2.5的数值分段
          inRange: { color: ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#99004c', '#7e0023'] },
          left: 'right',
          bottom: 50,
          calculable: true
        },
        // 地图系列（4个污染物各一个系列，通过legend控制显示）
        series: [
          // PM2.5系列
          {
            name: 'PM2.5',
            type: 'map',
            mapType: 'wenzhou',
            data: pollutionData.map(item => ({ name: item.name, value: item.pm25 })),
            label: { show: true, fontSize: 10 },
            emphasis: { label: { fontSize: 12 }, itemStyle: { areaColor: '#ffcc00' } }
          },
          // PM10系列（默认隐藏）
          {
            name: 'PM10',
            type: 'map',
            mapType: 'wenzhou',
            data: pollutionData.map(item => ({ name: item.name, value: item.pm10 })),
            label: { show: true, fontSize: 10 },
            emphasis: { label: { fontSize: 12 }, itemStyle: { areaColor: '#ffcc00' } },
            show: false // 默认不显示
          },
          // NO2系列（默认隐藏）
          {
            name: 'NO2',
            type: 'map',
            mapType: 'wenzhou',
            data: pollutionData.map(item => ({ name: item.name, value: item.no2 })),
            label: { show: true, fontSize: 10 },
            emphasis: { label: { fontSize: 12 }, itemStyle: { areaColor: '#ffcc00' } },
            show: false
          },
          // SO2系列（默认隐藏）
          {
            name: 'SO2',
            type: 'map',
            mapType: 'wenzhou',
            data: pollutionData.map(item => ({ name: item.name, value: item.so2 })),
            label: { show: true, fontSize: 10 },
            emphasis: { label: { fontSize: 12 }, itemStyle: { areaColor: '#ffcc00' } },
            show: false
          }
        ]
      };

      mapChart.setOption(option);

      // 4. 图例切换事件（点击切换显示的污染物，更新视觉映射）
      mapChart.on('legendselectchanged', function(params) {
        const selectedPollutant = params.name; // 当前选中的污染物（如PM10）
        // 1. 显示选中的系列，隐藏其他
        mapChart.setOption({
          series: [
            { name: 'PM2.5', show: selectedPollutant === 'PM2.5' },
            { name: 'PM10', show: selectedPollutant === 'PM10' },
            { name: 'NO2', show: selectedPollutant === 'NO2' },
            { name: 'SO2', show: selectedPollutant === 'SO2' }
          ],
          // 2. 更新视觉映射的数值分段（适配当前污染物）
          visualMap: { pieces: getVisualMapPieces(selectedPollutant) }
        });
      });

      // 5. 点击区县事件（左下角显示所有4个污染物数值）
      mapChart.on('click', function(params) {
        const areaData = pollutionData.find(item => item.name === params.name);
        if (!areaData) return;
        // 更新左下角容器（需确保HTML有id="pollution-status"）
        const statusEl = document.getElementById('pollution-status');
        statusEl.innerHTML = `
          <p><strong>当前区域：${areaData.name}</strong></p>
          <p>PM2.5：${areaData.pm25} μg/m³（${getAQILevel(areaData.pm25, 'pm25')}）</p>
          <p>PM10：${areaData.pm10} μg/m³</p>
          <p>NO2：${areaData.no2} μg/m³</p>
          <p>SO2：${areaData.so2} μg/m³</p>
        `;
      });
    });
  });

  // 窗口大小适配
  window.addEventListener('resize', () => mapChart.resize());
}

// 6. 构造温州各区县多污染物数据（基于目标网页+官方月报数据）
// 数据来源：目标网页（温州市市站=鹿城）、泰顺县月报（摘要3）、温州政府通报（摘要6）
function fetchWenzhouPollutionData() {
  // 模拟实时数据（后续可替换为API请求，需处理跨域）
  const wenzhouData = [
    { name: '鹿城区', pm25: 55, pm10: 20, no2: 6, so2: 2 },  // 目标网页：温州市市站
    { name: '龙湾区', pm25: 48, pm10: 18, no2: 5, so2: 2 },  // 参考市区均值
    { name: '瓯海区', pm25: 52, pm10: 19, no2: 7, so2: 2 },  // 参考市区均值
    { name: '永嘉县', pm25: 42, pm10: 16, no2: 4, so2: 1 },  // 瓯北站点（目标网页）
    { name: '瑞安市', pm25: 45, pm10: 17, no2: 5, so2: 1 },  // 参考温州南部均值
    { name: '乐清市', pm25: 40, pm10: 15, no2: 4, so2: 1 },  // 沿海区域偏低
    { name: '泰顺县', pm25: 21, pm10: 31, no2: 12, so2: 6 }, // 摘要3：2025年3月月报
    { name: '文成县', pm25: 22, pm10: 34, no2: 14, so2: 5 }, // 摘要3：文成数据
    { name: '平阳县', pm25: 38, pm10: 14, no2: 3, so2: 1 },  // 参考沿海均值
    { name: '苍南县', pm25: 35, pm10: 13, no2: 3, so2: 1 },  // 沿海区域偏低
    { name: '洞头区', pm25: 32, pm10: 12, no2: 2, so2: 1 },  // 海岛区域最优
    { name: '台州市', pm25: 48, pm10: 18, no2: 5, so2: 2 },  // 参考温州相邻区域
    { name: '丽水市', pm25: 30, pm10: 15, no2: 4, so2: 1 },  // 山区区域偏低
  ];
  return Promise.resolve(wenzhouData); // 模拟异步请求（后续可替换为API）
}

// 7. 辅助函数：获取各污染物的视觉映射分段（颜色匹配数值范围）
function getVisualMapPieces(pollutant) {
  const piecesMap = {
    'PM2.5': [ // 参考目标网页PM2.5范围（0-127）
      { min: 0, max: 50, label: '优', color: '#00e400' },
      { min: 51, max: 100, label: '良', color: '#ffff00' },
      { min: 101, max: 150, label: '轻度污染', color: '#ff7e00' },
      { min: 151, max: 200, label: '中度污染', color: '#ff0000' },
      { min: 201, max: 300, label: '重度污染', color: '#99004c' }
    ],
    'PM10': [ // 参考目标网页PM10范围（0-45）
      { min: 0, max: 50, label: '优', color: '#00e400' },
      { min: 51, max: 100, label: '良', color: '#ffff00' },
      { min: 101, max: 150, label: '轻度污染', color: '#ff7e00' }
    ],
    'NO2': [ // 参考目标网页NO2范围（0-15）
      { min: 0, max: 20, label: '优', color: '#00e400' },
      { min: 21, max: 40, label: '良', color: '#ffff00' },
      { min: 41, max: 50, label: '轻度污染', color: '#ff7e00' }
    ],
    'SO2': [ // 参考目标网页SO2范围（0-5）
      { min: 0, max: 10, label: '优', color: '#00e400' },
      { min: 11, max: 20, label: '良', color: '#ffff00' },
      { min: 21, max: 50, label: '轻度污染', color: '#ff7e00' }
    ]
  };
  return piecesMap[pollutant] || piecesMap['PM2.5'];
}

// 8. 辅助函数：PM2.5等级判断（参考目标网页标准）
function getAQILevel(value, type) {
  if (type !== 'pm25' || value === null) return '无数据';
  if (value <= 50) return '优';
  if (value <= 100) return '良';
  if (value <= 150) return '轻度污染';
  if (value <= 200) return '中度污染';
  if (value <= 300) return '重度污染';
  return '严重污染';
}

// 9. 页面加载初始化（替换原initZhejiangMap）
window.addEventListener('load', initWenzhouMap);