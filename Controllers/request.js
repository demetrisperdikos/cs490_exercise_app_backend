const { coachID_exists } = require("../utils/helper_funcs.js");
const { createRequest, userRequestedCoach, getPendingRequests } = require(
  "../DataAccess/RequestRepository.js",
);

async function requestCoach(req, res, err) {
  if (!req.is("*/json")) {
    return res.status(415).send({
      "Access-Control-Allow-Origin": "*",
      "status": 415,
      "error": "Invalid request format. Please request in JSON format.",
    });
  }

  if (err instanceof SyntaxError) {
    console.log(err);
    return res.status(400).send({
      "Access-Control-Allow-Origin": "*",
      "status": 400,
      "error": "Invalid JSON",
      "message": "The request body is not well-formed JSON.",
    });
  }

  const requiredFields = ["userID", "coachID", "goals", "note"];
  if (!hasAllKeys(req.body, requiredFields)) {
    console.log("logWaterInput.js: Missing required fields.");
    return res.status(400).send({
      error: {
        status: 400,
        message: "Missing required field",
        details:
          "Request is missing required some field. Required Fields: UserID, CoachID, Goals, Notes",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // why do the regex check. Like we send to database anyway and that won't give any results anyways
  const id_regex = new RegExp("^-?[0-9]+$");
  const coachID = req.body.coachID;
  const userID = req.body.userID;

  if (!id_regex.test(coachID) || !id_regex.test(userID)) {
    return res.status(422).send({
      error: {
        status: 422,
        message: "Bad Request",
        details: "Invalid CoachID and/or UserID (must be an integer)",
      },
    });
  }
  if (coachID < 0 || userID < 0) {
    return res.status(422).send({
      error: {
        status: 422,
        message: "Bad Request",
        details: "Invalid CoachID and/or UserID (must be nonnegative)",
      },
    });
  }

  // check if passed userID and token userid is the same
  if (userID !== req.UserID) {
    return res.status(401).send({
      error: {
        status: 401,
        message: "Unauthorized",
        details: "UserID in request does not match UserID of logged in user",
      },
    });
  }

  if (!await coachID_exists(coachID)) {
    return res.status(404).send({
      error: {
        status: 404,
        message: "Not Found",
        details: "CoachID not found.",
      },
    });
  }

  // check if user has already requested coach
  if (await userRequestedCoach(userID, coachID)) {
    return res.status(422).send({
      error: {
        status: 422,
        message: "Unprocessable content",
        details: "User has already request this coach",
      },
    });
  }

  requestData = {
    UserID: userID,
    CoachID: coachID,
    Status: "Pending",
    Goals: req.body.goals,
    Note: req.body.note,
  };

  try {
    const createdRequest = await createRequest(requestData);
    console.log(createdRequest.dataValues);
    responseObject = {
      requestID: createdRequest.dataValues.RequestID,
      userID: createdRequest.dataValues.UserID,
      coachID: createdRequest.dataValues.CoachID,
      status: createdRequest.dataValues.Status,
      goals: createdRequest.dataValues.Goals,
      note: createdRequest.dataValues.Note,
    };

    return res.status(201).send(responseObject);
  } catch (error) {
    return res.status(500).send({
      error: {
        status: 500,
        message: "Server Error while trying to requestCoach",
      },
    });
  }
}

async function getOpenRequests(req, response, error) {
  try {
    const pendingRequests = await getPendingRequests(req.UserID);
    return response.status(200).send(pendingRequests);
  } catch (error) {
    return res.status(500).send({
      error: {
        status: 500,
        message: "Server Error while trying to getOpenRequests",
      },
    });
  }
}

function hasAllKeys(object, keys) {
  for (const key of keys) {
    if (!(key in object)) {
      return false;
    }
  }
  return true;
}

module.exports = {
  requestCoach,
  getOpenRequests,
};