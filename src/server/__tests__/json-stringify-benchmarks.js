
function randInt (min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

function randStr () {
  return String(Math.random()).slice(2)
}

function createRandRespData () {
  return {
    code: randInt(0, 100),
    message: randStr(),
    data: {
      list: [{
      //  兑换id
        id: 0,
        // 商品名
        product_name: randStr(),
        // 数值配置id
        score_id: randInt(0, 10 ** 5),
        // 花费
        score: randInt(0, 100),
        // 兑换限制
        total_limit: randInt(0, 100),
        // 当前用户购买数量 (根据UserLimit的 date_type约束返回)
        buy_num: randInt(0, 100),
        //  开始时间
        start_time: randStr(),
        //  结束时间
        end_time: randStr(),
        // 商品图片url
        img_url: randStr(),
        // 奖励ids 打包id
        reward_detail: {
        // 1:奖励打包 2:商品系统id
          reward_type: randInt(0, 100),
          // 奖励ids
          reward_ids: [
            randInt(0, 100)
          ]
        }
      }]
    }
  }
}

// eslint-disable-next-line
const fastStrify = new Function('data', `
  return '{"code":' + data.code + ',"message":"' + data.message + '","data": {"list": [' + data.data.list.map(it => '{"id":' + it.id + ',"product_name": "' + it.product_name + '", "score_id":' + it.score_id + ',"score":' + it.score + ',"total_limit":' + it.total_limit + ',"buy_num":' + it.buy_num + ', "start_time": "' + it.start_time + '", "end_time": "' + it.end_time +'", "img_url": "' + it.img_url + '", "reward_detail": {"reward_type":' + it.reward_detail.reward_type + ', "reward_ids":[' + it.reward_detail.reward_ids.join(',') + ']}}') + '] }}'
`)

function benchmarkJSONStrify () {
  console.time('benchmarkJSONStrify')
  for (let i = 0; i < 10 ** 6; i++) {
    JSON.stringify(createRandRespData())
  }
  console.timeEnd('benchmarkJSONStrify')
}

function benchmarkFastStrify () {
  console.time('benchmarkFastStrify')
  for (let i = 0; i < 10 ** 6; i++) {
    fastStrify(createRandRespData())
  }
  console.timeEnd('benchmarkFastStrify')
}

benchmarkJSONStrify()
benchmarkFastStrify()
