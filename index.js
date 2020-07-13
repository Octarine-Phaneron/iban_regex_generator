
const fetch = require('fetch');
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs'); // file system

const URL = "https://www.iban.com/structure";

// const DIGIT_REG = "\d";
const test = 20;
let stringTest = "FR";
console.log(`FR\\d{${test}}`);
stringTest += `\\d{${test}}`;
console.log(stringTest);



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
    // console.log(Regex.DIGIT_REG);
    // this.value += Regex.DIGIT_REG + `{${this.digitCount}}`;
    // this.value += String.raw`\d`;
  }
  addLetter() {
    this.value += `[A-Z]{${this.letterCount}}`;
  }
  addOther(){
    this.value += `.{${this.otherCount}}`;
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

    const sorted2 = new Map([...regexMap.entries()].sort());
    console.log(sorted2);

    const sortedMap = new Map([...codeLengthMap.entries()].sort((a, b) => a[1] - b[1]));
    const mapIterator = sortedMap.entries();

    })
  .catch(err => console.error(err));
