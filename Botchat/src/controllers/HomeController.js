require('dotenv').config();
const jwt = require('jsonwebtoken');
////////////////

import chatbotService from '../services/chatbotService';
import fontService from '../services/fontService';
import dataService from '../services/dataService';
import listFontService from '../services/listFontService';
import configService from '../services/configService';
import banService from '../services/banService';
import foodService from '../services/foodService';

///////////////
// import pool from '../configs/connectDB';
import axios from 'axios';
import db from '../models/index';
import request from 'request';
import cheerio from 'cheerio';
var mysql = require('mysql2');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const translate = require('translate-google');
const PRIVATE_KEY =
    '';
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const SHEET_ID = process.env.SHEET_ID;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const LIMIT = process.env.LIMIT;
const privateKey = process.env.PRIVATE_KEY;
//process.env.NAME_VARIABLES
let getHomePage = (req, res) => {
    return res.render('homepage.ejs');
};

let postWebhook = async (req, res) => {
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Gửi từ PSID: ' + sender_psid);
            console.log(webhook_event.message);
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

// Handles messages events
async function handleMessage(sender_psid, received_message) {
    let username = await chatbotService.getUserName(sender_psid);
    let response;
    let hours = chatbotService.getHours();
    let check = await configService.findConfigByName('Ban');

    if (hours >= 0 && hours <= 5 && sender_psid !== '3171579152927680' && check.status === '1') {
        let reason = 'Nhắn tin sai thời gian cho phép';
        let dataBan = {
            psid: sender_psid,
            reason: reason,
            name: username,
        };
        let banResult = await banService.insertBan(dataBan);
        response = {
            text: `Chào ${username} hiện tại bạn đã bị cấm\nLý do: ${reason}\nNếu bạn có thắc mắc hoặc muốn unban thì liên hệ với\nm.me/nam077.me\nPSID: ${sender_psid}`,
        };
        await chatbotService.callSendAPI(sender_psid, response);
        return;
    }
    let ban = await banService.findBanByPSID(sender_psid);
    if (ban) {
        response = {
            text: `Chào ${username} hiện tại bạn đã bị cấm\nLý do: ${ban.reason}\nNếu bạn có thắc mắc hoặc muốn unban thì liên hệ với\nm.me/nam077.me\nPSID: ${sender_psid}`,
        };
        await chatbotService.callSendAPI(sender_psid, response);
        return;
    }
    // Checks if the message contains text
    else if (received_message.quick_reply && received_message.quick_reply.payload) {
        if (received_message.quick_reply.payload === 'BOT_TUTORIAL') {
            let response3 = chatbotService.getVideoTutorial();
            await chatbotService.callSendAPI(sender_psid, response3);
            response = {
                text: 'Vui lòng gửi tên font bạn cần tìm vào đây\nNếu không có bot sẽ không phản hồi!',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            let response2 = {
                text: "Nếu bạn muốn nhận hướng dẫn đầy đủ vui lòng gửi lại tin nhắn 'HDSD'",
            };
            await chatbotService.callSendAPI(sender_psid, response2);
            return;
        }
        if (received_message.quick_reply.payload === 'PRICE_SERVICE') {
            response = { text: 'Giá là 50.000 đồng một font nhé.' };
            await chatbotService.callSendAPI(sender_psid, response);
            let response2a = {
                text: 'Nếu bạn muốn sử dụng thì vui lòng liên hệ qua m.me/nam077.me',
            };
            await chatbotService.callSendAPI(sender_psid, response2a);
            return;
        }
        if (received_message.quick_reply.payload === 'BOT_BUY') {
            response = {
                text: 'Hiện tại bên mình đang bán bộ tổng hợp font NVN với giá 1 font = 1000đ\nHiện tại đang có tổng cộng hơn 500 font',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            response = {
                text: 'Nếu bạn muốn mua thì vui lòng nhắn tin qua Admin để được hỗ trợ nhanh nhất',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            response = {
                text: 'https://www.facebook.com/Nam077.me',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            return;
        }
        if (received_message.quick_reply.payload === 'LIST_FONT') {
            await chatbotService.getFontSupport(sender_psid);
            let response2 = {
                text: 'Nếu bạn muốn lấy link nào thì nhắn tin tên một font trong list này\nHệ thống sẽ gửi cho bạn',
            };
            await chatbotService.callSendAPI(sender_psid, response2);
            return;
        }
        return;
    }
    if (received_message.text) {
        let font = await fontService.getAllFont();
        let data = await dataService.getAllData();
        let arr2 = data.map(({ key }) => key);
        let message = received_message.text;
        message = message.toLowerCase();
        let listKey = font.map(({ key }) => key);
        let fontAll = [];
        for (let item of listKey) {
            if (message.indexOf(item) !== -1) {
                let fontCurrent = font.find((fontCurrent) => fontCurrent.key === item);
                fontAll.push(fontCurrent);
            }
        }
        let keydata = chatbotService.checkKey(arr2, message);
        fontAll = fontAll.reduce((acc, current) => {
            const x = acc.find((item) => item.key === current.key);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        if (fontAll.length !== 0) {
            await chatbotService.checkFont(sender_psid, fontAll);
            return;
        } else if (message.indexOf('bắt đầu') !== -1 || message.indexOf('start') !== -1) {
            await chatbotService.handleGetStarted(sender_psid);
            return;
        } else if (null != keydata) {
            await chatbotService.sendTextMessage(sender_psid, keydata);
            return;
        } else if (message.indexOf('@nvn ban') !== -1 || message.indexOf('@nvn unban') !== -1) {
            if (sender_psid === '3171579152927680') {
                await chatbotService.AcountService(sender_psid, message);
                return;
            }
        } else if (message.indexOf('@nvn fonts') !== -1) {
            if (sender_psid === '3171579152927680') {
                await chatbotService.fontEvent(sender_psid, message);
                return;
            }
        } else if (message.indexOf('@nvn block') !== -1) {
            if (sender_psid === '3171579152927680') {
                await chatbotService.Block(sender_psid, message);
                return;
            }
        } else if (message.indexOf('ăn gì') !== -1) {
            await chatbotService.eatFood(sender_psid);
            return;
        } else if (message.toLowerCase().indexOf('xổ số') !== -1 || message.toLowerCase().indexOf('xo so') !== -1) {
            await chatbotService.getLuckyNumber(sender_psid);
            return;
        } else if (
            message.toLowerCase().indexOf('covid') !== -1 ||
            message.toLowerCase().indexOf('corona') !== -1 ||
            message.toLowerCase().indexOf('cov') !== -1
        ) {
            await chatbotService.getCovidApi(sender_psid, message);
            return;
        } else if (message.indexOf('mấy giờ') !== -1 || message.indexOf('giờ giấc') !== -1) {
            let msg = chatbotService.getTimeVietNam();
            let response = { text: `Bây giờ là ${msg} ` };
            await chatbotService.callSendAPI(sender_psid, response);
            let msgtime = chatbotService.checktime(username);
            let response2 = { text: msgtime };
            await chatbotService.callSendAPI(sender_psid, response2);
            return;
        } else if (message.indexOf('danh sách font') !== -1 || message.indexOf('list font') !== -1) {
            await chatbotService.getFontSupport(sender_psid);
            let response2 = {
                text: 'Nếu bạn muốn lấy link nào thì nhắn tin tên một font trong list này\nHệ thống sẽ gửi cho bạn',
            };
            await chatbotService.callSendAPI(sender_psid, response2);
            return;
        } else {
            await chatbotService.getGooleSearch(sender_psid, received_message.text);
            return;
        }
    }
    // } else if (received_message.attachments) {
    //     // Get the URL of the message attachment
    //     let attachment_url = received_message.attachments[0].payload.url;
    //     response = {
    //         attachment: {
    //             type: "template",
    //             payload: {
    //                 template_type: "generic",
    //                 elements: [{
    //                     title: "Bạn chắc chắc đây là ảnh của bạn chứ",
    //                     subtitle: "Nhấn vào nút để trả lời",
    //                     image_url: attachment_url,
    //                     buttons: [{
    //                         type: "postback",
    //                         title: "Đúng!",
    //                         payload: "yes",
    //                     },
    //                         {
    //                             type: "postback",
    //                             title: "Không phải!",
    //                             payload: "no",
    //                         },
    //                     ],
    //                 },],
    //             },
    //         },
    //     };
    //     await chatbotService.callSendAPI(sender_psid, response);
    // }

    // Send the response message
}

// Handles messaging_postbacks events
async function handlePostback(sender_psid, received_postback) {
    let username = await chatbotService.getUserName(sender_psid);
    let response;
    let hours = chatbotService.getHours();
    let check = await configService.findConfigByName('Ban');

    if (hours >= 0 && hours <= 5 && sender_psid !== '3171579152927680' && check.status === '1') {
        let reason = 'Nhắn tin sai thời gian cho phép';
        let dataBan = {
            psid: sender_psid,
            reason: reason,
            name: username,
        };
        let banResult = await banService.insertBan(dataBan);
        response = {
            text: `Chào ${username} hiện tại bạn đã bị cấm\nLý do: ${reason}\nNếu bạn có thắc mắc hoặc muốn unban thì liên hệ với\nm.me/nam077.me\nPSID: ${sender_psid}`,
        };
        await chatbotService.callSendAPI(sender_psid, response);
        return;
    }
    let ban = await banService.findBanByPSID(sender_psid);
    if (ban) {
        response = {
            text: `Chào ${username} hiện tại bạn đã bị cấm\nLý do: ${ban.reason}\nNếu bạn có thắc mắc hoặc muốn unban thì liên hệ với\nm.me/nam077.me\nPSID: ${sender_psid}`,
        };
        await chatbotService.callSendAPI(sender_psid, response);
        return;
    }
    // Get the payload for the postback
    let payload = received_postback.payload;

    switch (payload) {
        case 'yes':
            response = { text: 'Hỏi vậy chứ không có gì :vv' };
            await chatbotService.callSendAPI(sender_psid, response);
            break;
        case 'no':
            response = { text: 'Kaka Kệ' };
            await chatbotService.callSendAPI(sender_psid, response);
            break;
        case 'BOT_BUY':
            response = {
                text: 'Hiện tại bên mình đang bán bộ tổng hợp font NVN với giá 1 font = 1000đ\nHiện tại đang có tổng cộng hơn 500 font',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            response = {
                text: 'Nếu bạn muốn mua thì vui lòng nhắn tin qua Admin để được hỗ trợ nhanh nhất',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            response = {
                text: 'https://www.facebook.com/Nam077.me',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            break;
        case 'BOT_TUTORIAL':
            let response3 = chatbotService.getVideoTutorial();
            await chatbotService.callSendAPI(sender_psid, response3);
            response = {
                text: 'Vui lòng gửi tên font bạn cần tìm vào đây\nNếu không có bot sẽ không phản hồi!',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            let response2 = {
                text: "Nếu bạn muốn nhận hướng dẫn đầy đủ vui lòng gửi lại tin nhắn 'HDSD'",
            };
            await chatbotService.callSendAPI(sender_psid, response2);
            break;
        case 'LIST_FONT':
            await chatbotService.getFontSupport(sender_psid);
            let responseaa = {
                text: 'Nếu bạn muốn lấy link nào thì nhắn tin tên một font trong list này\nHệ thống sẽ gửi cho bạn',
            };
            await chatbotService.callSendAPI(sender_psid, responseaa);
            break;
        case 'PRICE_SERVICE':
            response = {
                text: 'Hiện tại bên mình nhận việt hóa với giá 50.000 đồng một font.',
            };
            await chatbotService.callSendAPI(sender_psid, response);
            let response2a = {
                text: 'Nếu bạn muốn sử dụng thì vui lòng liên hệ qua m.me/nam077.me',
            };
            await chatbotService.callSendAPI(sender_psid, response2a);
            break;
        case 'GET_STARTED_PAYLOAD':
        case 'RESTART_BOT':
            await chatbotService.handleGetStarted(sender_psid);
            break;

        default:
            response = { text: 'Xin lỗi tôi không hiểu' };
            await chatbotService.callSendAPI(sender_psid, response);
    }
    // Send the message to acknowledge the postback
}

// Sends response messages via the Send API

let setupProfile = async (req, res) => {
    //call profile facebook api
    // Construct the message body
    let request_body = {
        get_started: {
            payload: 'GET_STARTED_PAYLOAD',
        },
        whitelisted_domains: ['https://chatbot-nvn.herokuapp.com/'],
    };
    //
    // Send the HTTP request to the Messenger Platform
    await request(
        {
            uri: `https://graph.facebook.com/v12.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
            qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: request_body,
        },
        (err, res, body) => {
            if (!err) {
                console.log('Cấu hình Profile thành công');
            } else {
                console.error('Unable Setup user profile:' + err);
            }
        },
    );

    return res.redirect('/');
};
let setupPersistentMenu = async (req, res) => {
    //call profile facebook api
    // Construct the message body
    let request_body = {
        persistent_menu: [
            {
                locale: 'default',
                composer_input_disabled: false,
                call_to_actions: [
                    {
                        type: 'postback',
                        title: 'Mua tổng hợp của NVN',
                        payload: 'BOT_BUY',
                    },
                    {
                        type: 'web_url',
                        title: 'Xem Trang',
                        url: 'https://www.facebook.com/NVNFONT/',
                        webview_height_ratio: 'full',
                    },
                    {
                        type: 'web_url',
                        title: 'Tham gia group',
                        url: 'https://www.facebook.com/groups/NVNFONT/',
                        webview_height_ratio: 'full',
                    },
                    {
                        type: 'postback',
                        title: 'Xem hướng dẫn sử dụng bot',
                        payload: 'BOT_TUTORIAL',
                    },
                    {
                        type: 'postback',
                        title: 'Danh sách font hỗ trợ',
                        payload: 'LIST_FONT',
                    },
                    {
                        type: 'postback',
                        title: 'Xem giá Việt hóa',
                        payload: 'PRICE_SERVICE',
                    },
                    {
                        type: 'postback',
                        title: 'Khởi động lại bot',
                        payload: 'RESTART_BOT',
                    },
                ],
            },
        ],
    };
    //
    // Send the HTTP request to the Messenger Platform
    await request(
        {
            uri: `https://graph.facebook.com/v12.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
            qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: request_body,
        },
        (err, res, body) => {
            if (!err) {
                console.log('Setup user profile succes');
            } else {
                console.error('Unable Setup user profile:' + err);
            }
        },
    );

    return res.redirect('/');
};
let getGoogleSheet = async (req, res) => {
    try {
        await fontService.deleteAllFont();
        await dataService.deleteAllData();
        await listFontService.deleteAllListFont();
        await foodService.deleteAllFood();
        // await pool.execute('DELETE FROM `nvnfont`');
        // await pool.execute('DELETE FROM `data`');
        // await pool.execute('DELETE FROM `listfont`');
        // await pool.execute('ALTER TABLE `nvnfont` AUTO_INCREMENT = 1;');
        // await pool.execute('ALTER TABLE `data` AUTO_INCREMENT = 1;');
        // await pool.execute('ALTER TABLE `listfont` AUTO_INCREMENT = 1;');
        // Initialize the sheet - doc ID is the long id in the sheets URL
        const doc = new GoogleSpreadsheet(SHEET_ID);

        // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        await doc.useServiceAccountAuth({
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
        });
        await doc.loadInfo(); // loads document properties and worksheets
        const sheet = doc.sheetsByIndex[0];
        const sheet2 = doc.sheetsByIndex[1];
        const sheet3 = doc.sheetsByIndex[2];
        const rows2 = await sheet2.getRows();
        const rows3 = await sheet3.getRows();
        const imageF = [];
        const nameF = []; // or
        const descriptionF = [];
        const recipeF = []; // or
        // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
        const name = [];
        const key = [];
        const linkdownload = [];
        const linkimage = [];
        const msg = [];
        const img = [];
        const respone = [];
        const keylist = [];
        const rows = await sheet.getRows();
        for (const element of rows) {
            name.push(element.Name);
            key.push(element.Key.toLowerCase());
            linkdownload.push(element.Link);
            linkimage.push(element.Image);
            msg.push(element.Message);
        }
        for (const element of rows3) {
            nameF.push(element.Name);
            imageF.push(element.Image);
            descriptionF.push(element.Description);
            recipeF.push(element.Recipe);
        }
        for (const element of rows2) {
            keylist.push(element.Key.toLowerCase());
            respone.push(element.Respone);
            img.push(element.Image);
        }
        var objectFont = [];
        for (let i = 0; i < key.length; i++) {
            let listkeyfont = [];
            listkeyfont = key[i].split(',');
            for (let j = 0; j < listkeyfont.length; j++) {
                let singlekey = listkeyfont[j].trim();
                if (singlekey != null && singlekey != '') {
                    var singleObj = {};
                    singleObj['name'] = name[i];
                    singleObj['key'] = singlekey;
                    singleObj['link'] = linkdownload[i];
                    singleObj['image'] = linkimage[i];
                    singleObj['message'] = msg[i];
                    objectFont.push(singleObj);
                }
            }
        }
        var objectFood = [];
        for (let i = 0; i < nameF.length; i++) {
            var singleObj = {};
            singleObj['name'] = nameF[i];
            singleObj['image'] = imageF[i];
            singleObj['description'] = descriptionF[i];
            singleObj['recipe'] = recipeF[i];
            objectFood.push(singleObj);
        }

        let objectData = [];
        for (let i = 0; i < keylist.length; i++) {
            let listKey = [];
            listKey = keylist[i].split(',');
            for (let j = 0; j < listKey.length; j++) {
                let singlekey = listKey[j].trim();
                if (singlekey != null && singlekey != '') {
                    var singleObj = {};
                    singleObj['key'] = singlekey;
                    singleObj['respone'] = respone[i];
                    if (img[i] != null && img[i] != '') {
                        singleObj['image'] = img[i];
                    } else {
                        singleObj['image'] = '';
                    }
                    objectData.push(singleObj);
                }
            }
        }
        const data = JSON.stringify(objectFont);
        const data2 = JSON.stringify(objectData);
        // var file = fs.createWriteStream('font.json');
        // try {
        //     fs.writeFileSync('font.json', data);
        //     console.log('Lưu danh sách font thành công !');
        // } catch (error) {
        //     console.error(err);
        // }
        // var file2 = fs.createWriteStream('data.json');
        // try {
        //     fs.writeFileSync('data.json', data2);
        //     console.log('Lưu dữ liệu thành công !');
        // } catch (error) {
        //     console.error(err);
        // }
        let s = objectFont;
        let listData = [];
        let objectListFont = [];
        let data_temp = [];
        let limit = LIMIT;
        let page = Math.ceil(s.length / limit);
        for (let i = 0; i < page; i++) {
            data_temp[i] = [];
            for (let j = i * limit; j < (i + 1) * limit && j < s.length; j++) {
                data_temp[i].push(s[j].name);
            }
            listData[i] = data_temp[i].join('\n\n');
            let obj = {};
            obj.list = listData[i];
            objectListFont.push(obj);
        }

        // var file3 = fs.createWriteStream('listfont.json');
        // try {
        //     fs.writeFileSync('listfont.json', data3);
        //     console.log('Lưu danh sách font hỗ trợ thành công!');
        // } catch (error) {
        //     console.error(err);
        // }

        // con.connect(function (err) {
        //     if (err) throw err;
        //     //Make SQL statement:
        //     let sql = 'INSERT INTO nvnfont (`name`, `key`, `link`,`image`,`message`) VALUES ?';
        //     let sql2 = 'INSERT INTO data (`key`, `respone`,`image`) VALUES ?';
        //     let sql3 = 'INSERT INTO listfont (`list`) VALUES ?';
        //     //Make an array of values:
        //     //Execute the SQL statement, with the value array:
        //     con.query(sql, [FontResult], function (err, result) {
        //         if (err) throw err;
        //         console.log('Lưu danh sách font thành công: ' + result.affectedRows);
        //         return;
        //         console.log(result);
        //     });

        //     con.query(sql2, [listDataResult], function (err, result) {
        //         if (err) console.log(err);
        //         console.log('Lưu dữ liệu thành công: ' + result.affectedRows);
        //         return;
        //     });
        //     con.query(sql3, [listFontResult], function (err, result) {
        //         if (err) throw err;
        //         console.log('Lưu danh sách font hỗ trợ thành công: ' + result.affectedRows);
        //         return;
        //     });
        // });
        let fontResult = await fontService.insertMultiFont(objectFont);
        let dataResult = await dataService.insertMultiData(objectData);
        let listFont = await listFontService.insertMultiListFont(objectListFont);
        let FoodResult = await foodService.insertMultiFood(objectFood);
        return res.redirect('/');
    } catch (e) {
        console.log(e);
        return res.send('Oops! Something wrongs, check logs console for detail ... ');
    }
};
let updateMySQL = (req, res) => {
    let host = process.env.HOSTDATABASE;
    let user = process.env.USERDATABASE;
    let password = process.env.PASSDATABASE;
    let database = process.env.NAMEDATABASE;
    var con = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: database,
    });
    let config = require('../../font.json');
    let objectFont = config;
    var FontResult = [];
    for (var i = 0; i < objectFont.length; i++) {
        FontResult.push(Object.keys(objectFont[i]).map((key) => objectFont[i][key]));
    }
    let config2 = require('../../data.json');
    let objectData = config2;
    var listDataResult = [];
    for (var i = 0; i < objectData.length; i++) {
        listDataResult.push(Object.keys(objectData[i]).map((key) => objectData[i][key]));
    }
    let config3 = require('../../listfont.json');
    let objectListFont = config3;
    let listFontResult = [];
    for (let i = 0; i < objectListFont.length; i++) {
        listFontResult.push(Object.keys(objectListFont[i]).map((key) => objectListFont[i][key]));
    }
    con.connect(function (err) {
        if (err) throw err;
        //Make SQL statement:
        let sql = 'INSERT INTO nvnfont (`name`, `key`, `link`,`image`,`message`) VALUES ?';
        let sql2 = 'INSERT INTO data (`key`, `respone`,`image`) VALUES ?';
        let sql3 = 'INSERT INTO listfont (`list`) VALUES ?';
        //Make an array of values:
        //Execute the SQL statement, with the value array:
        con.query(sql, [FontResult], function (err, result) {
            if (err) throw err;
            console.log('Lưu danh sách font thành công: ' + result.affectedRows);
            return;
            console.log(result);
        });

        con.query(sql2, [listDataResult], function (err, result) {
            if (err) console.log(err);
            console.log('Lưu dữ liệu thành công: ' + result.affectedRows);
            return;
        });
        con.query(sql3, [listFontResult], function (err, result) {
            if (err) throw err;
            console.log('Lưu danh sách font hỗ trợ thành công: ' + result.affectedRows);
            return;
        });
    });
    return res.redirect('/');
};
let getCrawler = async (req, res) => {
    try {
        let message = 'Đội hình clb MU';

        let checkmsg = message.replaceAll(' ', '').toLowerCase();
        if (checkmsg.indexOf('cov') === -1 && checkmsg.indexOf('corona') === -1) {
            let searchString = message;
            let encodedString = encodeURI(searchString);
            encodedString = encodedString.replaceAll('+', '%2B');
            const AXIOS_OPTIONS = {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57',
                },
            };
            const { data } = await axios.get(`https://monngonmoingay.com/tim-kiem-mon-ngon/`, AXIOS_OPTIONS);
            let $ = cheerio.load(data);
            let information = $(data).find('info-list');
            information.forEach((element) => {
                console.log(element.text());
            });
            console.log(information);
            return res.send();
        }
    } catch (error) {
        console.log(error);
    }
};
let select = async (req, res) => {
    const AXIOS_OPTIONS = {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57',
        },
    };
    axios
        .get('http://chatbot-nvn.herokuapp.com/api/v1/fonts', AXIOS_OPTIONS)
        .then((response) => {
            res.render('font', { dataFont: response.data.font });
        })
        .catch((error) => {
            console.log(error);
        });
};
let getAnimal = async (req, res) => {
    res.render('spam');
};
let postAnimal = async (req, res) => {
    console.log(req.body);
    let sender_psid = req.body.sender_psid;
    let data_message = req.body.data_message;

    let username = await chatbotService.getUserName(sender_psid);
    let notify = {};
    notify['error'] = 'No Sender';
    if (username != 'undefined') {
        notify['user_name'] = username;
        notify['error'] = 'success';
        if (data_message != null && data_message != '') {
            if (req.body.data_multi === 'true') {
                let arr = data_message.split('\n');
                arr.forEach((element) => {
                    let response = { text: `${username} ${element}` };
                    chatbotService.callSendAPI(sender_psid, response);
                });
                return res.status(200).json({
                    message: 'success',
                    data: notify,
                });
            } else if (req.body.data_multi === 'false') {
                console.log(req.body.data_message);
                for (let i = 0; i < process.env.SPAM; i++) {
                    let response = { text: `${username} ${req.body.data_message}` };
                    chatbotService.callSendAPI(sender_psid, response);
                }
                notify['send'] = 'done';
                return res.status(200).json({
                    message: 'success',
                    data: notify,
                });
            }
        } else {
            let readFile = new Promise((resolve, reject) => {
                fs.readFile('animals.txt', 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    let arr = data.split('\n');
                    resolve(arr);
                });
            });
            readFile
                .then(function (arr) {
                    arr.forEach((element) => {
                        let response = { text: `${username} ${element}` };
                        chatbotService.callSendAPI(sender_psid, response);
                    });
                    notify['send'] = 'done';
                })
                .then(function () {
                    return res.status(200).json({
                        message: 'success',
                        data: notify,
                    });
                });
        }
    } else {
        return res.status(200).json({
            message: 'success',
            data: notify,
        });
    }
};
let sendTeamplate = async (req, res) => {
    let response2 = {
        text: 'Hiện tại bên mình nhận việt hóa với giá 50.000 đồng một font.',
    };
    let sender_psid = 3171579152927680;
    let response = {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: [
                    {
                        title: 'Headphones',
                        image_url: 'https://bit.ly/imageHeadphones',
                        subtitle: 'Bose Noise Cancelling Wireless Bluetooth Headphones',
                        default_action: {
                            type: 'web_url',
                            url: 'https://bit.ly/webHeadphones',
                            webview_height_ratio: 'tall',
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                url: 'https://bit.ly/webHeadphones',
                                title: 'View on Website',
                            },
                            {
                                type: 'postback',
                                title: 'Show Headphones',
                                payload: 'SHOW_HEADPHONES',
                            },
                        ],
                    },
                    {
                        title: 'TV',
                        image_url: 'https://bit.ly/imageTV',
                        subtitle: 'Master of quality & Incredible clarity',
                        default_action: {
                            type: 'web_url',
                            url: 'https://bit.ly/webTelevision',
                            webview_height_ratio: 'tall',
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                url: 'https://bit.ly/webTelevision',
                                title: 'View on Website',
                            },
                            {
                                type: 'postback',
                                title: 'Show TVs',
                                payload: 'SHOW_TV',
                            },
                        ],
                    },
                    {
                        title: 'Playstation',
                        image_url: 'https://bit.ly/imagePlaystation',
                        subtitle: 'Incredible games & Endless entertainment',
                        default_action: {
                            type: 'web_url',
                            url: 'https://bit.ly/webPlaystation',
                            webview_height_ratio: 'tall',
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                url: 'https://bit.ly/webPlaystation',
                                title: 'View on Website',
                            },
                            {
                                type: 'postback',
                                title: 'Show Playstation',
                                payload: 'SHOW_PLAYSTATION',
                            },
                        ],
                    },
                ],
            },
        },
    };
    chatbotService.callSendAPI(sender_psid, response2);
};
let postUser = async (req, res) => {
    let getUserInfor = new Promise((resolve, reject) => {
        request(
            {
                uri: `https://graph.facebook.com/${req.body.sender_psid}?fields=id,first_name,last_name,name,profile_pic&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
                qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
                method: 'GET',
            },
            (err, res, body) => {
                if (!err) {
                    body = JSON.parse(body);
                    resolve(body);
                } else {
                    reject(err);
                }
            },
        );
    });
    getUserInfor.then(function (body) {
        console.log(body);
        let username = body.name;
        if (username != 'undefined') {
            return res.status(200).json({
                message: 'success',
                data: body,
            });
        } else {
            return res.status(200).json({
                message: 'error',
                data: '',
            });
        }
    });
};
let test = async (req, res) => {
    let insert = [
        {
            name: 'Gà Ủ Muối Hoa Tiêu',
            image: 'https://cdn.tgdd.vn/2021/07/CookProduct/Gaumuoi1200-1200x676.jpg',
            description:
                'GÀ ĐỒI Ủ MUỐI HOA TIÊU Gà ta xịn, thịt chắc, da giòn thơm ngon được hấp muối thực phẩm làm chín sẵn, tẩm ướp gia vị rất thơm và ngon được làm sạch sẽ hút chân không + Không ngán như gà rán  Không nhạt như gà luộc + Không mất sức mất công + Không vặt lông cắt tiết',
            recipe: 'Bạn mua gà ta được làm sẵn ở chợ hoặc siêu thị, về rửa lại với nước sạch, chà 1 ít muối để khử mùi tanh và rửa sạch lại nước, để ráo nguyên con (đã được lấy ra hết bộ lòng).',
            id: 1,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
        {
            name: 'Cơm Rang',
            image: 'https://www.knorr.com/content/dam/unilever/knorr_world/vietnam/general_image/savoury/other_savoury/teaser_meo_rang_com-1187779.jpg',
            description:
                'Những bữa cơm ấm cúng bên gia đình luôn là niềm khao khát của nhiều người. Nhưng món cơm rang cũng thú vị không kém đó nhé. Khi cơm nguội từ hôm trước còn lại thì món cơm rang bữa sáng lại trở lên “hot hòn họt”. Cùng code4func làm món cơm rang ngon tuyệt vô cùng đơn giản. Tận dụng cơm nguội tối hôm trước để làm một món ăn hấp dẫn với 3 cách làm cơm rang này nhé.',
            recipe: 'Cơm để rang phải không quá khô hoặc quá ẩm. Nếu dùng cơm mới nấu để rang thì bạn cần để cơm trong nhiệt độ thường ít nhất là 6 tiếng cho cơm nguội và khô bớt. Còn nếu dùng cơm nguội để rang thì bạn có thể đặt thố cơm vào trong tủ lạnh khoảng 2 giờ để giảm lượng nước có trong cơm. Sau đó đánh tơi cơm ra, không để cơm bị dính ướt làm ảnh hưởng đến hương vị của món cơm rang.',
            id: 2,
            createAt: '05/30/2022 15:57:39',
            updateAt: '05/30/2022 15:57:39',
        },
    ];
    let data = await foodService.randomFood();
    // let hehe = await dataService.insertMultiFont(fonts);

    return res.status(200).json(data);
};
let getLogin = (req, res) => {
    return res.render('login.ejs');
};
let checkAuth = (req, res, next) => {
    let auth = req.cookies.auth;
    if (auth) {
        try {
            var result = jwt.verify(auth, privateKey);
            if (result) {
                if (result.id === '0337994575') {
                    next();
                }
            } else return res.redirect('/login');
        } catch (err) {
            return res.redirect('/login');
        }
    } else {
        return res.redirect('/login');
    }
};
let checkLogin = (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        if (username === 'nam077' && password === 'nam077') {
            let id = '0337994575';
            let obj = { id: id };
            let result = jwt.sign(obj, privateKey);

            res.cookie('auth', result);
            return res.redirect('/');
        } else return res.redirect('/login');
    } else {
        return res.redirect('/login');
    }
};
let checkLoginAuth = (req, res, next) => {
    let auth = req.cookies.auth;
    if (auth) {
        try {
            var result = jwt.verify(auth, privateKey);
            if (result) {
                if (result.id === '0337994575') {
                    return res.redirect('/');
                }
            } else next();
        } catch (err) {
            next();
        }
    } else {
        next();
    }
};
let addConfig = async (req, res, next) => {
    await configService.initConfig();
    return res.redirect('/');
};
module.exports = {
    getHomePage: getHomePage,
    postWebhook: postWebhook,
    getWebhook: getWebhook,
    setupProfile: setupProfile,
    setupPersistentMenu: setupPersistentMenu,
    getGoogleSheet: getGoogleSheet,
    updateMySQL: updateMySQL,
    getCrawler: getCrawler,
    select: select,
    getAnimal: getAnimal,
    postAnimal: postAnimal,
    postUser: postUser,
    sendTeamplate: sendTeamplate,
    test: test,
    getLogin: getLogin,
    checkLogin: checkLogin,
    checkAuth: checkAuth,
    checkLoginAuth: checkLoginAuth,
    addConfig: addConfig,
};
