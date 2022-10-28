# zoom-register

Command-line tool to register meeting attendees to a Zoom meeting from a CSV file.

## Installation

Download the executable for Windows, Mac, or Linux from [the zoom-register Releases page](https://github.com/bdwong/zoom-register/releases).

## Configuration

The first time you run zoom-register, it will ask you for an API key and API secret. You can find your Zoom JWT key and secret by logging into the [Zoom developer portal](https://developers.zoom.us/) with developer or admin permissions. If you do not have a key and secret, you can generate one by creating a JWT application in Zoom. See the developer documentation for more details.

If you need to change the API key later you can run the `zoom-register configure` command.

## Usage

You can run `zoom-register` to see a list of commands. Commands are further divided into subcommands. Run a command to see more information about it.

e.g. `zoom-register meetings` or `zoom-register attendees`.

### Get a Meeting ID

You can list upcoming non-recurring meetings with the following command:

```sh
zoom-register meetings list my_email@example.com
```

Use the desired meeting id for subsequent registration commands.

### Register Single User

Run `zoom-register attendees single` to register a single user.

```sh
zoom-register attendees single 12345678 registrant@example.com Firstname Lastname
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
zoom-register attendees batch 12345678 attendees.csv
```

By default, registered users will be in a 'pending' state, and will need to be manually approved.

***NOTE: If you register attendees with auto-approve set to true, then newly registered attendees will not receive a confirmation email.*** Auto-approve is configurable in `appconfig.json` and is set to false by default.

## For Developers

Requires Node.js. Known working on Node 14+.

Clone the repository and run `npm install` to install dependencies.

### Build

run `npm run build` to build the executables. They will be packaged into the `build` directory.

### Manual Configuration

The configuration file is stored in the user's home directory, under `~/.config/zoom-register/appconfig.json`.
The default configuration is shown below:

```json
{
   "base_url": "https://api.zoom.us/v2",
   "api_key": "YOUR_JWT_API_KEY_HERE",
   "api_secret": "YOUR_JWT_SECRET_HERE",
   "auto_approve": false
}
```
## Notes

- API call to add registrants to meeting: https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingregistrantcreate
- Creating a JWT app: https://marketplace.zoom.us/docs/guides/build/jwt-app
- Auth JWT guide with Zoom: https://marketplace.zoom.us/docs/guides/auth/jwt
- Somebody's try to invite multiple attendees programmatically: https://devforum.zoom.us/t/invite-multiple-attendees/18000
