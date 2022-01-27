# zoom-register

Register meeting attendees to a Zoom meeting from a CSV file.

## Configuration

Copy the `appconfig.sample.json` to `appconfig.json` and edit. You can find your Zoom JWT key and secret by logging into the [Zoom developer portal](https://developers.zoom.us/) with developer or admin permissions. If you do not have a key and secret, you can generate one by creating a JWT application in Zoom. See the developer documentation for more details.

```json
{
   "base_url": "https://api.zoom.us/v2",
   "api_key": "YOUR_JWT_API_KEY_HERE",
   "api_secret": "YOUR_JWT_SECRET_HERE",
   "auto_approve": false
}
```

## Usage

You can run `node zoom-register` to see a list of commands. Commands are further divided into subcommands. Run a command to see more information about it.

e.g. `node zoom-register meetings` or `node zoom-register attendees`.

### Get a Meeting ID

You can list upcoming non-recurring meetings with the following command:

```sh
node zoom-register meetings list my_email@example.com
```

Use the desired meeting id for subsequent registration commands.

### Register Single User

Run `zoom-register attendees single` to register a single user.

```sh
node zoom-register attendees single 12345678 registrant@example.com Firstname Lastname
```

By default, registered users will be in a 'pending' state, and will need to be manually approved.

***NOTE: If you register attendees with auto-approve set to true, then newly registered attendees will not receive a confirmation email.*** Auto-approve is configurable in `appconfig.json` and is set to false by default.



### Batch Register Users

To register a batch of attendees, prepare a CSV (Comma Separated Value) file as follows. The first line is required as a CSV header. Subsequent lines are for registrant data, one line per registrant:

```csv
"firstName","lastName","email"
"First1","Last1","first1.last1@example.com"
"First2","Last2","first2.last2@example.com"
```

Then run `zoom-register` to perform batch registration:

```sh
node zoom-register attendees batch 12345678 attendees.csv
```

By default, registered users will be in a 'pending' state, and will need to be manually approved.

***NOTE: If you register attendees with auto-approve set to true, then newly registered attendees will not receive a confirmation email.*** Auto-approve is configurable in `appconfig.json` and is set to false by default.

## Notes

- API call to add registrants to meeting: https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingregistrantcreate
- Creating a JWT app: https://marketplace.zoom.us/docs/guides/build/jwt-app
- Auth JWT guide with Zoom: https://marketplace.zoom.us/docs/guides/auth/jwt
- Somebody's try to invite multiple attendees programmatically: https://devforum.zoom.us/t/invite-multiple-attendees/18000
