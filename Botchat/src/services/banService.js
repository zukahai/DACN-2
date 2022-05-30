import db from '../models';
let getAllBan = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let bans = await db.Ban.findAll();
            resolve(bans);
        } catch (error) {
            reject(error);
        }
    });
};
let insertMultiBan = async (ban) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (ban) {
                ban.forEach((element, index) => {
                    element.id = index + 1;
                    element.createAt = formartDate();
                    element.updateAt = formartDate();
                });
                await db.Ban.destroy({ where: {} });
                let msg = await db.Ban.bulkCreate(ban);
                resolve(ban);
            }
        } catch (error) {
            reject(error);
        }
    });
};
let findBanByPSID = async (psid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (psid) {
                let ban = await db.Ban.findOne({ where: { psid: psid } });
                resolve(ban);
            }
        } catch (error) {
            reject(error);
        }
    });
};
let deleteBanByPSID = async (psid) => {
    return new Promise(async (resolve, reject) => {
        if (psid) {
            db.Ban.destroy({ where: { psid: psid } });
            resolve('Xoá thành công Ban ');
        }
        try {
        } catch (error) {
            reject(error);
        }
    });
};
let deleteAllBan = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Ban.destroy({ where: {}, truncate: true });
            resolve('Xoá thành công');
        } catch (error) {
            reject(error);
        }
    });
};
let formartDate = () => {
    var date = new Date();
    return (
        ('00' + (date.getMonth() + 1)).slice(-2) +
        '/' +
        ('00' + date.getDate()).slice(-2) +
        '/' +
        date.getFullYear() +
        ' ' +
        ('00' + date.getHours()).slice(-2) +
        ':' +
        ('00' + date.getMinutes()).slice(-2) +
        ':' +
        ('00' + date.getSeconds()).slice(-2)
    );
};
let insertBan = async (ban) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (ban) {
                let checkPSID = await findBanByPSID(ban.psid);
                if (!checkPSID) {
                    await db.ban.create({
                        psid: ban.psid,
                        reason: ban.reason,
                        name: ban.name,
                    });
                    resolve('Ban thành công tài khoản');
                }
                resolve('Ban tài khoản thất bại ');
            }
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getAllBan: getAllBan,
    insertMultiBan: insertMultiBan,
    insertBan: insertBan,
    deleteAllBan: deleteAllBan,
    deleteBanByPSID: deleteBanByPSID,
    findBanByPSID: findBanByPSID,
};
