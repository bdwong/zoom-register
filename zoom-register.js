const { Command, CommanderError, Argument } = require('commander');
const { mkdirSync, readFileSync, copyFileSync } = require('fs');
const neatCsv = require('neat-csv');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { memoryUsage } = require('process');
const path = require('path');

// Read meeting registrants
function getRegistrants(filename) {
   const csv = readFileSync(filename, 'utf8');
   return neatCsv(csv);
}

// Basic error handling
async function sendRequest(async_call) {
   let response;
   try {
      response = await async_call();
      console.log(`Response: ${response.status}`)
   } catch(e) {
      if (e.response) {
         response = e.response;
         console.log(`Response: ${response.status}`);
      } else {
         console.log(`Error: ${e.message}`);
         throw e;
      }
   }
   return response;
}


function generateJWT(appconfig, payload = {}) {
   let token = jwt.sign(payload, appconfig['api_secret'], {
      algorithm: 'HS256',
      expiresIn: 30,
      notBefore: -5,
      issuer: appconfig['api_key']
   });
   return token;
}

function requestHeaders(appconfig) {
   let token = generateJWT(appconfig);
   let headers = {
      'User-Agent': 'Zoom-Jwt-Request',
      'Authorization': `bearer ${token}`,
      'Accepts': 'application/json'
   }
   return headers;
}

// Chunk an array and perform operations on it.
// Credits to: https://stackoverflow.com/questions/8495687/split-array-into-chunks
async function in_chunks(array, chunk, func) {
   let i,j, temporary;
   for (i = 0,j = array.length; i < j; i += chunk) {
      temporary = array.slice(i, i + chunk);
      await func(temporary);
   }
}

function config_dir() {
   const path = require('path');
   const os = require('os');
   return path.join(os.homedir(), '.config', 'zoom-register');
}

function config_filepath() {
   return path.join(config_dir(), 'appconfig.json');
}

function config_template_path() {
   return path.join(__dirname, 'appconfig.sample.json');
}

function configure() {
   mkdirSync(config_dir(), {recursive: true})
   let src = config_template_path();
   let dst = config_filepath();

   console.log(`Copying template config to ${dst}`);
   copyFileSync(src, dst);
}

// Read app configuration
function readAppConfig() {
   let config_data;
   try {
      config_data = JSON.parse(readFileSync(config_filepath()));
   } catch(err) {
      configure();
   }
   if (!config_data || config_data.api_key == 'YOUR_JWT_API_KEY_HERE' || config_data.api_secret == 'YOUR_JWT_SECRET_HERE') {
      console.log(`Please edit ${config_filepath()} to include your Zoom API key and secret.`);
      console.log('See https://github.com/bdwong/zoom-register#readme for more information.');
      process.exit(2);
   }
   return config_data;
}


const program = new Command();
program.version('0.1.0');

const meetings = program.command('meetings')
   .description('operate on meetings')

meetings.command('list')
   .description('list names and ids of upcoming (non-recurring) meetings')
   .argument('<email_or_user_id>', 'email or id of user to query')

   .action(async (email_or_user_id) => {
      console.log(`List meetings`);
      result = await sendRequest( () => {return axios.get(`/users/${email_or_user_id}/meetings`)} );
      if (result.data.meetings) {
         //console.log('Approved registrants:');
         result.data.meetings.filter(m => m.type == 2).forEach(e => {
            console.log(`id: ${e.id} @ ${e.start_time}, ${e.topic}`);
         })
      } else {
         console.log(result.data);
      }
   })

meetings.command('get')
   .description('get meeting information')
   .argument('<meeting_id>', 'id of the meeting')
   .action(async (meeting_id) => {
      console.log(`Get meeting ${meeting_id}`);
      result = await sendRequest( () => {return axios.get(`/meetings/${meeting_id}?type=upcoming&page_size=20`)} );
      console.log(result.data);
   })

const attendees = program.command('attendees')
   .description('operate on meeting attendees');

attendees.command('single')
   .description('register single attendee for meeting')
   .argument('<meeting_id>', 'id of the meeting')
   .argument('<email>', 'attendee email address')
   .argument('<first_name>', 'first name of attendee')
   .argument('<last_name>', 'last name of attendee')
   .action(async (meeting_id, email, first_name, last_name) => {
      console.log(`import ${first_name} ${last_name} <${email}> into meeting ${meeting_id}`);
      result = await sendRequest( () => {
         return axios.post(`/meetings/${meeting_id}/registrants`, {
            email: email,
            first_name: first_name,
            last_name: last_name,
            status: 'approved',
            auto_approve: appconfig['auto_approve']
         })
      });
      console.log(result.data);
   });

attendees.command('batch')
   .description('batch register attendees for meeting')
   .argument('<meeting_id>', 'id of the meeting')
   .argument('<attendee_csv>', 'CSV filename containing list of attendee email, first_name, last_name')
   .action(async (meeting_id, attendee_csv) => {
      console.log(`import ${attendee_csv} into meeting ${meeting_id}`);
      const csv = readFileSync(attendee_csv, 'utf8');
      let parsed = await neatCsv(csv);
      // NOTE: Max number of bulk registrants is 30.
      in_chunks(parsed, 30, async(csv_data) => {
         csv_data = csv_data.map((r) => { return {email: r.email, first_name: r.first_name, last_name: r.last_name} });
         let result = await sendRequest( () => {return axios.post(`/meetings/${meeting_id}/batch_registrants`, {
            auto_approve: appconfig['auto_approve'],
            registrants: csv_data
         })} );
         console.log(result.data);
      });

   });

attendees.command('list')
.description('list meeting registrants with given status (approved, pending, denied)')
.argument('<meeting_id>', 'id of the meeting')
.addArgument(
   new Argument('<status>', 'status to filter')
   .choices(['approved', 'pending', 'denied'])
).action(async (meeting_id, status) => {
   let result;
   console.log(`list ${status} registrants for meeting ${meeting_id}`);

   result = await sendRequest( () => {return axios.get(`/meetings/${meeting_id}/registrants?page_size=300&status=${status}`)} );
   if (result.data.registrants) {
      result.data.registrants.forEach(e => {
         console.log(`${e.id} ${e.status} ${e.first_name} ${e.last_name} <${e.email}>, ${e.join_url}`);
      })
   } else {
      console.log(result.data);
   }
});

attendees.command('delete')
   .description('delete single attendee from meeting')
   .argument('<meeting_id>', 'id of the meeting')
   .argument('<registrant_id>', 'attendee id. List registrants to find it.')
   .action(async (meeting_id, registrant_id) => {
      console.log(`delete ${registrant_id} from meeting ${meeting_id}`);
      result = await sendRequest( () => {
         return axios.delete(`/meetings/${meeting_id}/registrants/${registrant_id}`)
      });
      console.log(result.data);
      if (result.status && result.status == 204) {
         console.log('Deleted successfully.');
      }
   });

const appconfig = readAppConfig();

// Set request defaults
axios.defaults.baseURL = appconfig['base_url'];
axios.defaults.headers.common = requestHeaders(appconfig);
axios.defaults.headers.post['Content-Type'] = 'application/json';

program.parse(process.argv);