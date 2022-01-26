const { Command, CommanderError, Argument } = require('commander');
const fs = require('fs');
const neatCsv = require('neat-csv');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { memoryUsage } = require('process');

// Read app configuration
const appconfig = JSON.parse(fs.readFileSync('appconfig.json'));

// Read meeting registrants
function getRegistrants(filename) {
   const csv = fs.readFileSync(filename, 'utf8');
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

const program = new Command();
program.version('0.1.0');

const meetings = program.command('meetings')
   .description('operate on meetings')

meetings.command('list')
   .description('list names and ids of upcoming (non-recurring) meetings')
   .argument('<user_id>', 'id or email of user to query')

   .action(async (user_id) => {
      console.log(`List meetings`);
      result = await sendRequest( () => {return axios.get(`/users/${user_id}/meetings`)} );
      // if (result.data.meetings) {
      //    console.log('Approved registrants:');
      //    result.data.registrants.forEach(e => {
      //       console.log(`${e.first_name} ${e.last_name} <${e.email}>, ${e.join_url}`);
      //    })
      // } else {
      //    console.log(result.data);
      // }
      console.log(result.data);
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
            status: 'approved'
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
      let csv_data = neatCsv(attendee_csv)
      let result = await sendRequest( () => {return axios.post(`/meetings/${meeting_id}/batch_registrants`, csv_data)} );
      console.log(result.data);
   });

attendees.command('list')
   .description('list meeting registrants and links')
   .argument('<meeting_id>', 'id of the meeting')
   .action(async (meeting_id) => {
      let result;
      console.log(`list registrants for meeting ${meeting_id}`);

      result = await sendRequest( () => {return axios.get(`/meetings/${meeting_id}/registrants?page_size=300&status=approved`)} );
      if (result.data.registrants) {
         console.log('Approved registrants:');
         result.data.registrants.forEach(e => {
            console.log(`${e.first_name} ${e.last_name} <${e.email}>, ${e.join_url}`);
         })
      } else {
         console.log(result.data);
      }
   });

// Set request defaults
axios.defaults.baseURL = appconfig['base_url'];
axios.defaults.headers.common = requestHeaders(appconfig);
axios.defaults.headers.post['Content-Type'] = 'application/json';

program.parse(process.argv);