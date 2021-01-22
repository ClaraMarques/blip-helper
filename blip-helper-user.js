const shortid = require("shortid");
const connection = require("./connection.js");

//const _axios = connection.axios;
const _request = connection.request;
const _changeAuthToken = connection.changeAuthToken;
let _reset = false;


const channel = {
    "0mn.io": "Blip Chat",
    "tangram.com.br": "Tangram",
    "take.io": "Take.IO",
    "messenger.gw.msging.net": "Facebook Messenger",
    "wa.gw.msging.net": "WhatsApp",
    "businessmessages.gw.msging.net": "Google Business Messages",
    "skype.gw.msging.net": "Skype",
    "telegram.gw.msging.net": "Telegram",
    "workplace.gw.msging.net": "Workplace",
    "mailgun.gw.msging.net": "Email",
    "pagseguro.gw.msging.net": "PagSeguro",
  };


/**
 * Deletar o contato de um usuário de um bot específico
 * @param {String} authToken Chave de autenticação do bot
 * @param {String} userId    Identificador do usuário
 * @return {}                Não há retorno
 */
function deleteUser(authToken, userId) {

  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  if(!userId){
    throw "UserID must not be null";
  }
  try {
    const getUserVariables = {
      id: shortid.generate(),
      to: "postmaster@msging.net",
      method: "get",
      uri: `/contexts/${userId}`,
    };
    _request(getUserVariables).then(function (response) {
      if (response.data.status !== "failure") {
        let contextVarArr = response.data.resource.items;
        _deleteUserContextVariables(0, contextVarArr, userId);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

/**
 * DResetar o contato de um usuário de um bot específico
 * @param {String} authToken Chave de autenticação do bot
 * @param {String} userId    Identificador do usuário
 * @return {}                Não há retorno
 */
function resetUserContact(authToken, userId) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  if(!userId){
    throw "UserID must not be null";
  }
  _request({
    id: shortid.generate(),
    to: "postmaster@msging.net",
    method: "get",
    uri: `/contacts/${userId}`,
  })
    .then(function (resp) {
      
      if (resp.data.status === "success"){
        console.log("User fetched: ");
        console.log(resp.data.resource);
      } else {
        console.log("Could not find user");
        console.log(resp);
        return;
      }
      _reset = true;
      deleteUser(authToken, userId);
    })
    .catch(function (error) {
      console.log(error);
    });
}

/**
 * Retornar o contato de um usuário de um bot específico
 * @param {String} authToken  Chave de autenticação do bot
 * @param {String} userId     Identificador do usuário
 * @return {Object}           Contato do usuário 
 */
function getUserContact(authToken, userId) {
  if (authToken) {
    _changeAuthToken(authToken);
  } else {
    throw "AuthToken must not be null";
  }
  if(!userId){
    throw "UserID must not be null";
  }
  _request({
    id: shortid.generate(),
    to: "postmaster@msging.net",
    method: "get",
    uri: `/contacts/${userId}`,
  })
    .then(function (resp) {
      
      if(resp.status === 200){
        console.log(resp.data);
        return resp.data;
      } else {
        console.log(resp);
        return resp;
      }
      
    })
    .catch(function (error) {
      console.log(error);
    });
}

exports.getUserContact = getUserContact;
exports.deleteUser = deleteUser;
exports.resetUserContact = resetUserContact;

function _deleteUserContextVariables(idx, contextVarArr, userId) {
  
  let sizeArr = contextVarArr.length;
  let context = contextVarArr[idx];
  
  try {
    _request({
      id: shortid.generate(),
      to: "postmaster@msging.net",
      method: "delete",
      uri: `/contexts/${userId}/${context}`,
    }).then(function (resp){

      if(resp.data.status === "success"){
        console.log(`var ${idx}: ${context} deleted`);
      } else {
        console.log(`Could not delete variable ${idx}: ${context}`);
      }

      idx++;
      if(idx === sizeArr) {
        const deleteUserData = {
          id: shortid.generate(),
          to: "postmaster@msging.net",
          method: "delete",
          uri: `/contacts/${userId}`,
        };
        _deleteUser(deleteUserData, userId);
        return;
      } else {
        _deleteUserContextVariables(idx, contextVarArr, userId);
      }
    });
  } catch (error) {
    console.log(`\"=> Could not delete variable: ${context}\"`);
    console.log(`\"=> Erro: ${error}\"`);
  }
}

function _deleteUser(data, userId) {
  
  _request(data)
    .then(function (response) {
      if(response.status === 200){
        if (response.data.status === "failure") {
          //console.log(response.data);
          console.log(`User deleted.`); 
        } else {
          console.log(response.data);
          console.log(`User deleted !`); 
        };
      } else {
        console.log(response);
        console.log(`Could not delete user`);
      }
      if(_reset){
        _setUser(userId);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function _setUser(userId) {
  try {
    const setUserData = {
      id: shortid.generate(),
      method: "set",
      uri: "/contacts",
      type: "application/vnd.lime.contact+json",
      resource: {
        identity: `${userId}`,
        name: "",
        email: "",
        phoneNumber: "",
        extras: {},
        source:  !(userId.split("@")[1] in channel) ? "" : channel[userId.split("@")[1]],
      },
    };
    _request(setUserData).then(function (response) {
      if (response.data.status === "success") {
        console.log(setUserData);
        console.log("=> User reseted !");
      } else {
        console.log(response);
        console.log("=> Could not reset user");
      }
    });
  } catch (error) {
    console.log(error);
  }
}