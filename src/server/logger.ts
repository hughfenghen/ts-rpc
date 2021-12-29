export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

let printLv = LogLevel.Warn
export const logger = {
  debug,
  info,
  warn,
  error,
  setPrintLv (lv: LogLevel) {
    printLv = lv
  }
}

function _log (content: any, level: LogLevel): void {
  if (level >= printLv) {
    const method = LogLevel[level].toLowerCase() as 'debug' | 'info' | 'warn' | 'error'

    console[method](`[ts-brpc] ${String(content)}`)
  }
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
