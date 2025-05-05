const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const config = {
  email: 'user@example.com',
  password: 'password',
  baseUrl: 'http://localhost:3001'
};

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseData);
            errorMessage = errorData.message || `Request failed with status: ${res.statusCode}`;
          } catch (e) {
            errorMessage = `Request failed with status: ${res.statusCode}`;
          }
          reject(new Error(errorMessage));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function authenticate() {
  console.log(`Authenticating as ${config.email}...`);

  const data = JSON.stringify({
    email: config.email,
    password: config.password
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const response = await makeRequest(`${config.baseUrl}/api/v1/auth/login`, options, data);
  return response.access_token;
}

async function register() {
  console.log(`Register as ${config.email}...`);

  const data = JSON.stringify({
    email: config.email,
    password: config.password
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const response = await makeRequest(`${config.baseUrl}/api/v1/auth/register`, options, data);
  return response.statusCode;
}


async function uploadCsvFile(token, endpoint="/api/v1/csv/upload", filepath="./sample.csv") {
  console.log(`Uploading file: ${filepath}...`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const fileContent = fs.readFileSync(filepath);
  const fileName = path.basename(filepath);

  const boundary = `----NodeJSFormBoundary${Math.random().toString(16).substring(2)}`;
  const formDataContent = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filepath}"`,
    'Content-Type: text/csv',
    '',
    fileContent.toString(),
    `--${boundary}--`
  ].join('\r\n');

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(formDataContent),
      'Authorization': `Bearer ${token}`
    }
  };

  await makeRequest(`${config.baseUrl}${endpoint}`, options, formDataContent);

}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node ./upload-csv.js <command> <filepath>, where command is {api, queue1, queue2}")
    process.exit(1)
  }

  let filepath = "./sample.csv"
  if (process.argv.length === 4) {
    filepath = process.argv[3];
  }

  const command = process.argv[2];

  let url = "";
  if (command === "api") {
    url = "/api/v1/csv/upload"
  } else if (command === "queue1") {
    url = "/api/v1/csv/queue1";
  } else if (command === "queue2") {
    url = "/api/v1/csv/queue2";
  } else {
    console.log("Usage: node ./upload-csv.js <command> <filepath>, where command is {api, queue1, queue2}")
    process.exit(1)
  }

  try {
    console.log("register")
    const status = await register();
    console.log(status)
  } catch(error) {
    console.error('Error:', error.message);
  }
  try {
    console.log("authenticaton")
    var token = await authenticate();
  } catch(error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  try {
    console.log(`Uploading a csv file to ${url}`)
    await uploadCsvFile(token, url, filepath);
    console.log("Success!")
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
