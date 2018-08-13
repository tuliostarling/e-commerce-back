'use strict';

exports.execute = (func) =>
    (req, res) =>
        func(req, res, (err, code, ret) =>
            execCallback(res, err, code, ret));


exports.executeWithNext = (func) =>
    (req, res, next) =>
        func(req, res, next, (err, code, ret) =>
            execCallback(res, err, code, ret));


function execCallback(res, err, code, ret) {
    if (err) {
        // Não retorna a msg de erro original para o client caso seja um erro interno
        if (code >= 500) {
            ret = { error: 'Internal Server Error.' };
            console.error(err);
        } else {
            ret = { error: err };
        }
    }
    if (ret && code !== 204) {
        res.status(code).send(ret);
    } else {
        res.sendStatus(code);
    }
}
