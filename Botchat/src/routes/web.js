import express from 'express';
import { mn } from 'translate-google/languages';
import homeController from '../controllers/HomeController';

let router = express.Router();

let initWebRoutes = (app) => {
    router.get('/', homeController.checkAuth, homeController.getHomePage);
    router.get('/setup-profile', homeController.checkAuth, homeController.setupProfile);
    router.get('/setup-persistent-menu', homeController.checkAuth, homeController.setupPersistentMenu);
    router.post('/webhook', homeController.postWebhook);
    router.get('/webhook', homeController.getWebhook);
    router.get('/database', homeController.updateMySQL);
    router.get('/excel', homeController.checkAuth, homeController.getGoogleSheet);
    router.get('/crawler', homeController.getCrawler);
    router.get('/select', homeController.select);
    router.get('/spam', homeController.checkAuth, homeController.getAnimal);
    router.post('/send-message', homeController.checkAuth, homeController.postAnimal);
    router.post('/get-user', homeController.checkAuth, homeController.postUser);
    router.get('/send', homeController.checkAuth, homeController.sendTeamplate);
    router.get('/test', homeController.test);
    router.get('/login', homeController.checkLoginAuth, homeController.getLogin);
    router.get('/add-config', homeController.checkAuth, homeController.addConfig);
    router.post('/check-login', homeController.checkLoginAuth, homeController.checkLogin);
    router.get('/check-login', (req, res, next) => {
        return res.redirect('/login');
    });
    return app.use('/', router);
};

module.exports = initWebRoutes;
