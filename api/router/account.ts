import { Router } from 'express';
import accountController from '../controller/account';

const router: Router = Router();

router.get('/', accountController.getAccount);
router.post('/login', accountController.login);
router.post('/register', accountController.register);
router.get('/getBalance', accountController.getBalance);
router.get('/getPublicKey', accountController.getPublicKey);
router.post('/generatePublicKey', accountController.generatePublicKey);
router.get('/delegates', accountController.getDelegates);
router.put('/delegates', accountController.addDelegates);
router.get('/delegates/fee', accountController.getDelegatesFee);
router.get('/count', accountController.getTotalAccounts);
router.get('/getCirculatingSupply', accountController.getCirculatingSupply);
router.get('/totalSupply', accountController.getTotalSupply);
router.post('/senderBalance', accountController.checkSenderAccountBalance);
router.post('/getDashboardDDKData', accountController.getDashboardDDKData);
router.post('/checkAccountExists', accountController.checkAccountExistence);

export default router;
