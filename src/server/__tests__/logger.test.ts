import { logger } from '../logger'

console.debug = jest.fn()
console.info = jest.fn()
console.warn = jest.fn()
console.error = jest.fn()

test('logger', () => {
  const spyWatcher = jest.fn()
  logger.watch(spyWatcher)

  logger.debug('a')
  logger.info('b')
  logger.warn('c')
  logger.error('d')

  expect(spyWatcher).toHaveBeenCalledTimes(4)
})
