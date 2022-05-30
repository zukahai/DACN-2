import db from '../models';
let getAllData = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let datas = await db.Data.findAll();
            resolve(datas);
        } catch (error) {
            reject(error);
        }
    });
};
let insertMultiData = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            data.forEach((element, index) => {
                element.id = index + 1;
                element.createAt = formartDate();
                element.updateAt = formartDate();
            });
            await db.Data.destroy({ where: {} });
            let msg = await db.Data.bulkCreate(data);
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};
let findDataByKey = async (key) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.Data.findOne({ where: { key: key }, raw: true });
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};
let deleteDataById = async (id) => {
    return new Promise(async (resolve, reject) => {
        db.Data.destroy({ where: { id: id } });
        resolve('Xoá thành công Data ' + id);
        try {
        } catch (error) {
            reject(error);
        }
    });
};
let deleteAllData = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Data.destroy({ where: {}, truncate: true });
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
let insertData = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Data.create({
                key: data.key,
                image: data.image,
                respone: data.respone,
            });
        } catch (error) {
            reject(error);
        }
    });
};
let paginateData = async (page, limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            let dataAll = await getAllData();
            let datas = await db.Data.findAll({
                offset: page * limit, // your page number
                limit: limit,
            });

            resolve({ page: Math.floor(dataAll.length / limit), current: page, limit: limit, datas: datas });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getAllData: getAllData,
    insertMultiData: insertMultiData,
    insertData: insertData,
    deleteAllData: deleteAllData,
    deleteDataById: deleteDataById,
    findDataByKey: findDataByKey,
    paginateData: paginateData,
};
