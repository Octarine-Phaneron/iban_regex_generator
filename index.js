
const fetch = require('fetch');
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs'); // file system

const URL = "https://www.iban.com/structure";

const DIGIT_REG = "\d";
const test = 20;
let stringTest = "FR";
console.log(`FR\\d{${test}}`);
stringTest += `\\d{${test}}`;
console.log(stringTest);



  class Regex {

    constructor(){
      this.countryCode = "";
      this.value = "";
      this.letterCount = 0;
      this.digitCount = 0;
      this.otherCount = 0;
    }

    testLetter() {
      if (this.letterCount == 0) {
        this.value += `[A-Z]{${letterCount}}`;
        this.letterCount = 0;
      }
    }

    testDigit() {
      if ( this.digitCount == 0 ) {
        this.value += `\\d{${digitCount}}`;
        this.digitCount = 0;
      }
    }

    testOther() {
      if ( this.otherCount == 0 ) {
        this.value += `.{${otherCount}}`;
        this.otherCount = 0;
      }
    }


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
      // let regex = "";
      let isCountryCode = true;


      const regex = new Regex();

      for (const char of iban) {

          if ( char.match(/[a-z]/i) && isCountryCode ) { // Si premières lettres
            regex.countryCode += char;
            regex.value += char;
          } else { // plus les premières lettres
            if (isCountryCode) { isCountryCode = false; }
            if ( char.match(/[a-z]/i) ) { // si lettre
              regex.testDigit();
              regex.testOther();
              regex.letterCount++;
            } else if ( char.match(/\d/) ) { // si chiffre
              regex.testLetter();
              regex.testOther();
              regex.digitCount++;
            } else { // Si autre ( à priori impossible )
              regex.testLetter();
              regex.testDigit();
              regex.otherCount++;
            }

          }

      }
      if ( regex.digitCount != 0 && regex.letterCount == 0 && regex.otherCount == 0 ) {
        regex.value += `\\d{${digitCount}}`;
        regexMap.set(regex.countryCode, regex.value);
      } else if ( regex.letterCount != 0 && regex.digitCount == 0 && regex.otherCount == 0 ){
        regex.value += `[A-Z]{${letterCount}}`;
        regexMap.set(regex.countryCode, regex.value);
      } else if ( regex.otherCount != 0 && regex.letterCount == 0 && regex.digitCount == 0 ){
        regex.value += `.{${otherCount}}`;
        regexMap.set(regex.countryCode, regex.value);
      } else {
        console.error("\x1b[31m", `Erreur lors du parsing IBAN, code pays : ${regex.countryCode} - Pas mis dans le regex`, "\x1b[5m", "/!\\", "\x1b[0m");
      }

      codeLengthMap.set(regex.countryCode, iban.length - regex.countryCode.length);

    });

    console.log(regexMap);
    const sortedMap = new Map([...codeLengthMap.entries()].sort((a, b) => a[1] - b[1]));
    const mapIterator = sortedMap.entries();

    })
  .catch(err => console.error(err));
