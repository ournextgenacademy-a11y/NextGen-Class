import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../src/server/app';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
