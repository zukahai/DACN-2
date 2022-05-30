import db from '../models';
let getAllListFont = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let listFonts = await db.ListFont.findAll();
            resolve(listFonts);
        } catch (error) {
            reject(error);
        }
    });
};
let insertMultiListFont = async (listfonts) => {
    return new Promise(async (resolve, reject) => {
        try {
            listfonts.forEach((element, index) => {
                element.id = index + 1;
                element.createAt = formartDate();
                element.updateAt = formartDate();
            });
            await db.ListFont.destroy({ where: {} });
            let msg = await db.ListFont.bulkCreate(listfonts);
            resolve(listfonts);
        } catch (error) {
            reject(error);
        }
    });
};
let findListFontbyId = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let ListFont = await db.ListFont.findOne({ where: { id: id } });
            resolve(ListFont);
        } catch (error) {
            reject(error);
        }
    });
};
let deleteListFontById = async (id) => {
    return new Promise(async (resolve, reject) => {
        db.ListFont.destroy({ where: { id: id } });
        resolve('Xoá thành công ListFont ' + id);
        try {
        } catch (error) {
            reject(error);
        }
    });
};
let deleteAllListFont = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.ListFont.destroy({ where: {}, truncate: true });
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
let insertListFont = async (listfont) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.ListFont.create({
                key: listfont.key,
                image: listfont.image,
                respone: listfont.respone,
            });
        } catch (error) {
            reject(error);
        }
    });
};
let paginateListFont = async (page, limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            let listFontAll = await getAllListFont();
            let listFonts = await db.ListFont.findAll({
                offset: page * limit, // your page number
                limit: limit,
            });
            resolve({
                page: Math.floor(listFontAll.length / limit),
                current: page,
                limit: limit,
                listFonts: listFonts,
            });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getAllListFont: getAllListFont,
    insertMultiListFont: insertMultiListFont,
    insertListFont: insertListFont,
    deleteAllListFont: deleteAllListFont,
    deleteListFontById: deleteListFontById,
    findListFontbyId: findListFontbyId,
    paginateListFont: paginateListFont,
};
