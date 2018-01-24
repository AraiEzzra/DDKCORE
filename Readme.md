# Prerequisite for ETP system

## Supported Plateforms:
Ubuntu 14.04 x86_64
Ubuntu 16.04 (LTS) x86_64

## Tool chain components -- Used for compiling dependencies
$ sudo apt-get install -y python build-essential curl automake autoconf libtool

## Git -- Used for cloning and updating ETP
$ sudo apt-get install -y git

## Node.js -- Node.js serves as the underlying engine for code execution.
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt-get install -y nodejs

## Install PostgreSQL (version 9.6.2)
$ curl -sL "https://downloads.lisk.io/scripts/setup_postgresql.Linux" | bash -
$ sudo -u postgres createuser --createdb $USER
$ sudo -u postgres createdb <database_name> //ETP_test in our system
$ sudo -u postgres psql -d <database_name> -c "alter user "$USER" with password 'password';"

## Bower -- Bower helps to install required JavaScript dependencies.
$ npm install -g bower

## Grunt.js -- Grunt is used to compile the frontend code and serves other functions.
$ npm install -g grunt-cli


# ETP Installation

## Clone code from GitHub
$ git clone https://github.com/oodlestechnologies/ETPCoin

## Go to ETPCoin directory
$ cd ETPCoin/

## Install module dependencies
$ npm install 

# Set up UI for ETP
Inside your project directory "ETPCoin", run following commands
$ git submodule init 
$ git submodule update
$ cd public 
$ npm install 
$ bower install 
$ grunt release




# ISSUES :
## ERROR 1:
You need to install postgresql-server-dev-X.Y for building a server-side extension or libpq-dev for building a client-side application. gyp: Call to '/usr/bin/pg_config --libdir' returned exit status 1 while in binding.gyp. while trying to load binding.gyp

Solution:
// from your project directory, run following commands:
$ sudo apt-get install postgresql
$ sudo apt-get install python-psycopg2
$ sudo apt-get install libpq-dev


## ERROR 2:
throw err;
    ^
    Error: Cannot find module './appmetrics'
    at Function.Module._resolveFilename (module.js:536:15)
    at Function.Module._load (module.js:466:25)
    at Module.require (module.js:579:17)
    at require (internal/module.js:11:18)
    at Object.<anonymous> (/home/rajwadhwa/project/ETPCoin/node_modules/appmetrics/index.js:23:13)
    at Module._compile (module.js:635:30)
    at Object.Module._extensions..js (module.js:646:10)
    at Module.load (module.js:554:32)
    at tryModuleLoad (module.js:497:12)
    at Function.Module._load (module.js:489:3)
 
Solution:   
// from your project directory, run following commands:
$ npm install appmetrics



## ERROR 3:
Error: make nodesodium exited with code null
    at ChildProcess.<anonymous> (/home/andrea/node_modules/sodium/install.js:288:19)
    at emitTwo (events.js:106:13)
    at ChildProcess.emit (events.js:191:7)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:219:12)

Solution:
remove sodium module from package.json
remove node_modules/ directory and run:
$ rm -rf ~/.node-gyp/
$ npm install
$ npm install sodium



## ERROR 4:
error : TypeError: Cannot read property 'connection_options' of null

Solution:
This is what you have not successfully connected redis on a port which application is using. Try to run redis-cli -p <port number>
It will throw an error:
could not connect to 127.0.01.1:<port here> . Connection refused.
Try to check whether redis is installed/connected properly and run application again.



## ERROR 5:
error : TypeError: Cannot read property '__appmetricsProbeAttached__' of null

Solution:
drop ETP_test database and recreate ETP_test 
Run Following commands:
dropdb ETP_test
createdb ETP_test
sudo -u postgres psql -d ETP_test -c "alter user "$USER" with password 'password';"

## ERROR 6:
npm ERR! git clone --template=/root/.npm/_git-remotes/_templates..
npm ERR! Permission denied (publickey).
Or something else with github or publickey inside.

Solution:
It is likely that git or ssh is not installed and configured.

Step 1: Run below command
$ sudo apt-get install git ssh
Step 2: Generate a key pair for ssh 
$ ssh-keygen -t rsa
Step 3: Open the just created public key with 
$ nano ~/.ssh/id_rsa.pub // if not installed, first install nano
Step 4: Create a new SSH key at the GitHub SSH keys settings page. Copy your public key into the key field and click on Add SSH key.

## ERROR 7:
Error: Can't open display: (null) when using Xclip to copy ssh public key

Solution:
Run $ cat ~/.ssh/id_rsa.pub from terminal and copy RSA key
example: 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCiTtK0fIgrNK0YCLb2m5pFQ/7vUNVDZ+ru1KNdVwj1FwH5RfVGlgF1TWww9gIQ2vdhQFPD26HstTNuFoQCA67x506CcC+fY3hdMhSQ6vBC9YuBHX0gBoc+nq1OS18wCjLtpLHwE2ZeQ6N7ZnQekDayxWLmxKnWNQZtBx1up0ov8+kjC3Q0PVnqsxjj54FJuRmNcxAvGv+Xj8T4+Xt4aC0nTAd7andMcwbN4lB42NKcooS4zDWPK3wWxrY9FdoKSEc1/h8lbsBoWpXsZ+yK3qCsuD0u7SfdgTMRQosME0VlF/wT9WlLPe+Z08vIZluChDZq5UyTcT1PRpSYkhJt9gn9 

Copy this RSA key and add it to your github account in github->settings->SSH Keys and GPG Keysnano

## Authors

- Hotam Singh <hotam.singh@oodlestechnologies.com>
- Navin Purohit <navin.purohit@oodlestechnologies.com>
- Monu Thakur <monu.thakur@oodlestechnologies.com>

