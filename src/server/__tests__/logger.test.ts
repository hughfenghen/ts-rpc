import { logger, LogLevel } from '../logger'

console.debug = jest.fn()
console.info = jest.fn()
console.warn = jest.fn()
console.error = jest.fn()

test('logger', () => {
  logger.setPrintLv(LogLevel.Info)
  logger.debug('a')
  logger.info('b')
  logger.warn('c')
  logger.error('d')

  expect(console.debug).not.toHaveBeenCalled()
  expect(console.info).toHaveBeenCalled()
  expect(console.warn).toHaveBeenCalled()
  expect(console.error).toHaveBeenCalled()
})
