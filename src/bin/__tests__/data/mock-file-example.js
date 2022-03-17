module.exports.User = class {
  getInfoById (id) {
    console.log(`mock-file-simple.js User.getInfoById(${id})`)
    return { id }
  }
}
