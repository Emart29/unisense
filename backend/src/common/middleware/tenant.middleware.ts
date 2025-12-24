import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithTenant extends Request {
  universityId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, res: Response, next: NextFunction) {
    // Extract university_id from authenticated user (set by JWT strategy)
    if (req.user && (req.user as any).universityId) {
      req.universityId = (req.user as any).universityId;
    }
    next();
  }
}
