#!/usr/bin/env node

import fs from 'fs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .option('i', {
    alias: 'input',
    describe: 'Input template file',
    type: 'string',
    demandOption: true
  })
  .option('o', {
    alias: 'output',
    describe: 'Output file',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

const secretsManagerClient = new SecretsManagerClient({});
const ssmClient = new SSMClient({});

const fetchSecretValue = async (secretId) => {
  // console.log('Fetching secret value for', secretId);
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsManagerClient.send(command);
  return response.SecretString;
};

const fetchSSMParameter = async (parameterName, withDecryption = false) => {
  // console.log('Fetching SSM parameter value for', parameterName);
  const command = new GetParameterCommand({ Name: parameterName, WithDecryption: withDecryption });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
};

const processLine = async (line) => {
  const regex = /(secret-json:|secret:|secure-ssm:|ssm:)([\w/-]+)(\.\{(\w+)\})?/;
  const match = line.match(regex);
  if (!match) return line; // Return original line if no match

  const [fullMatch, service, path, , jsonKey] = match;
  // console.log('Match:', fullMatch, service, path, jsonKey);
  let newValue;

  switch (service) {
    case 'secret-json:':
      const secretString = await fetchSecretValue(path);
      const secretJson = JSON.parse(secretString);
      newValue = secretJson[jsonKey];
      break;
    case 'secret:':
      newValue = await fetchSecretValue(path);
      break;
    case 'secure-ssm:':
      newValue = await fetchSSMParameter(path, true);
      break;
    case 'ssm:':
      newValue = await fetchSSMParameter(path);
      break;
    default:
      return line; // Return original line if service is not recognized
  }

  return line.replace(fullMatch, newValue);
};


const processFile = async (inputFile, outputFile) => {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const lines = fileContent.split('\n');
  const processedLines = await Promise.all(lines.map(processLine));

  fs.writeFileSync(outputFile, processedLines.join('\n'));
};

processFile(argv.input, argv.output).then(() => {
  // console.log(`Processed ${argv.input} and output to ${argv.output}`);
}).catch(err => {
  console.error('Error processing file:', err);
});
