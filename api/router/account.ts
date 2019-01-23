import { Router } from 'express';
import AccountController from '../contoller/account';

const router: Router = Router();
const accountController = new AccountController();

router.get('/', accountController.getAccount);
router.post('/open', accountController.createAccount);
router.get('/getBalance', accountController.getBalance);
router.get('/getPublicKey', accountController.getPublicKey);
router.post('/generatePublicKey', accountController.generatePublicKey);
router.get('/delegates', accountController.getDelegates);
router.put('/delegates', accountController.addDelegates);
router.get('/delegates/fee', accountController.getDelegatesFee);
router.get('/count', accountController.getTotalAccounts);
router.get('/getCirculatingSupply', accountController.getCirculatingSupply);
router.get('/totalSupply', accountController.getTotalSupply);
router.post('/migrateData', accountController.migrateData);
router.post('/existingETPSUser/validate', accountController.validateExistingUser);
router.post('/verifyUserToComment', accountController.verifyUserToComment);
router.post('/senderBalance', accountController.checkSenderAccountBalance);
router.post('/getMigratedUsers', accountController.getMigratedUsersList);
router.post('/getDashboardDDKData', accountController.getDashboardDDKData);
router.post('/checkAccountExists', accountController.checkAccountExists);

export default router;
