
const fetch = require('fetch');
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs'); // file system

const URL = "https://www.iban.com/structure";


class Regex {

  static get DIGIT_REG() { return String.raw`\d`; }


  constructor(){
    this.countryCode = "";
    this.value = "";
    this.letterCount = 0;
    this.digitCount = 0;
    this.otherCount = 0;
  }

  testAddLetter() {
    if (this.letterCount != 0) {
      this.addLetter();
      this.letterCount = 0;
    }
  }
  testAddDigit() {
    if ( this.digitCount != 0 ) {
      this.addDigit();
      this.digitCount = 0;
    }
  }
  testAddOther() {
    if ( this.otherCount != 0 ) {
      this.addOther();
      this.otherCount = 0;
    }
  }

  addDigit() {
    this.value += `\\d{${this.digitCount}}`;
  }
  addLetter() {
    this.value += `[A-Z]{${this.letterCount}}`;
  }
  addOther(){
    this.value += `.{${this.otherCount}}`;
  }

}

function getKeys(value, map) {
  const keyArray = [];
  [...map].filter(([key, val]) => val == value).forEach( keyVal => keyArray.push(keyVal[0]) );
  return keyArray;
}


rp(URL)
  .then(html => {
    let tdList = $(".structure table tr td:last-child", html);
    let ibanList = [];

    for (let i = 0; i < tdList.length; i++) {
      ibanList.push(tdList[i].children[0].data);
    }

    const regexMap = new Map();
    const codeLengthMap = new Map();
    ibanList.forEach(iban => {

      let isCountryCode = true;
      const regex = new Regex();

      for (const char of iban) {

          if ( char.match(/[a-z]/i) && isCountryCode ) { // Si premières lettres
            regex.countryCode += char;
          } else { // plus les premières lettres
            if (isCountryCode) { isCountryCode = false; }
            if ( char.match(/[a-z]/i) ) { // si lettre
              regex.testAddDigit();
              regex.testAddOther();
              regex.letterCount++;
            } else if ( char.match(/\d/) ) { // si chiffre
              regex.testAddLetter();
              regex.testAddOther();
              regex.digitCount++;
            } else { // Si autre ( à priori impossible )
              regex.testAddLetter();
              regex.testAddDigit();
              regex.otherCount++;
            }

          }

      }
      if ( regex.digitCount != 0 && regex.letterCount == 0 && regex.otherCount == 0 ) {
        regex.addDigit();
        regexMap.set(regex.countryCode, regex.value);
      } else if ( regex.letterCount != 0 && regex.digitCount == 0 && regex.otherCount == 0 ){
        regex.addLetter();
        regexMap.set(regex.countryCode, regex.value);
      } else if ( regex.otherCount != 0 && regex.letterCount == 0 && regex.digitCount == 0 ){
        regex.addOther();
        regexMap.set(regex.countryCode, regex.value);
      } else {
        console.error("\x1b[31m", `Erreur lors du parsing IBAN, code pays : ${regex.countryCode} - Pas mis dans le regex`, "\x1b[5m", "/!\\", "\x1b[0m");
      }

      codeLengthMap.set(regex.countryCode, iban.length - regex.countryCode.length);

    });

    const uniqueValues = [...new Set( [...regexMap.values()] ) ];
    const uniqueValuesMap = new Map();

    uniqueValues.forEach( value => {
      const keys = getKeys(value, regexMap);
      keys.forEach( key => uniqueValuesMap.set(keys, value));
    });

    const sortedMap = new Map([...uniqueValuesMap.entries()].sort());

    let masterRegex = "/^(?:"
    let i = 0;
    for ( const [key, value] of sortedMap.entries() ) {

      if ( key.length > 1 ) {
        masterRegex += `(?:${key.join("|")})`;
      }else {
        masterRegex += key[0];
      }
      masterRegex += i < sortedMap.size-1 ? `${value}|` : value;
      i++;
    }
    masterRegex += ")$/i";

    console.log(masterRegex);

    let file = fs.createWriteStream('ibanRegex.txt');
    file.on('error', function(err) { throw err });
    file.write(masterRegex);
    file.end();

    })
  .catch(err => console.error(err));
