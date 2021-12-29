export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

type TWatcher = (logItem: {log: string, lv: LogLevel}) => void
/**
 * 存储日志变化监听器
 */
const _watchers = new Set<TWatcher>()

export const logger = {
  LogLevel,
  debug,
  info,
  warn,
  error,
  watch (fn: TWatcher): () => void {
    _watchers.add(fn)
    return () => {
      _watchers.delete(fn)
    }
  }
}

function _log (content: any, level: LogLevel): void {
  _watchers.forEach(watcher => watcher({
    lv: level,
    log: `[ts-brpc] ${String(content)}`
  }))
}

function debug (content: any): void {
  _log(content, LogLevel.Debug)
}

function info (content: any): void {
  _log(content, LogLevel.Info)
}

function warn (content: any): void {
  _log(content, LogLevel.Warn)
}

function error (content: any): void {
  console.error(content)
  _log(content, LogLevel.Error)
}
