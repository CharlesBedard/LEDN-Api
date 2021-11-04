import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { getAccount, postTransaction, postResetDb, postTransfer } from '../controllers';
import swaggerDocument from '../swagger/swagger.json';

const jsonParser = bodyParser.json();
export const router = express.Router();
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

router.get('/accounts', getAccount);
router.post('/transactions', jsonParser, postTransaction);
router.post('/resetDb', postResetDb);
router.post('/transfers', jsonParser, postTransfer);
