import fs from 'fs';
import path from 'path';

const enabled = process.env.ENABLE_FILE_LOGS === 'true';

export interface LogEntry {
  ts: string;
  direction: 'in' | 'out';
  sessionId?: string;
  text?: string;
  meta?: Record<string, unknown>;
}

export function logMessage(entry: Omit<LogEntry, 'ts'>): void {
  if (!enabled) return;

  try {
    const logPath = path.join(process.cwd(), 'data', 'logs.json');
    const logDir = path.dirname(logPath);
    
    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Read existing logs or create empty array
    let logs: LogEntry[] = [];
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      logs = JSON.parse(content);
    }

    // Add new entry
    logs.push({
      ts: new Date().toISOString(),
      ...entry,
    });

    // Write back
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (error) {
    // Fail silently in production
    console.error('Failed to write log:', error);
  }
}


