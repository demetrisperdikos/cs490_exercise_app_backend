const WaterIntakeService = require('../Services/WaterIntakeService.js')
const moment = require('moment');

const logWaterIntake = async function(request, response, error){
    if(!request.is('*/json')){
        console.log("logWaterInput.js: Invalid request format. Please request in JSON format.")
        return response.status(415).send({"Access-Control-Allow-Origin": '*', "status": 415, "error": "Invalid request format. Please request in JSON format."})
    }

    if(error instanceof SyntaxError){
        console.log(error)
        return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Invalid JSON", "message": "The request body is not well-formed JSON."})
    }

    const requiredFields = ["amount", "unit"]
    if(!hasAllKeys(request.body, requiredFields)){
        console.log("logWaterInput.js: Missing required fields.")
        return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Missing required field", "message": "Request is missing required some field. Required Fields: amount, unit."})
    }
    
    // create data object for data layer
    data = {}

    /*  
        check for valid unit
        valid units: fl oz, cups, gallons,
    */
    const units = ["cups", "gallons", "fl oz"]
    if(request.body.unit === null || units.indexOf(request.body.unit.toLowerCase()) == -1){
        console.log("logWaterInput.js: Invalid input unit.")
        return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Invalid unit", "details": "Invalid intake unit."})
    }
    data["IntakeUnit"] = request.body.unit.toLowerCase();

    // check for valid water intake value
    // check for negative number
    if(request.body.amount === null || request.body.amount <= 0){
        console.log("logWaterInput.js: Invalid water intake amount")
        return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Bad Request", "details": "Invalid water intake amount, water intake amount must be nonnegative."})
    }
    data["IntakeAmount"] = request.body.amount;

    // check if date included in request
    if("date" in request.body){
        // check if date is valid. date format: yyyy-mm-dd, and a real date, not in future too
        const regex = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$");
        if (!regex.test(request.body.date)) {
            return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Invalid Date Format", "details": "Invalid Date Format. Date format should be yyyy-mm-dd"})
        }

        const parsedDate = moment(request.body.date, 'YYYY-MM-DD', true);
        if(!parsedDate.isValid()){
            return response.status(400).send({"Access-Control-Allow-Origin": '*', "status": 400, "error": "Invalid Date", "details": "Invalid Date"})
        }

        data["Date"] = request.body.date;
    }else{
        data["Date"] = moment().format('YYYY-MM-DD');
    }

    data["UserID"] = request.UserID;
    // Insert water input
    try{
        await WaterIntakeService.recordWaterIntake(data);
        return response.status(200).send({"Access-Control-Allow-Origin": '*', "message": "Water Input Recorded"})
    }catch(error){
        console.log("logActivity.js: Error recording water intake")
        return response.status(500).send({"Access-Control-Allow-Origin": '*', "error": "Error recording water intake", "details": "Error inserting water intake to database"});
    }
}

function hasAllKeys(object, keys){
    for (const key of keys) {
        if (!(key in object)) {
          return false;
        }
    }
    return true;
}

module.exports = { 
    logWaterIntake
}