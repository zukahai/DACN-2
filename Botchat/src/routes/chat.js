import express from 'express';
let router = express.Router();
import ChatController from '../controllers/ChatController';

const initChatRoute = (app) => {
    router.post('/', ChatController.Chat);
    router.get('/Chat', ChatController.getChat);
    return app.use('/chat', router);
};
export default initChatRoute;
