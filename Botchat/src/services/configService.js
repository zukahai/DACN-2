import db from '../models';
let getAllConfig = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let configs = await db.Config.findAll();
            resolve(configs);
        } catch (error) {
            reject(error);
        }
    });
};
let insertMultiConfig = async (Config) => {
    return new Promise(async (resolve, reject) => {
        try {
            Config.forEach((element, index) => {
                element.id = index + 1;
                element.createAt = formartDate();
                element.updateAt = formartDate();
            });
            await db.Config.destroy({ where: {} });
            let msg = await db.Config.bulkCreate(Config);
            resolve(Config);
        } catch (error) {
            reject(error);
        }
    });
};
let findConfigByName = async (name) => {
    return new Promise(async (resolve, reject) => {
        try {
            let Config = await db.Config.findOne({ where: { name: name }, raw: true });
            resolve(Config);
        } catch (error) {
            reject(error);
        }
    });
};
let deleteConfigByPSID = async (psid) => {
    return new Promise(async (resolve, reject) => {
        db.Config.destroy({ where: { psid: psid } });
        resolve('Xoá thành công Config ' + id);
        try {
        } catch (error) {
            reject(error);
        }
    });
};
let deleteAllConfig = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Config.destroy({ where: {}, truncate: true });
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
let initConfig = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Config.destroy({ where: {} });
            let msg = await db.Config.bulkCreate([
                {
                    name: 'FontList',
                    status: 1,
                    id: 1,
                    createAt: formartDate(),
                    updateAt: formartDate(),
                },
                {
                    name: 'Ban',
                    status: 0,
                    id: 2,
                    createAt: formartDate(),
                    updateAt: formartDate(),
                },
            ]);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};
let updateConfig = async (Config, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let findConfig = await db.Config.findOne({
                where: { id: Config.id },
            });

            if (findConfig) {
                findConfig.status = status;
                await findConfig.save();
                resolve();
            }
        } catch (error) {
            reject(error);
        }
    });
};
let insertConfig = async (Config) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Config.create({
                key: Config.key,
                image: Config.image,
                respone: Config.respone,
            });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getAllConfig: getAllConfig,
    insertMultiConfig: insertMultiConfig,
    insertConfig: insertConfig,
    deleteAllConfig: deleteAllConfig,
    deleteConfigByPSID: deleteConfigByPSID,
    findConfigByName: findConfigByName,
    initConfig: initConfig,
    updateConfig: updateConfig,
};
