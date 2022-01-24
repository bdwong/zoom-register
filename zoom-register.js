const { Command, CommanderError, Argument } = require('commander');
const fs = require('fs');
const neatCsv = require('neat-csv');

// Read app configuration
const appconfig = JSON.parse(fs.readFileSync('appconfig.json'));

// Read meeting registrants
function getRegistrants(filename) {
   const csv = fs.readFileSync(filename, 'utf8');
   return neatCsv(csv);
}

const program = new Command();
program.version('0.1.0');

const meetings = program.command('meetings')
   .description('operate on meetings')

meetings.command('list')
   .description('list names and ids of upcoming meetings')
   .action(async () => {
      console.log(`List meetings`);
   })

meetings.command('get')
   .description('get meeting information')
   .argument('<meeting_id>', 'id of the meeting')
   .action(async (meeting_id) => {
      console.log(`Get meeting ${meeting_id}`);
   })

const attendees = program.command('attendees')
   .description('operate on meeting attendees');

attendees.command('register')
   .description('register attendees for meeting')
   .argument('<meeting_id>', 'id of the meeting')
   .argument('<attendee_csv>', 'CSV filename containing list of attendee email, first_name, last_name')
   .action(async (meeting_id, attendee_csv) => {
      console.log(`import ${attendee_csv} into meeting ${meeting_id}`);
   });

program.parse(process.argv);