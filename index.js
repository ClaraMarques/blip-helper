const helper = require("./blip-helper-attendants.js");

// Use this script to use blip helper functions
let authIn = "Key ZGlyZWNpb25hbHByZXZlbmRhcHJkOnBkeUN6UFBSSzdPclNLbUp1RGFj";
let authOut = "Key ZGlyZWNpb25hbGJldGFhdGVuZGltZW50bzpCZ21mdW5kc0c1cVVBNDJRQzBjcg==";

//helper.addConfig(authIn, authOut);
//helper.addResources(authIn, authOut);
helper.getAllAttendants("Key ZGlyZWNpb25hbHByZXZlbmRhcHJkOnBkeUN6UFBSSzdPclNLbUp1RGFj").then(function (resp) {console.log(resp.length)});

//add regras
/*function oi(i, attList) {
  let att = attList[i].teams[0];
  _request({
    "id": shortid.generate(),
    'to': 'postmaster@desk.msging.net',
    'method': 'set',
    'uri': '/rules',
    'type': 'application/vnd.iris.desk.rule+json',
    'resource': {
        'id': shortid.generate(),
        'title': att,
        'isActive': true,
        'ownerIdentity': 'whatsapptransbordoprd@msging.net',
        'property': 'Contact.Extras.dealerID',
        'relation': 'Equals',
        'values': [
          att
        ],
        'team': att
    }
})
    .then(function (resp) {
      console.log(resp.data.status, i);
      if (i < attList.length - 1) {
        i++;
        oi(i, attList);
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

oi(0, l);*/



