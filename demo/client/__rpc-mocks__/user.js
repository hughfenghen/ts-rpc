class User {
  getInfoById (id) {
    return { id, age: 18 }
  }

  getUnreadMsg () {
    return {
      data: ['2'],
      data1: ['2'].concat(this._autoMockData_.data)
    }
  }
}

module.exports = {
  User
}
