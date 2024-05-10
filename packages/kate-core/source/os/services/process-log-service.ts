/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { LogLevel, ProcessLog, ProcessLogEntry, ProcessLogStore, os_entry } from "../../data";
import { Database } from "../../db-schema";
import { defer, mb, serialise } from "../../utils";

type SaveRequest = {
  logs: ProcessLog;
  timer: any;
};

type LogBuffer = {
  process_id: string;
} & ProcessLogEntry;

const bare_console_log = console.log;

export class KateProcessLogService {
  readonly ROTATE_SIZE = mb(32);
  readonly ROTATE_LENGTH = 2048;
  readonly FLUSH_DELAY = 1000 * 30;
  private open_logs = new Map<string, Promise<ProcessLog>>();
  private save_requests = new Map<string, SaveRequest>();
  private buffered: LogBuffer[] = [];
  private db: Database | null = null;
  private _started = false;

  constructor() {}

  setup() {
    if (this._started) {
      throw new Error(`[kate:process-log] already started: ${this._started}`);
    }

    this._started = true;
    this.proxy_console();
    this.proxy_unhandled_errors();
  }

  async set_database(db: Database) {
    if (this.db != null || !this._started) {
      throw new Error(`[kate:process-log] set_database() called with wrong state`);
    }
    this.db = db;
    let buffer = this.buffered;
    for (const entry of buffer) {
      await this.do_log(entry.process_id, entry);
    }
  }

  private proxy_console() {
    const log = console.log;
    const debug = console.debug;
    const info = console.info;
    const warn = console.warn;
    const error = console.error;
    const trace = console.trace;

    console.log = (...args) => {
      this.log("kate", "info", args);
      log.call(console, ...args);
    };
    console.debug = (...args) => {
      this.log("kate", "debug", args);
      debug.call(console, ...args);
    };
    console.info = (...args) => {
      this.log("kate", "info", args);
      info.call(console, ...args);
    };
    console.warn = (...args) => {
      this.log("kate", "warn", args);
      warn.call(console, ...args);
    };
    console.error = (...args) => {
      this.log("kate", "error", args);
      error.call(console, ...args);
    };
    console.trace = (...args) => {
      this.log("kate", "trace", [...args, `\n\n${new Error("At").stack ?? ""}`]);
      trace.call(console, ...args);
    };
  }

  private proxy_unhandled_errors() {
    window.addEventListener("unhandledrejection", (ev) => {
      this.log("kate", "error", [`Unhandled promise rejection: `, ev.reason]);
    });
    window.addEventListener("error", (ev) => {
      this.log("kate", "error", [
        `Unhandled error at ${ev.filename}:${ev.lineno}:${ev.colno}:\n\n${ev.message}`,
        ev.error,
      ]);
    });
  }

  async log(process_id: string, level: LogLevel, args: any[]) {
    const entry = { time: new Date(), level, message: serialise(args) };
    if (this.db == null) {
      this.buffered.push({ process_id, ...entry });
      return;
    }
    await this.do_log(process_id, entry);
  }

  private async do_log(process_id: string, entry: ProcessLogEntry) {
    const logs = await this.open(process_id);
    logs.entries.push({
      time: entry.time,
      level: entry.level,
      message: entry.message,
    });
    logs.size += entry.message.length;
    logs.last_update = entry.time;
    while (
      logs.entries.length > 0 &&
      (logs.size > this.ROTATE_SIZE || logs.entries.length > this.ROTATE_LENGTH)
    ) {
      const removed = logs.entries.pop()!;
      logs.size -= removed.message.length;
    }
    this.schedule_save(logs);
  }

  private async schedule_save(logs: ProcessLog) {
    const previous_schedule = this.save_requests.get(logs.process_id) ?? null;
    if (previous_schedule != null) {
      clearTimeout(previous_schedule.timer);
    }
    this.save_requests.set(logs.process_id, {
      logs,
      timer: setTimeout(() => {
        this.flush_one(logs);
      }, this.FLUSH_DELAY),
    });
  }

  private async flush_one(logs: ProcessLog) {
    if (this.db == null) {
      throw new Error(`[kate:process-log] flush_one() called without a database`);
    }
    await ProcessLogStore.transaction(this.db, "readwrite", (s) => s.write_logs(logs));
    bare_console_log.call(console, `[kate:process-log] flushed ${logs.process_id}`);
  }

  async flush() {
    for (const request of this.save_requests.values()) {
      clearTimeout(request.timer);
      await this.flush_one(request.logs);
    }
  }

  async open(process_id: string) {
    if (this.db == null) {
      throw new Error(`[kate:process-log] open() called without a database`);
    }

    const open_log = this.open_logs.get(process_id);
    if (open_log != null) {
      return open_log;
    }

    const log_promise = defer<ProcessLog>();
    this.open_logs.set(process_id, log_promise.promise);

    const logs = await ProcessLogStore.transaction(this.db, "readonly", (s) =>
      s.read_logs(process_id)
    );
    log_promise.resolve(logs);
    return logs;
  }

  async list_processes() {
    if (this.db == null) {
      throw new Error(`[kate:process-log] open() called without a database`);
    }
    await this.flush();
    return await ProcessLogStore.transaction(this.db, "readonly", (s) => s.list_processes());
  }
}
