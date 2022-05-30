import db from '../models';
let getAllFont = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let fonts = await db.Font.findAll();
            resolve(fonts);
        } catch (error) {
            reject(error);
        }
    });
};
let paginateFont = async (page, limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            let fontAll = await getAllFont();
            let fonts = await db.Font.findAll({
                offset: page * limit, // your page number
                limit: limit,
            });

            resolve({ page: Math.floor(fontAll.length / limit), current: page, limit: limit, fonts: fonts });
        } catch (error) {
            reject(error);
        }
    });
};
let insertMultiFont = async (fonts) => {
    return new Promise(async (resolve, reject) => {
        try {
            fonts.forEach((element, index) => {
                element.id = index + 1;
                element.createAt = formartDate();
                element.updateAt = formartDate();
            });
            await db.Font.destroy({ where: {} });
            let msg = await db.Font.bulkCreate(fonts);
            resolve(fonts);
        } catch (error) {
            reject(error);
        }
    });
};
let findDataByKey = async (key) => {
    return new Promise(async (resolve, reject) => {
        try {
            let font = await db.Font.findOne({ where: { key: key } });
            resolve(font);
        } catch (error) {
            reject(error);
        }
    });
};
let deleteFontById = async (id) => {
    return new Promise(async (resolve, reject) => {
        db.Font.destroy({ where: { id: id } });
        resolve('Xoá thành công font ' + id);
        try {
        } catch (error) {
            reject(error);
        }
    });
};
let deleteAllFont = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Font.destroy({ where: {}, truncate: true });
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
let insertFont = async (font) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.Font.create({
                name: font.name,
                key: font.key,
                link: font.link,
                image: font.image,
                message: font.message,
            });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getAllFont: getAllFont,
    insertMultiFont: insertMultiFont,
    insertFont: insertFont,
    deleteAllFont: deleteAllFont,
    deleteFontById: deleteFontById,
    findDataByKey: findDataByKey,
    paginateFont: paginateFont,
};
