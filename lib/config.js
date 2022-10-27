const { mkdirSync, readFileSync, copyFileSync } = require('fs');
const path = require('path');

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

module.exports = {
   appconfig: readAppConfig()
}
