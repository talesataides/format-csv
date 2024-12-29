const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFileName = 'format-example'; // Insira o nome do arquivo a ser formatado
const inputFilePath = `./inputData/${inputFileName}.csv`; // Caminho do arquivo CSV de entrada
const outputFilePath = `./outputData/sorted_${inputFileName}.csv`;
const outputFile = `./outputData/sorted_${inputFileName}.csv`; // Caminho do arquivo CSV de saída

// Ordem desejada das colunas, incluindo colunas vazias
const desiredOrder = ['Data', 'Descrição', 'Valor', 'Conta', 'Categoria'];

const results = [];

class ValueParser {
  constructor(row, key) {
    this.value = row[key];
    this.row = row;
    this.key = key;
  }

  handleEmptyColumnValue() {
    this.value = this.key === 'Conta' ? "Outros" : this.key === 'Categoria' ? 'Recentemente Importado' : this.value;
    return this;
  }

  handleReplace(str, replacer) {
    this.value = this.value.replaceAll(str, replacer);
    return this;
  }

  removeAccents() {
    this.value = this.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return this;
  }

  getResult() {
    return this.value
  }
}

// Lê o arquivo CSV
fs.createReadStream(inputFilePath)
  .pipe(csv({ separator: ',' })) // Lê com o delimitador ","
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Reordena as colunas e adiciona colunas vazias
    const reorderedResults = results.map(row => {
      return desiredOrder.reduce((acc, key) => {
        const parser = new ValueParser(row, key)

        acc[key] = parser
          .handleEmptyColumnValue()
          .handleReplace('•', '*')
          .removeAccents()
          .getResult();

        return acc;
      }, {});
    });

    // Define o cabeçalho com aspas manuais
    const csvWriter = createCsvWriter({
      path: outputFilePath,
      header: desiredOrder.map(key => ({ id: key, title: `${key}` })), // Adiciona aspas no cabeçalho
      alwaysQuote: true,
      fieldDelimiter: ';', // Define o delimitador de campo como ";"
    });

    console.log({ reorderedResults });

    // Escreve o arquivo CSV com as colunas ordenadas e vazias
    csvWriter.writeRecords(reorderedResults)
      .then(() => {
        console.log('Arquivo CSV com colunas ordenadas foi salvo em', outputFile);
      });
  });
