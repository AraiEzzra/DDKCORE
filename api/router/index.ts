import { Router } from 'express';
import accountRouter from './account';

const appRouter: Router = Router();

appRouter.use('/api', accountRouter);

export default appRouter;
