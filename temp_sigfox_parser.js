/*////////////////////
/// PARSER ADEUNIS ///
////////////////////*/

const messageType = {
    43: "data frame", 
    31: "reply frame", 
    30: "keep alive", 
    20: "info network config", 
    12: "info product config", 
    11: "info product config", 
    10: "info product config"
};

const presenceInternalSensor = {
    0: "unknown/absent/error",
    1: "B57863S0321F040"
};

const presenceExternalSensor = {
    0: "disabled",
    1: "unknown",
    2: "FANB57863-400-1"
};

const productModes = {
    0: "park",
    1: "production",
    2: "test",
    3: "reply"
};

function main(params, callback){
    var result = [];
    let payload = params.data;
    let type = messageType[payload.substring(0,2)]; // Byte 0

    if(type === "reply frame"){ // We don't have the information of the downlink to process this case
        result.push({"key": "messageType","value": type});
        return callback(null, result);
    } 
      
    let frameCounter = parseInt(payload.substring(2,4), 16) >>> 5; // Byte 1, bits 7-6-5
    let hwError = (parseInt(payload.substring(2,4), 16) & 4) >>> 2; // Byte 1, bits 2
    let lowBattery = (parseInt(payload.substring(2,4), 16) & 2) >>> 1; // Byte 1, bits 1
    let configBit = parseInt(payload.substring(2,4), 16) & 1; // Byte 1, bits 0

    result.push(
        {
            "key": "snr",
            "value": params.custom.snr
        }, {
            "key": "station",
            "value": params.custom.station
        }, {
            "key": "avgSnr",
            "value": params.custom.avgSnr
        }, {
            "key": "rssi",
            "value": params.custom.rssi
        },{
            "key": "seqNumber",
            "value": params.custom.seqNumber
        },{
            "key": "messageType",
            "value": type
        },{
            "key": "frameCounter",
            "value": frameCounter
        },{
            "key": "hwError",
            "value": hwError
        },{
            "key": "lowBattery",
            "value": lowBattery
        },{
            "key": "configBit",
            "value": configBit
        }
    );

    params.result = result;

    switch(parseInt(payload.substring(0,2))){
        case 10:
            processCase10(params, callback); // info product config
            break;
        case 11:
            processCase11(params, callback); // info product config
            break;
        case 12:
            processCase12(params, callback); // info product config
            break;
        case 20:
            processCase20(params, callback); // info network config
            break;
        case 30:
            processCase43(params, callback); // Keep Alive. Same case as 43.
            break;
        case 43:
            processCase43(params, callback); // Data frame
            break;
        default:
            return callback(null, result);
    }
}

function processCase10(params, callback){
    let payload = params.data;
    let keepAlivePeriodicty = parseFloat(((parseInt(payload.substring(4,6),16)*10)/60).toFixed(1)); // Byte 2, expressed in tens of minutes
    let transmissionPeriodicity = parseFloat(((parseInt(payload.substring(6,8),16)*10)/60).toFixed(1)); // Byte 3, expressed in tens of minutes
    let idInternalSensor = parseInt(payload.substring(8,10),16) >>> 4; // Bit 4-7, Byte 4
    let thresholdsInternalSensor = parseInt(payload.substring(10,12),16) // Byte 5
    let idExternalSensor = parseInt(payload.substring(12,14),16) >>> 4; // Bit 4-7, Byte 6
    let thresholdsExternalSensor = parseInt(payload.substring(14,16),16) // Byte 7
    let productMode = parseInt(payload.substring(16,18),16) // Byte 8
    let isExternalSensorPresent = parseInt(payload.substring(18,20),16); // Byte 9
    let acquisitionPeriodicity = parseInt(payload.substring(20,22),16); // Byte 10, in minutes

    params.result.push(
        {"key": "keepAlivePeriodicty", "value": keepAlivePeriodicty},
        {"key": "transmissionPeriodicity", "value": transmissionPeriodicity},
        {"key": "idInternalSensor", "value": idInternalSensor},
        {"key": "thresholdsInternalSensor", "value": thresholdsInternalSensor},
        {"key": "idExternalSensor", "value": idExternalSensor},
        {"key": "thresholdsExternalSensor", "value": thresholdsExternalSensor},
        {"key": "productMode", "value": productModes[productMode]},
        {"key": "isExternalSensorPresent", "value": presenceExternalSensor[isExternalSensorPresent]},
        {"key": "acquisitionPeriodicity", "value": acquisitionPeriodicity}
    );

    callback(null, params.result);
}

