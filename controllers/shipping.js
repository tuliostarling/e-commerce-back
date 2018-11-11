'use strict';

const Correio = require('node-correios');
const shipInfo = require('../secrets/config');
exports.getShipPrice = (req, res, callback) => {
    const { cep } = req.body;
    const correios = new Correio();
    shipInfo.correioConfig.sCepDestino = cep;

    correios.calcPreco(shipInfo.correioConfig, (err, result) => {
        console.log(err);
        console.log(result);
    });

};

exports.getShipInfo = (req, res, callback) => {
    
    //     correios.consultaCEP({ cep: '30140082' }, (err, result) => {
    //         console.log(result);
    //     })
};

