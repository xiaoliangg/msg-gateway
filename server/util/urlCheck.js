'use strict'
const { Telnet } = require('telnet-client');
const url = require('url');
const urlExist = require('url-exist');

const telnetCheck = async function (urlForCheck) {
    const connection = new Telnet()
    let uri = url.parse(urlForCheck);
    let result;
    if(!uri.port){
        console.log(`port is null,telnet fail:${urlForCheck}`)
    }
    // these parameters are just examples and most probably won't work for your use-case.
    const params = {
        host: uri.hostname,
        port: uri.port,
        // shellPrompt: '/ # ', // or negotiationMandatory: false
        negotiationMandatory: false,
        timeout: 1500
    }
    try {
        await connection.connect(params)
        result = true;
    } catch (error) {
        result = false;
    }
    return result;
}

const urlExist2 = async function(urlForCheck){
    return await urlExist(urlForCheck);
}

exports.checkUrl = async function(urlForCheck){
    if(await urlExist2(urlForCheck)){
        console.log(`${urlForCheck} urlExist success`)
        return true;
    }else if(await telnetCheck(urlForCheck)){
        console.log(`${urlForCheck} telnetCheck success`)
        return true;
    }else{
        console.warn(`${urlForCheck} checkUrl fail!`)
        return false;
    }
}