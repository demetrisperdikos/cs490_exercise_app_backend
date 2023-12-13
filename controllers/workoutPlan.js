const { getUsersOfCoach_DB, getCoachIDFromUserID_DB } = require("../dataAccess/coach_db_access");
const { getWorkoutPlan_DB, addExercise_DB } = require("../dataAccess/workout_plan_db");

async function getWorkoutPlan(req, res){
    // makes it so we dont have duplicate code due to where the userID is stored i.e. req.params.userID or req.userID
    let userID = req.userID;

    // check if userID supplied in path parameters
    // if userID in path then coach is trying to access their clients workout plan, COACH is logged in
    if(req.params.userID != null){
        // checking if supplied userID is the ID of one of the coach' clients
        const coachData = await getCoachIDFromUserID_DB(req.userID);
        const coachID = coachData[0].coachID;
    
        let clients = await getUsersOfCoach_DB(coachID);
        clients = clients.filter((client) => {
            return client.userID == req.params.userID});
    
        if(clients.length == 0){
            res.status(403);
            return res.send({
                error: {
                    status: 403,
                    message: `ClientID ${req.params.userID} is not one of this coach's clients.`
                }
            })
        }
        userID = req.params.userID;
    }   

    try{
        const workoutPlan = await getWorkoutPlan_DB(userID);
        let workoutPlanFormatted = {}
        workoutPlan.forEach(element => {
            element.dayOfWeek = element.dayOfWeek.toLowerCase();
            if(!(element.dayOfWeek in workoutPlanFormatted)){
                workoutPlanFormatted[element.dayOfWeek] = {}
            }

            if(!(element.name in workoutPlanFormatted[element.dayOfWeek])){
                workoutPlanFormatted[element.dayOfWeek][element.name] = {
                    sets: element.sets,
                    reps: [element.reps],
                    weight: element.weight
                }
            }else{
                workoutPlanFormatted[element.dayOfWeek][element.name]["reps"].push(element.reps)
            }
        });

        res.status(200);
        return res.send(workoutPlanFormatted);
    }catch(error){
        res.status(500);
        return res.send({
            "error": {
                status: 500,
                message: "Error accessing database.",
            }
        });
    }
}

async function addExercise(req, res){
    let userID = req.userID;

    // if userID included in request body -> coach adding exercise
    // verifying userID in request is a client of the coach
    if(req.body.userID != null){
        const coachData = await getCoachIDFromUserID_DB(req.userID);
        if(coachData.length == 0){
            res.status(403);
            return res.send({
                error: {
                    status: 403,
                    message: "User is not a coach"
                }    
            })
        }
        const coachID = coachData[0].coachID;
    
        let clients = await getUsersOfCoach_DB(coachID);
        clients = clients.filter((client) => {
            return client.userID == req.body.userID});
    
        if(clients.length == 0){
            res.status(403);
            return res.send({
                error: {
                    status: 403,
                    message: `ClientID ${req.body.userID} is not one of this coach's clients.`
                }
            })
        }
        userID = req.body.userID;
    }

    try{
        const insertedExercise = await addExercise_DB(req.body);
        res.status(201);
        return res.send({
            status: 201,
            message: "Exercise added to workout"
        });
    }catch(error){
        res.status(500);
        return res.send({
            "error": {
                status: 500,
                message: "Error accessing database.",
            }
        });
    }



}

module.exports = {
    getWorkoutPlan,
    addExercise
}