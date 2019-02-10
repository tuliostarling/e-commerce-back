'use strict';

const correioShip = require('node-correios');
const cepAPI = require('cep-promise');
const shipInfo = require('../secrets/config');

exports.getShipPrice = (req, res, callback) => {
    const { cep, value } = req.body;
    const correios = new correioShip();
    if (cep) shipInfo.correioConfig.sCepDestino = cep;
    if (value) shipInfo.correioConfig.nVlValorDeclarado = value;

    correios.calcPreco(shipInfo.correioConfig, (err, totalValue) => {
        if (err) return callback('Erro ao calcular Frete', 500);
        
        if (Object.keys(totalValue[0].Erro).length === 0 && totalValue[0].Erro.constructor === Object) { //Verify if object returns a error

            cepAPI(cep).then(adress => {
                if (adress.state === 'MG') {
                    totalValue.forEach(x => {
                        let value = parseFloat(x.Valor.replace(",", ".")) * 60 / 100;
                        x.Valor = Math.round(value * 100) / 100;
                    });
                    return callback(null, 200, { totalValue, adress });
                }
                return callback(null, 200, { totalValue, adress: adress });

            }).catch((err) => { console.log(err); return callback('Erro ao buscar CEP', 500); });
        }
    });

};

exports.getShipInfo = (req, res, callback) => {
    const { cep } = req.body
    cepAPI(cep).then(adress => { return callback(null, 200, { adress: adress }); })
        .catch((err) => { console.log(err); return callback('Erro ao buscar CEP', 500); });
};


