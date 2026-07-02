/**
 * Soma dois números
 * @param {number} a - Primeiro número
 * @param {number} b - Segundo número
 * @returns {number} - Resultado da soma
 */
function somar(a, b) {
    return a + b;
}

// Exemplos de uso:
console.log(somar(2, 3));      // 5
console.log(somar(10, 20));    // 30
console.log(somar(-5, 5));     // 0
console.log(somar(3.14, 2.86)); // 6

// Versão com arrow function (mais concisa)
const somarArrow = (a, b) => a + b;

// Export para uso em outros módulos
export { somar, somarArrow };