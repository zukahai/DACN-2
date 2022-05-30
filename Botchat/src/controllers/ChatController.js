import axios from 'axios';
import cheerio from 'cheerio';
////////////////////////
import chatbotService from '../services/chatbotService';
import fontService from '../services/fontService';
import dataService from '../services/dataService';
import listFontService from '../services/listFontService';
import configService from '../services/configService';
import banService from '../services/banService';

//////////////////
let checkKey = (arr, message) => {
    for (const element of arr) {
        if (message.indexOf(element) > -1) {
            return element;
        }
    }
};
let stripAccents = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str;
};
let Chat = async (req, res, next) => {
    let response = {};
    let message = req.body.message;
    let font = await fontService.getAllFont();
    let data = await dataService.getAllData();
    let arr2 = data.map(({ key }) => key);

    message = message.toLowerCase();
    let listKey = font.map(({ key }) => key);
    let fontAll = [];
    for (let item of listKey) {
        if (message.indexOf(item) !== -1) {
            let fontCurrent = font.find((fontCurrent) => fontCurrent.key === item);
            fontAll.push(fontCurrent);
        }
    }

    let keydata = checkKey(arr2, message);
    fontAll = fontAll.reduce((acc, current) => {
        const x = acc.find((item) => item.key === current.key);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);
    if (fontAll.length !== 0) {
        let check = await configService.findConfigByName('FontList');
        if (fontAll.length === 1 || check.status === '0') {
            let font = fontAll[0];
            response = { data: font, type: 'fontSingle' };
            sendApi(req, res, response);
            return;
        }
        if (fontAll.length > 1 && check.status === '1') {
            response = { data: fontAll, type: 'fontArray' };
            sendApi(req, res, response);
            return;
        }
    } else if (message.indexOf('bắt đầu') !== -1 || message.indexOf('start') !== -1) {
        let respon =
            'Chào bạn mình là bot NVN rất vui được gặp bạn<br> Nếu bạn muôn lấy danh sách font hỗ trợ của mình<br>Vui là nt theo cú pháp<br>Danh sách font hỗ trợ';
        response = { data: respon, type: 'data' };
        sendApi(req, res, response);
        return;
    } else if (null != keydata) {
        let item = await dataService.findDataByKey(keydata);
        let respon = item.respone.trim();
        respon = respon.replaceAll('\n', '<br>');
        response = { data: respon, type: 'data' };
        sendApi(req, res, response);
        return;
    }
    // } else if (message.indexOf('@nvn ban') !== -1 || message.indexOf('@nvn unban') !== -1) {
    //     if (sender_psid === '3171579152927680') {
    //         await chatbotService.AcountService(sender_psid, message);
    //         return;
    //     }
    // } else if (message.indexOf('@nvn fonts') !== -1) {
    //     if (sender_psid === '3171579152927680') {
    //         await chatbotService.fontEvent(sender_psid, message);
    //         return;
    //     }
    // } else if (message.indexOf('@nvn block') !== -1) {
    //     if (sender_psid === '3171579152927680') {
    //         await chatbotService.Block(sender_psid, message);
    //         return;
    //     }
    else if (message.toLowerCase().indexOf('xổ số') !== -1 || message.toLowerCase().indexOf('xo so') !== -1) {
        try {
            const AXIOS_OPTIONS = {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57',
                },
            };
            const { data } = await axios.get(
                `https://xsmn.me/xsmb-sxmb-kqxsmb-xstd-xshn-ket-qua-xo-so-mien-bac.html`,
                AXIOS_OPTIONS,
            );
            let $ = cheerio.load(data);
            let xsmb = $(data).find('table.extendable.kqmb.colgiai').first();
            let msg = '';
            let gdb = $(xsmb).find('span.v-gdb').first().text();
            msg += 'Giải đặc biệt: ' + gdb + '<br>';
            let gn = $(xsmb).find('span.v-g1').first().text();
            msg += 'Giải nhất: ' + gn + '<br>';
            msg += 'Giải 2: ';
            for (let i = 0; i < 2; i++) {
                msg += $(xsmb).find(`span.v-g2-${i}`).text().trim() + ' ';
            }
            msg += '<br>Giải 3: ';
            for (let i = 0; i < 6; i++) {
                msg += $(xsmb).find(`span.v-g3-${i}`).text().trim() + ' ';
            }
            msg += '<br>Giải 4: ';
            for (let i = 0; i < 4; i++) {
                msg += $(xsmb).find(`span.v-g4-${i}`).text().trim() + ' ';
            }
            msg += '<br>Giải 5: ';
            for (let i = 0; i < 6; i++) {
                msg += $(xsmb).find(`span.v-g5-${i}`).text().trim() + ' ';
            }
            msg += '<br>Giải 6: ';
            for (let i = 0; i < 3; i++) {
                msg += $(xsmb).find(`span.v-g6-${i}`).text().trim() + ' ';
            }
            msg += '<br>Giải 7: ';
            for (let i = 0; i < 4; i++) {
                msg += $(xsmb).find(`span.v-g7-${i}`).text().trim() + ' ';
            }

            response = { data: msg, type: 'data' };
            sendApi(req, res, response);
            await callSendAPI(sender_psid, response);
            return;
        } catch (e) {
            return;
        }
        return;
    }
    // } else if (
    //     message.toLowerCase().indexOf('covid') !== -1 ||
    //     message.toLowerCase().indexOf('corona') !== -1 ||
    //     message.toLowerCase().indexOf('cov') !== -1
    // ) {
    //     await chatbotService.getCovidApi(sender_psid, message);
    //     return;
    // } else if (message.indexOf('mấy giờ') !== -1 || message.indexOf('giờ giấc') !== -1) {
    //     let msg = chatbotService.getTimeVietNam();
    //     let response = { text: `Bây giờ là ${msg} ` };
    //     await chatbotService.callSendAPI(sender_psid, response);
    //     let msgtime = chatbotService.checktime(username);
    //     let response2 = { text: msgtime };
    //     await chatbotService.callSendAPI(sender_psid, response2);
    //     return;
    else if (message.indexOf('danh sách font') !== -1 || message.indexOf('list font') !== -1) {
        let listfont = await listFontService.getAllListFont();
        let dataRespone = [];
        for (let i = 0; i < listfont.length; i++) {
            let replace = listfont[i].list;
            replace = replace.replaceAll('\n', '<br>');
            dataRespone.push(replace);
        }
        response = { data: dataRespone, type: 'listFont' };
        sendApi(req, res, response);
        return;
        let response2 = {
            text: 'Nếu bạn muốn lấy link nào thì nhắn tin tên một font trong list này\nHệ thống sẽ gửi cho bạn',
        };
        await chatbotService.callSendAPI(sender_psid, response2);
        return;
    } else {
        try {
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
                const { data } = await axios.get(
                    `https://www.google.com.vn/search?q=${encodedString}&hl=vi&gl=VN`,
                    AXIOS_OPTIONS,
                );
                let $ = cheerio.load(data);
                //Hỏi thông tin cơ bản
                let infor = $(data).find('span.hgKElc').text();
                if (infor != null && infor !== '') {
                    response = { data: infor, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //Hỏi thông tin về năm sinh
                let year = $(data).find('div.Z0LcW').text();
                if (year != null && year !== '') {
                    response = { data: year, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                // //Thời tiết
                let bitcoin = $(data).find('span.pclqee').text();
                if (bitcoin != null && bitcoin !== '') {
                    // console.log("5");
                    bitcoin = bitcoin + ' ' + $(data).find('span.dvZgKd').text();
                    console.log(bitcoin);
                    response = { data: bitcoin, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                let checkwheather = $(data).find('span#wob_tm').text();
                if (checkwheather != null && checkwheather !== '') {
                    let wheather =
                        `Thời tiết hiện tại tại: ${$(data).find('div#wob_loc').text()}\n` +
                        `Nhiệt độ: ${$(data).find('span#wob_tm').text()} °C\n` +
                        `Bầu trời: ${$(data).find('span#wob_dc').text()}\n` +
                        `Khả năng có mưa: ${$(data).find('span#wob_pp').text()}\n` +
                        `Độ ẩm: ${$(data).find('span#wob_hm').text()} %\n`;
                    // console.log("3");
                    wheather = wheather.replaceAll('\n', '<br>');
                    response = { data: wheather, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                let msghh = message.toLowerCase();
                msghh = stripAccents(msghh);
                if (msghh.indexOf('thoi tiet') !== -1 && !checkwheather.length > 0 && msghh.indexOf('dich') === -1) {
                    let msg =
                        'Nếu bạn muốn xem thời tiết\nThì nhắn tin phải có địa điểm\nVí dụ như thế này nè:<br>Thời tiết tại Đà Nẵng';
                    response = { data: msg, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //Giá Bitcoin

                //ngay le
                let dateFestival = $(data).find('div.zCubwf').text();
                if (dateFestival != null && dateFestival !== '') {
                    // console.log("6");
                    response = { data: dateFestival, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //bong da
                let team1 = $(data).find('div.kno-fb-ctx > span').first().text();
                if (team1 != null && team1 !== '') {
                    let score1 = $(data).find('div.imso_mh__l-tm-sc.imso_mh__scr-it.imso-light-font').last().text();
                    let team2 = $(data).find('div.kno-fb-ctx > span').last().text();
                    let score2 = $(data).find('div.imso_mh__r-tm-sc.imso_mh__scr-it.imso-light-font').last().text();
                    let msg = `${team1} ${score1} - ${score2} ${team2}`;
                    // console.log("7");
                    response = { data: msg, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }

                //Tiền tệ
                let money = $(data).find('span.DFlfde.SwHCTb').text();
                if (money != null && money !== '') {
                    let msg = money + ' ' + $(data).find('span.MWvIVe').text();
                    response = { data: msg, type: 'data' };
                    sendApi(req, res, response);
                    console.log(money);
                    return;
                }
                //chuyen doi
                let change_unit = $(data).find('div.dDoNo.vrBOv.vk_bk').text();
                if (change_unit != null && change_unit !== '') {
                    response = { data: change_unit, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                // tinh toan
                let math = $(data).find('span.qv3Wpe').text();
                if (math != null && math !== '') {
                    response = { data: math, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                // tinh bieu thuc
                // let mathfun = $(data).find("div.TRhz4").last().text();
                // if (mathfun != null && mathfun != "") {
                //     let result = '';
                //     if (mathfun.indexOf("Đáp án") != -1) {
                //         mathfun = mathfun.replaceAll("𝑥", "x").trim();
                //         mathfun = mathfun.replaceAll("Đáp án", "");
                //         mathfun = mathfun.replaceAll(" ", "");
                //         mathfun = mathfun.split("x");
                //         for (let value of mathfun) {
                //             if (value != "" && value != null) {
                //                 result += "x = " + value.replaceAll("=", "").trim() + "\n"
                //             }
                //         }
                //         let response = { text: result };
                //         await callSendAPI(sender_psid, response);
                //         return;
                //     }
                //     if (mathfun.indexOf("Vô nghiệm") != -1) {
                //         let response = { text: 'Vô nghiệm' };
                //         await callSendAPI(sender_psid, response);
                //         return;
                //     }
                //     return;
                // }
                //zipcode
                let zipcode = $(data).find('div.bVj5Zb.FozYP');
                if (zipcode.length > 0) {
                    console.log(zipcode.text());
                    let msgzipcode;
                    zipcode.each(function (e, i) {
                        msgzipcode += $(this).text() + '<br>';
                    });
                    response = { data: msgzipcode, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //Khoảng cách
                let far = $(data).find('div.LGOjhe').text();

                if (far != null && far !== '') {
                    response = { data: far, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //Ngày thành lập
                let datecreate = $(data).find('div.Z0LcW').text();
                if (datecreate != null && datecreate !== '') {
                    response = { data: datecreate, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //Thong tin
                let information = $(data).find('div.kno-rdesc > span').first().text();
                if (information != null && information !== '') {
                    response = { data: information, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //dịch
                let trans = $(data).find('div.oSioSc>div>div>div>pre>span').first().text();
                if (trans != null && trans !== '') {
                    // console.log("15");
                    response = { data: trans, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                //date
                let day = $(data).find('div.FzvWSb').text();
                if (day != null && day !== '') {
                    response = { data: day, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                let time = $(data).find('div.YwPhnf').text();
                if (time != null && time !== '') {
                    response = { data: time, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                lyric;
                let lyric = $(data).find('div.PZPZlf >div>div > span');
                let lyricsave;
                lyric.each(function (i, e) {
                    lyricsave += $(this).text() + '<br>';
                });

                if (lyricsave != null && lyricsave != '') {
                    response = { data: lyricsave, type: 'data' };
                    sendApi(req, res, response);
                    return;
                }
                return;
            }
        } catch (e) {
            return;
        }
        return;
    }
};
let sendApi = (req, res, response) => {
    return res.status(200).json({
        response: response,
    });
};
let getChat = (req, res, next) => {
    return res.render('chat');
};
module.exports = {
    Chat: Chat,
    getChat: getChat,
};
