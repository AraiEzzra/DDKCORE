import { Router } from 'express';
import accountController from '../controllers/accountsController';

const router: Router = Router();

router.get('/', accountController.getAccount);
router.post('/open', () => console.log('open'));
router.get('/getBalance', () => console.log('getBalance'));
router.get('/getPublicKey', () => console.log('getPublicKey'));
router.post('/generatePublicKey', () => console.log('generatePublicKey'));
router.get('/delegates', () => console.log('getDelegates'));
router.put('/delegates', () => console.log('addDelegates'));
router.get('/delegates/fee', () => console.log('getDelegatesFee'));
router.get('/count', () => console.log('totalAccounts'));
router.get('/getCirculatingSupply', () => console.log('getCirculatingSupply'));
router.get('/totalSupply', () => console.log('totalSupply'));
router.post('/migrateData', () => console.log('migrateData'));
router.post('/existingETPSUser/validate', () => console.log('validateExistingUser'));
router.post('/verifyUserToComment', () => console.log('verifyUserToComment'));
router.post('/senderBalance', () => console.log('senderAccountBalance'));
router.post('/getMigratedUsers', () => console.log('getMigratedUsersList'));
router.post('/getDashboardDDKData', () => console.log('getDashboardDDKData'));
router.post('/checkAccountExists', () => console.log('checkAccountExists'));

export default router;
