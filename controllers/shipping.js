'use strict';

const Correio = require('node-correios');

exports.getShipPrice = (req, res, callback) => {
    
};

exports.getShipInfo = (req, res, callback) => {

};

// function toot() {
//     let correios = new Correio();
//     let obj = {
//         nCdServico: '40010, 40045',
//         sCepOrigem: '22041030',
//         sCepDestino: '04569001',
//         nVlPeso: 1,
//         nCdFormato: 1,
//         nVlComprimento: 20,
//         nVlAltura: 4,
//         nVlLargura: 11,
//         nVlDiametro: 20,
//         nVlValorDeclarado: 500
//     };
//     correios.calcPreco(obj, (err, result) => {
//         console.log(err);
//         console.log(result);
//     });

//     correios.consultaCEP({ cep: '30140082' }, (err, result) => {
//         console.log(result);
//     })

// }

