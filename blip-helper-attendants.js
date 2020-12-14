const shortid = require("shortid");

const _axios = require("axios").create({
  method: "post",
  baseURL: "https://http.msging.net/commands",
  headers: {
    Authorization: "",
    "Content-Type": "application/json",
  },
});
/**
 * Criar lista com o identificador de cada atendente
 * @param {String} authToken Chave de autenticação do bot
 * @return {Array}           Array com o identificador de cada atendente
 */
function attIdentity(attList) {
  let listAtt = [];
  for (i = 0; i < qtd; i++) {
    listAtt.push(attList[i].identity);
  }
  return listAtt;
}

/**
 * Pegar atendentes de um bot
 * @param {String} authToken Chave de autenticação do bot
 * @param {Number} limit     Quantidade de atendentes para pegar
 * @return {Array}           Array com as informações de cada atendente
 */
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

/**
 * Pegar todos os atendentes de um bot
 * @param {String} authToken Chave de autenticação do bot
 * @return {Array}           Array com as informações de cada atendente
 */
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

/**
 * Adiocionar atendentes em um bot
 * @param {String} authToken Chave de autenticação do bot
 * @param {Array}  attList   Lista com informações dos atendentes(name, email, team...) a serem adicionados
 * @return {}                Não há retorno
 */
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
/**
 * Deletar todos os atendentes de um bot
 * @param {String} authToken Chave de autenticação do bot
 * @return {}                Não há retorno
 */
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
/**
 * Deletar determinados atendentes de um bot
 * @param {String} authToken  Chave de autenticação do bot
 * @param {Array}  attList    Lista com o identificador dos atendentes
 * @return {}                 Não há retorno
 */
function deleteSpecificAttendants(authToken, attList) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  _deleteAtt(0, attList);
}
/**
 * Trocar todos os atendentes que estão na fila "oldQueue" para a nova fila "newQueue"
 * @param {String} authToken  Chave de autenticação do bot
 * @param {String} oldQueue   Nome da antiga fila
 * @param {String} newQueue   Nome da nova fila
 * @return {}                 Não há retorno
 */
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
/**
 * Trocar atendentes específicos da fila "oldQueue" para a fila "newQueue"
 * @param {String} authToken  Chave de autenticação do bot
 * @param {String} oldQueue   Nome da antiga fila
 * @param {String} newQueue   Nome da nova fila
 * @param {Array}  attList    Lista com o identificador dos atendentes
 * @return {}                 Não há retorno
 */
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

/**
 * Adicionar variáveis de configuraçâo de um bot em outro
 * @param {String} authTokenIn    Chave de autenticação do bot que possui as configurações
 * @param {String} authTokenOut   Chave de autenticação do bot que receberá as configurações
 * @return {}                 Não há retorno
 */
function addConfig(authTokenIn, authTokenOut) {
  if (authTokenIn) {
    _changeAuthToken(authTokenIn);
  } else if (authTokenIn === undefined && authTokenOut === undefined) {
    throw "AuthToken must not be null";
  } else {
    throw "AuthToken must not be null";
  }

  _request({
    id: shortid.generate(),
    to: "postmaster@msging.net",
    method: "get",
    uri: "/buckets/blip_portal:builder_published_configuration",
  })
    .then(function (resp) {
      _changeAuthToken(authTokenOut);
      _request({
        id: shortid.generate(),
        method: "set",
        uri: "/buckets/blip_portal:builder_working_configuration",
        type: "application/json",
        resource: resp.data.resource,
      })
        .then(function (resp2) {
          console.log(resp2.data.status);
        })
        .catch(function (err) {
          console.log(err);
        });
    })
    .catch(function (err) {
      console.log(err);
    });
}
/**
 * Adicionar recursos de um bot para outro
 * @param {String} authTokenIn    Chave de autenticação do bot que possui os recursos
 * @param {String} authTokenOut   Chave de autenticação do bot que receberá os recursos
 * @return {}                 Não há retorno
 */
function addResources(authTokenIn, authTokenOut) {
  if (authTokenIn) {
    _changeAuthToken(authTokenIn);
  } else if (authTokenIn === undefined && authTokenOut === undefined) {
    throw "AuthToken must not be null";
  } else {
    throw "AuthToken must not be null";
  }

  _request({
    id: shortid.generate(),
    method: "get",
    uri: "/resources",
  }).then(function (resp) {
    let resources = resp.data.resource.items;
    _addSingleResource(authTokenIn, authTokenOut, 0, resources);
  });
}

exports.deleteAllAttendants = deleteAllAttendants;
exports.getAttendants = getAttendants;
exports.addAttendants = addAttendants;
exports.getAllAttendants = getAllAttendants;
exports.deleteSpecificAttendants = deleteSpecificAttendants;
exports.switchQueueAll = switchQueueAll;
exports.switchQueueSpecific = switchQueueSpecific;
exports.addConfig = addConfig;
exports.addResources = addResources;

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
      identity: attList[i].name,
      email: attList[i].email,
      teams: attList[i].team,
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

function _addSingleResource(
  authTokenIn,
  authTokenOut,
  resourceIdx,
  resourceArray
) {
  let resource = resourceArray[resourceIdx];
  _changeAuthToken(authTokenIn);
  _request({
    id: shortid.generate(),
    method: "get",
    uri: `/resources/${resource}`,
  }).then(function (resp) {
    _changeAuthToken(authTokenOut);
    _request({
      id: shortid.generate(),
      method: "set",
      uri: `/resources/${resource}`,
      type: "text/plain",
      resource: `${resp.data.resource}`,
    }).then(function (resp) {
      if (resourceIdx === resourceArray.length - 1) {
        return;
      }
      _addSingleResource(
        authTokenIn,
        authTokenOut,
        resourceIdx + 1,
        resourceArray
      );
    });
  });
}
