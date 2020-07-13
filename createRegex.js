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

    // Récupère infos tableau d'IBAN
    const trList = $(".structure table tr", html);
    const codeList = $("td:nth-child(2)", trList); // Code pays
    const lengthList = $("td:nth-child(4)", trList); // longueur IBAN
    const isSepaList = $("td:nth-child(3)", trList); // is Sepa

    const regexMap = new Map();
    for ( let i = 0; i < codeList.length; i++ ) {
      if ( isSepaList[i].children[0].data == "Yes" ) {
        regexMap.set( codeList[i].children[0].data, `.{${parseInt(lengthList[i].children[0].data)-2}}` );
      }
    }
    // Map de [ [codePays*n], regexLongueur ]
    const uniqueValuesMap = new Map();
    [...new Set( [...regexMap.values()] ) ].forEach( value => uniqueValuesMap.set(getKeys(value, regexMap), value) );
    console.log(uniqueValuesMap);


    // // Création du Regex complet
    let masterRegex = "/^(?:"
    let i = 0;
    for ( const [key, value] of uniqueValuesMap.entries() ) {
      masterRegex += key.length > 1 ? `(?:${key.join("|")})` : key[0];
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
