class Regex {


  constructor(){
    let countryCode = "";
    let value = "";
    let letterCount = 0;
    let digitCount = 0;
    let otherCount = 0;
  }

  testLetter() {
    if ( this.letterCount == 0 ) {
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
