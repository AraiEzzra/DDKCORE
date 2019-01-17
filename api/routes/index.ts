import { Router } from 'express';
import * as HttpStatus from 'http-status-codes';

const router: Router = Router();
const accountsRouter: Router = Router();

accountsRouter.get('/accounts', (req, res) => {
    res.status(HttpStatus.OK).json({msg: 'Success'});
});

router.use('/api', accountsRouter);

export default router;
