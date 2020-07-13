const fetch = require('fetch');
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs'); // file system

const URL = "https://www.iban.com/structure";
const FILE_NAME = "ibanLengthsRegex.txt";

// renvoie array de clés qui pointent vers la même valeur [value] dans la Map [map]
function getKeys(value, map) {
  const keyArray = [];
  [...map].filter(([key, val]) => val == value).forEach( keyVal => keyArray.push(keyVal[0]) );
  return keyArray;
}

rp(URL)
  .then(html => {

    // Récupère les exemples d'IBAN
    let tdList = $(".structure table tr td:last-child", html);
    let ibanList = [];
    for (let i = 0; i < tdList.length; i++) {
      ibanList.push(tdList[i].children[0].data);
    }
    // Map => [codePays, regex-longueur]
    const regexMap = new Map();
    ibanList.forEach(iban => regexMap.set( iban.substring(0,2), `.{${iban.length-2}}` ) );

    // Regroupe les code pays ayant la même longueur d'IBAN
    const uniqueValues = [...new Set( [...regexMap.values()] ) ];
    const uniqueValuesMap = new Map();
    uniqueValues.forEach( value => {
      const keys = getKeys(value, regexMap);
      keys.forEach( key => uniqueValuesMap.set(keys, value));
    });

    // Création du Regex complet
    let masterRegex = "/^(?:"
    let i = 0;
    for ( const [key, value] of uniqueValuesMap.entries() ) {

      if ( key.length > 1 ) {
        masterRegex += `(?:${key.join("|")})`;
      }else {
        masterRegex += key[0];
      }
      masterRegex += i < uniqueValuesMap.size-1 ? `${value}|` : value;
      i++;
    }
    masterRegex += ")$/i";

    console.log(masterRegex);

    let file = fs.createWriteStream(FILE_NAME);
    file.on('error', function(err) { throw err });
    file.write(masterRegex);
    file.end();

    console.log("\x1b[32m", `Fichier Regex créé : ${FILE_NAME}`, "\x1b[0m");

    }).catch(err => console.error(err));
