class BasicMathGenerator {
    constructor(settings) {
        this.config = Object.assign({
            maxNumber: 10,
            negativeNumbers: false,
            wholeNumbers: true,
            operators: ["+", "-"]
        }, settings ? settings : {});

        this.maxNumber = this.config.maxNumber;
        this.operators = this.config.operators;
        this.wholeNumbersOnly = this.config.wholeNumbers;
        this.useNegativeNumbers = this.config.negativeNumbers;
    }

    _getNumber(max = this.maxNumber) {
        let number = Math.round(Math.random() * max);

        return number;
    }

    _getOperator() {
        return this.operators[Math.round(Math.random() * (this.operators.length - 1))];
    }

    generate() {
        let operator = this._getOperator();

        // Generate only whole number divisions
        if (operator == "/" && this.wholeNumbersOnly) {
            var second = this._getNumber();
            var first = second * this._getNumber();
        } else if (operator == "-" && !this.useNegativeNumbers) {
            var first = this._getNumber();
            var second = this._getNumber(first);
        } else {
            var first = this._getNumber();
            var second = this._getNumber();
        }

        return {
            question: first + operator + second,
            answer: eval(first + operator + second)
        }
    }
}