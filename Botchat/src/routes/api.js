import express from 'express';
let router = express.Router();
import APIController from '../controllers/APIController';

const initApiRoute = (app) => {
    router.get('/fonts', APIController.getALlFonts);
    router.get('/listfont', APIController.getListFont);
    router.get('/data', APIController.getData);
    return app.use('/api/v1/', router);
};
export default initApiRoute;
