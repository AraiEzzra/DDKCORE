import { Router } from 'express';
import accountRouter from './accountsRouter';

const appRouter: Router = Router();

appRouter.use('/api', accountRouter);

export default appRouter;
