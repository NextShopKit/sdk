// utils/log.ts

const isDev = process.env.NODE_ENV === "development";

export function log(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

export function debug(...args: any[]) {
  if (isDev) {
    console.debug(...args);
  }
}

export function info(...args: any[]) {
  if (isDev) {
    console.info(...args);
  }
}

export function warn(...args: any[]) {
  if (isDev) {
    console.warn(...args);
  }
}

export function error(...args: any[]) {
  if (isDev) {
    console.error(...args);
  }
}