function processCase11(params, callback){
    let payload = params.data;
    let highThInternalTemp = parseFloat((hexToSignedInt(payload.substring(4,8))/10).toFixed(1)); // Byte 2-3, high threshold internal temp in tenths of degrees
    let hysteresisHighThInternalTemp = parseFloat((parseInt(payload.substring(8,10),16) / 10).toFixed(1)); // Byte 4, hysteresis divided by 10
    let lowThInternalTemp = parseFloat((hexToSignedInt(payload.substring(10,14))/10).toFixed(1)); // Byte 5-6, low threshold internal temp in tenths of degrees
    let hysteresisLowThInternalTemp = parseFloat((parseInt(payload.substring(14,16),16) / 10).toFixed(1)); // Byte 7, hysteresis divided by 10
    let superSamplingFactor = parseInt(payload.substring(16,18),16); // Byte 8

    params.result.push(
        {"key": "highThInternalTemp", "value": highThInternalTemp},
        {"key": "hysteresisHighThInternalTemp", "value": hysteresisHighThInternalTemp},
        {"key": "lowThInternalTemp", "value": lowThInternalTemp},
        {"key": "hysteresisLowThInternalTemp", "value": hysteresisLowThInternalTemp},
        {"key": "superSamplingFactor", "value": superSamplingFactor}
    );

    callback(null, params.result);
}

function processCase12(params, callback){
    let payload = params.data;
    let highThExternalTemp = parseFloat((hexToSignedInt(payload.substring(4,8))/10).toFixed(1)); // Byte 2-3, high threshold internal temp in tenths of degrees
    let hysteresisHighThExternalTemp = parseFloat((parseInt(payload.substring(8,10),16) / 10).toFixed(1)); // Byte 4, hysteresis divided by 10
    let lowThExternalTemp = parseFloat((hexToSignedInt(payload.substring(10,14))/10).toFixed(1)); // Byte 5-6, low threshold internal temp in tenths of degrees
    let hysteresisLowThExternalTemp = parseFloat((parseInt(payload.substring(14,16),16) / 10).toFixed(1)); // Byte 7, hysteresis divided by 10

    params.result.push(
        {"key": "highThExternalTemp", "value": highThExternalTemp},
        {"key": "hysteresisHighThExternalTemp", "value": hysteresisHighThExternalTemp},
        {"key": "lowThExternalTemp", "value": lowThExternalTemp},
        {"key": "hysteresisLowThExternalTemp", "value": hysteresisLowThExternalTemp}
    );

    callback(null, params.result);
}

function processCase20(params, callback){
    let payload = params.data;
    let repetitions = parseInt(payload.substring(4,6),16); // byte 2, number of repetitions

    params.result.push(
        {"key": "repetitions", "value": repetitions}
    );

    callback(null, params.result);
}

function processCase43(params, callback){
    let payload = params.data;
    let isInternalSensorPresent = parseInt(payload.substring(4,6),16) & 15; // Bit 0-3, Byte 2
    let idInternalSensor = parseInt(payload.substring(4,6),16) >>> 4; // Bit 4-7, Byte 2
    let internalTemp = parseFloat((hexToSignedInt(payload.substring(6,10))/10).toFixed(1)); // Byte 3-4, Internal temperature in tenths of degrees
    let isExternalSensorPresent = parseInt(payload.substring(10,12),16) & 15; // Bit 0-3, Byte 5
    let idExternalSensor = parseInt(payload.substring(10,12),16) >>> 4; // Bit 4-7, Byte 5
    let externalTemp = parseFloat((hexToSignedInt(payload.substring(12,16))/10).toFixed(1)); // Byte 6-7, External temperature in tenths of degrees

    params.result.push(
        {"key": "isInternalSensorPresent", "value": presenceInternalSensor[isInternalSensorPresent]},
        {"key": "idInternalSensor", "value": idInternalSensor},
        {"key": "internalTemp", "value": internalTemp},
        {"key": "isExternalSensorPresent", "value": presenceExternalSensor[isExternalSensorPresent]},
        {"key": "idExternalSensor", "value": idExternalSensor},
        {"key": "externalTemp", "value": externalTemp}
    );

    callback(null, params.result);

}

function hexToSignedInt(val){
    let a = parseInt(val, 16);
    if ((a & 0x8000) > 0) {
        a = a - 0x10000;
    }
    return a;
}
