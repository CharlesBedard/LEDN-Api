import express from 'express';
import { getUsers, postTransaction, postResetDb, postTransfer } from '../controllers';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger/swagger.json';

const jsonParser = bodyParser.json();
export const router = express.Router();
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

router.get('/users', getUsers);
router.post('/transactions', jsonParser, postTransaction);
router.post('/resetDb', postResetDb);
router.post('/transfers', jsonParser, postTransfer);
