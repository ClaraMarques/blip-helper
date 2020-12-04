require("dotenv").config();
const shortid = require("shortid");

const authToken = process.env.AUTH_TOKEN;

const _axios = require("axios").create({
  method: "post",
  baseURL: "https://http.msging.net/commands",
  headers: {
    Authorization: `${authToken}`,
    "Content-Type": "application/json",
  },
});

function attIdentity(attList) {
  let listAtt = [];
  for (i = 0; i < qtd; i++) {
    listAtt.push(attList[i].identity);
  }
  return listAtt;
}

async function getAttendants(authToken, limit) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  limit = limit ? limit : 100;
  let resp = await _request({
    id: shortid.generate(),
    to: "postmaster@desk.msging.net",
    method: "get",
    uri: `/attendants?$take=${limit}`,
  });
  return resp.data.resource.items;
}

async function getAllAttendants(authToken) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  let limit = 100;
  while (true) {
    let resp = await _request({
      id: shortid.generate(),
      to: "postmaster@desk.msging.net",
      method: "get",
      uri: `/attendants?$take=${limit}`,
    });
    let qtd = resp.data.resource.items.length;
    if (qtd < limit) {
      return resp.data.resource.items;
    } else {
      limit += limit;
    }
  }
}

function addAttendants(authToken, attList) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "authToken must not be null";
  }
  if (attList === undefined) {
    throw "attList must not be null";
  }
  _addAttendantsSingleRequest(0, attList);
}

function deleteAllAttendants(authToken) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  getAllAttendants(authToken)
    .then((resp) => {
      _deleteAtt(0, attIdentity(resp));
    })
    .catch((err) => {
      throw err;
    });
}

function deleteSpecificAttendants(authToken, attList) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  _deleteAtt(0, attList);
}

function switchQueueAll(authToken, oldQueue, newQueue) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  getAllAttendants(authToken)
    .then((resp) => {
      let filteredArr = [];
      for (x of resp) {
        console.log(x);
        if (x.teams.includes(oldQueue)) {
          x.teams = x.teams.filter(function (value) {
            return value !== oldQueue;
          });
          if (!x.teams.includes(newQueue)) {
            x.teams.push(newQueue);
          }
          delete x.status;
          delete x.lastServiceDate;
          filteredArr.push(x);
        }
      }
      for (x of filteredArr) {
        _request({
          id: shortid.generate(),
          to: "postmaster@desk.msging.net",
          method: "set",
          uri: "/attendants",
          type: "application/vnd.iris.desk.attendant+json",
          resource: x,
        }).then(function (resp) {
          let name = JSON.parse(resp.config.data).resource.fullname;
          console.log(`${name} changed team ${oldQueue} to team ${newQueue}`);
        });
      }
    })
    .catch((err) => {
      throw err;
    });
}

function switchQueueSpecific(authToken, oldQueue, newQueue, attList) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }

  let filteredArr = [];
  for (x of attList) {
    //console.log(x.teams);
    if (x.teams.includes(oldQueue)) {
      x.teams = x.teams.filter(function (value) {
        return value !== oldQueue;
      });
      if (!x.teams.includes(newQueue)) {
        x.teams.push(newQueue);
      }
      delete x.status;
      delete x.lastServiceDate;
      filteredArr.push(x);
    }
  }
  for (x of filteredArr) {
    _request({
      id: shortid.generate(),
      to: "postmaster@desk.msging.net",
      method: "set",
      uri: "/attendants",
      type: "application/vnd.iris.desk.attendant+json",
      resource: x,
    }).then(function (resp) {
      let name = JSON.parse(resp.config.data).resource.fullname;
      console.log(`${name} changed team ${oldQueue} to team ${newQueue}`);
    });
  }
}

exports.deleteAllAttendants = deleteAllAttendants;
exports.getAttendants = getAttendants;
exports.addAttendants = addAttendants;
exports.getAllAttendants = getAllAttendants;
exports.deleteSpecificAttendants = deleteSpecificAttendants;
exports.switchQueueAll = switchQueueAll;
exports.switchQueueSpecific = switchQueueSpecific;

function _changeAuthToken(newAuthToken) {
  _axios.defaults.headers.Authorization = newAuthToken;
}

async function _request(data) {
  try {
    const response = await _axios.post(_axios.defaults.baseURL, data);
    return response;
  } catch (error) {
    throw error;
  }
}

function _addAttendantsSingleRequest(i, attList) {
  _request({
    id: shortid.generate(),
    to: "postmaster@desk.msging.net",
    method: "set",
    uri: "/attendants",
    type: "application/vnd.iris.desk.attendant+json",
    resource: {
      identity: attList[i].Nome,
      email: attList[i].email,
      teams: attList[i].Equipe,
    },
  })
    .then(function (resp) {
      console.log(resp.data.status, i);
      if (i < attList.length - 1) {
        i++;
        _addAttendantsSingleRequest(i, attList);
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

function _removeAcento(text) {
  text = text.toString();
  text = text.replace(new RegExp("[ÁÀÂÃ]", "gi"), "a");
  text = text.replace(new RegExp("[ÉÈÊ]", "gi"), "e");
  text = text.replace(new RegExp("[ÍÌÎ]", "gi"), "i");
  text = text.replace(new RegExp("[ÓÒÔÕ]", "gi"), "o");
  text = text.replace(new RegExp("[ÚÙÛ]", "gi"), "u");
  text = text.replace(new RegExp("[Ç]", "gi"), "c");
  return text;
}

function _deleteAtt(i, lAtt) {
  let idAtt;
  if (lAtt[i].includes("%40")) {
    idAtt = lAtt[i].split("%40");
  } else if (lAtt[i].includes("@")) {
    idAtt = lAtt[i].split("@");
  } else {
    throw "The attendants list must contains only the identifiers";
  }
  idAtt[0] = _removeAcento(idAtt[0]);
  _request({
    id: shortid.generate(),
    to: "postmaster@desk.msging.net",
    method: "delete",
    uri: `/attendants/${idAtt[0]}%2540${idAtt[1]}`,
  })
    .then(function (resp) {
      if (resp.data.status === "failure") {
        console.log(resp.data.metadata, resp.data.status);
      } else {
        console.log("deleted " + `${i}`);
      }

      if (i < lAtt.length - 1) {
        i++;
        _deleteAtt(i, lAtt);
      }
    })
    .catch((err) => {
      throw err;
    });
}
