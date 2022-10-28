const { mkdirSync, readFileSync, copyFileSync, writeFileSync } = require('fs');
const path = require('path');
const prompt = require('prompt');

function config_dir() {
   const path = require('path');
   const os = require('os');
   return path.join(os.homedir(), '.config', 'zoom-register');
}

function config_filepath() {
   return path.join(config_dir(), 'appconfig.json');
}

function config_template_path() {
   return path.join(__dirname, '..', 'appconfig.sample.json');
}

function configure() {
   mkdirSync(config_dir(), {recursive: true})
   let src = config_template_path();
   let dst = config_filepath();

   console.log(`Copying template config from ${src} to ${dst}`);
   copyFileSync(src, dst);
   return JSON.parse(readFileSync(dst));
}

async function editConfig(appconfig) {
   await editApiKey(appconfig);
   writeAppConfig(appconfig);
   return appconfig;
}

async function editApiKey(appconfig) {
      console.log(
         'You will need a Zoom JWT key and secret that can be created or\n' +
         'found on the Zoom developer portal (https://developers.zoom.us/).\n' +
         'See https://github.com/bdwong/zoom-register#readme for more information.\n'
      );
      console.log(
         'You can run the configure command again if you receive\n' +
         'an "Invalid access token." error.\n'
      );
      prompt.message = 'configure';
   prompt.start();
   let result = await prompt.get([ //{api_key, api_secret}
      {
         name: 'api_key',
         description: `Enter your Zoom API Key`,
         default: appconfig.api_key
      },
      {
         name: 'api_secret',
         description: `Enter your Zoom API Secret`,
         default: appconfig.api_secret
      },
   ]);
   // Deep merge not required, so we don't need lodash.merge
   Object.assign(appconfig, result);
}

function writeAppConfig(appconfig) {
   writeFileSync(config_filepath(), JSON.stringify(appconfig, undefined, 3));
}

// Read app configuration
function readAppConfig() {
   let config_data;
   try {
      config_data = JSON.parse(readFileSync(config_filepath()));
   } catch(err) {
      config_data = configure();
   }
   return config_data;
}

module.exports = {
   appconfig: readAppConfig(),
   editConfig
}
