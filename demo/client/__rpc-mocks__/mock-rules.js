const rpcMockRules = [
  // 固定返回值
  ['string', 'name', '张三'],
  // 头像
  ['string', 'avatar', '@image("100x100")'],
  // is 开头生成 布尔型
  ['boolean', /^is/, '@boolean'],
  // 分数或年龄，取值 0~100
  ['number', /score|age/, '@integer(0, 100)'],
  // 命名ip结尾，生成 ip
  ['string', /ip$/i, '@ip'],
  // 时间字符串
  ['string', /time$/i, '@datetime'],
  // 数字时间，时间戳
  ['number', /time$/i, () => Date.now()]
]

module.exports = {
  // rpcMockRules 命名不能修改
  rpcMockRules
}
