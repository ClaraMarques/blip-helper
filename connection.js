const axios = require("axios").create({
  method: "post",
  baseURL: "https://http.msging.net/commands",
//baseURL: "https://itau.http.msging.net/commands",
  headers: {
    Authorization: "",
    "Content-Type": "application/json",
  },
});

async function request(data) {
  try {
    const response = await axios.post(axios.defaults.baseURL, data);
    return response;
  } catch (error) {
    throw error;
  }
}

function changeAuthToken(newAuthToken) {
  axios.defaults.headers.Authorization = newAuthToken;
}

exports.axios = axios;
exports.request = request;
exports.changeAuthToken = changeAuthToken;