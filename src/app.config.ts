export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/fueling/index',
    'pages/daily/index',
    'pages/exception/index',
    'pages/report/index',
    'pages/fueling-add/index',
    'pages/daily-detail/index',
    'pages/exception-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0066CC',
    navigationBarTitleText: '船舶燃油记录',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0066CC',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '航次首页'
      },
      {
        pagePath: 'pages/fueling/index',
        text: '加油记录'
      },
      {
        pagePath: 'pages/daily/index',
        text: '日耗填报'
      },
      {
        pagePath: 'pages/exception/index',
        text: '异常说明'
      },
      {
        pagePath: 'pages/report/index',
        text: '统计报表'
      }
    ]
  }
})
