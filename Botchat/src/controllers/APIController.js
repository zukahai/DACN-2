import pool from '../configs/connectDB';

let getALlFonts = async (req, res) => {
    const [fonts] = await pool.execute('SELECT * FROM nvnfont');
    const [datas] = await pool.execute('SELECT * FROM data');
    const [listfonts] = await pool.execute('SELECT * FROM listfont');
    return res.status(200).json({
        message: 'ok',
        font: fonts,
        data: datas,
        listfont: listfonts,
    });
};
let getListFont = async (req, res) => {
    const [rows, fields] = await pool.execute('SELECT * FROM listfont');
    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};
let getData = async (req, res) => {
    const [rows, fields] = await pool.execute('SELECT * FROM data');
    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};
module.exports = {
    getALlFonts: getALlFonts,
    getListFont: getListFont,
    getData: getData,
};
