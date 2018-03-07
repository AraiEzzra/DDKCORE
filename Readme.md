# ETP
Describe brief description about ETP here

## Prerequisite for ETP system
This sections provides details on what you need install on your system in order to run ETP.

- ### Supported Plateforms:
```
Ubuntu 14.04 x86_64
Ubuntu 16.04 (LTS) x86_64
```

- ### Tool chain components -- Used for compiling dependencies
```
sudo apt-get install -y python build-essential curl automake autoconf libtool
```

- ### Git -- Used for cloning and updating ETP
```
sudo apt-get install -y git
```

- ### Node.js -- Node.js serves as the underlying engine for code execution.
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

- ### PostgreSQL (version 9.6.2) -- PostgreSQL is the database used for this application
```
curl -sL "https://downloads.lisk.io/scripts/setup_postgresql.Linux" | bash -
sudo -u postgres createuser --createdb $USER
sudo -u postgres createdb <database_name> //ETP_test in our system
sudo -u postgres psql -d <database_name> -c "alter user "$USER" with password 'password';"
```

- ### Installing Redis -- Redis is used for cached storage
Ubuntu/Debian:
```
sudo apt-get install redis-server
```
Start Redis:
```
service redis start
```
Stop Redis:
```
service redis stop
```
**NOTE:** ETP does not run on the redis default port of 6379. Instead it is configured to run on port: 6380. Because of this, in order for ETP to run, you have one of two options:

1. Change the Lisk configuration
Update the redis port configuration in both `config.json` and `test/data/config.json`. Note that this is the easiest option, however, be mindful of reverting the changes should you make a pull request.

2. Change the Redis launch configuration
Update the launch configuration file on your system. Note that their a number of ways to do this. The following is one way:

   1. Stop redis-server
   2. Edit the file `redis.conf` and change: `port 6379` to `port 6380`
   
    ```
        Ubuntu/Debian: /etc/redis/redis.conf
        MacOS: /usr/local/etc/redis.conf
    ```
3.  Start redis-server

Now confirm that redis is running on port 6380:
```
redis-cli -p 6380
ping
```

- ### Bower -- Bower helps to install required JavaScript dependencies.
```
npm install -g bower
```

- ### Grunt.js -- Grunt is used to compile the frontend code and serves other functions.
```
npm install -g grunt-cli
```

- ### Elasticsearch -- Elasticsearch is used for search optimization 
```
sudo apt-get install openjdk-8-jre
curl -L -O https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.2.2.deb
sudo dpkg -i elasticsearch-6.2.2.deb
sudo /etc/init.d/elasticsearch start
sudo service elasticsearch start
```

- ### Prometheus -- Prometheus is used to monitor app's performance
[Reference to install prometheus](https://prometheus.io/docs/prometheus/latest/installation/)

## ETP Installation
1. Clone code from GitHub
```
git clone https://github.com/oodlestechnologies/ETPCoin
```

2. Go to ETPCoin directory
```
cd ETPCoin/
git checkout develoment
```

3. Install module dependencies
```
npm install 
```

4. Create environment file
Create a new file i.e `.env` and place this file in root directory and put all required information. Please see sample file `.env_sample` file for ETP to work properly.

**NOTE:** You can place `.env` file according to your choice but make sure to provide path of this file in `app.js`.

## Set up UI for ETP
Inside your project directory `ETPCoin`, run following commands
```
git submodule init 
git submodule update
cd public 
npm install 
bower install 
grunt release
```

## Running application
Go to the project directory and run
```
node app.js
```

# ISSUES

**ERROR 1:**
```
You need to install postgresql-server-dev-X.Y for building a server-side extension or libpq-dev for building a client-side application. gyp: Call to '/usr/bin/pg_config --libdir' returned exit status 1 while in binding.gyp. while trying to load binding.gyp
```
Try to install below postgresql tools.
From your project directory, run following commands:
```
sudo apt-get install postgresql
sudo apt-get install python-psycopg2
sudo apt-get install libpq-dev
```

**ERROR 2:**
```
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
``` 
Install `appmetrics` module:    
From your project directory, run below command:
```
npm install appmetrics
```

**ERROR 3:**
```
Error: make nodesodium exited with code null
    at ChildProcess.<anonymous> (/home/andrea/node_modules/sodium/install.js:288:19)
    at emitTwo (events.js:106:13)
    at ChildProcess.emit (events.js:191:7)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:219:12)
```
Follow these steps:
1. remove sodium module from package.json
2. remove node_modules/ directory and run:
```
rm -rf ~/.node-gyp/
npm install
npm install sodium
```


**ERROR 4:**
```
error : TypeError: Cannot read property 'connection_options' of null
```

This is what you have not successfully connected redis on a port which application is using. Try to run `redis-cli -p <port here>`. It will throw an error: `could not connect to 127.0.01.1:<port here>`. Connection refused.
Try to check whether redis is installed/connected properly and run application again.



**ERROR 5:**
```
error : TypeError: Cannot read property '__appmetricsProbeAttached__' of null
```

Run Following commands:
```
dropdb ETP_test
createdb ETP_test
sudo -u postgres psql -d ETP_test -c "alter user "$USER" with password 'password';"
```

**ERROR 6:**
```
npm ERR! git clone --template=/root/.npm/_git-remotes/_templates..
npm ERR! Permission denied (publickey).
Or something else with github or publickey inside.
```

It is likely that git or ssh is not installed and configured. Follow below steps:

1. Run below command
```
sudo apt-get install git ssh
```
2. Generate a key pair for ssh 
```
ssh-keygen -t rsa
```
3. Open the just created public key with 
```
nano ~/.ssh/id_rsa.pub   //if not installed, first install nano
``` 
4. Create a new SSH key at the GitHub SSH keys settings page. Copy your public key into the key field and click on Add SSH key.

**ERROR 7:**
```
Error: Can't open display: (null) when using Xclip to copy ssh public key
```

1. Run below command
```
cat ~/.ssh/id_rsa.pub 
```
2. Copy this RSA key and add it to your github account in github -> settings -> SSH Keys and GPG Keysnano

**ERROR 8:** 
```
Failed to load http://<IP_ADDRESS>:9200/blocks/blocks/_search: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://<IP_ADDRESS>:7000' is therefore not allowed access.
```

If you have that in your config file, then you should have seen an exception when you restarted the node, because * has special meaning in YAML. You should set your config as follows:

1. Edit your config file
```
sudo nano /etc/elasticsearch/elasticsearch.yml
```

2. Set below configurations if not set already
```
http.cors.enabled: true
http.cors.allow-origin: "*"

```

3. Restart the server
```
sudo service elasticsearch restart
```

**ERROR 9:** 
```
ERROR: syntax error at or near "'hotam-singh'" 
LINE 1: alter user 'hotam-singh' with password 'password';
```

Follow below steps:
1. Open postgreSQL from terminal
```
sudo -su postgres psql 
```
2. Insert your sudo password
3. Run command:
```
ALTER USER "hotam-singh" with password 'password' ;
```

**ERROR 10:** 
```
curl: (7) Failed to connect to 127.0.0.1 port 9200: Connection refused
```

Follow below steps:
1. Check the status of elasticsearch server
```
sudo service elasticsearch status
```

2. We'll get the status like:
```
Loaded# ERROR 10:/Active state or the reason why elasticsearch not connecting to default port.
● elasticsearch.service - Elasticsearch
   Loaded: loaded (/usr/lib/systemd/system/elasticsearch.service; disabled; vendor preset: enabled)
   Active: failed (Result: exit-code) since Mon 2018-02-12 11:48:14 IST; 2s ago
     Docs: http://www.elastic.co
  Process: 11315 ExecStart=/usr/share/elasticsearch/bin/elasticsearch -p ${PID_DIR}/elasticsearch.pid --quiet (code=exited, status=1/FAILURE)
 Main PID: 11315 (code=exited, status=1/FAILURE)

Feb 12 11:48:14 hotamsingh elasticsearch[11315]: Exception in thread "main" 2018-02-12 11:48:14,564 main ERROR No log4j2 configuration file fou
Feb 12 11:48:14 hotamsingh elasticsearch[11315]: SettingsException[Failed to load settings from [elasticsearch.yml]]; nested: MarkedYAMLExcepti
Feb 12 11:48:14 hotamsingh elasticsearch[11315]:  in 'reader', line 92, column 25:
Feb 12 11:48:14 hotamsingh elasticsearch[11315]:     http.cors.allow-origin: *
Feb 12 11:48:14 hotamsingh elasticsearch[11315]:                             ^
Feb 12 11:48:14 hotamsingh elasticsearch[11315]: expected alphabetic or numeric character, but found
Feb 12 11:48:14 hotamsingh elasticsearch[11315]:  in 'reader', line 92, column 26:
Feb 12 11:48:14 hotamsingh systemd[1]: elasticsearch.service: Main process exited, code=exited, status=1/FAILURE
Feb 12 11:48:14 hotamsingh systemd[1]: elasticsearch.service: Unit entered failed state.
Feb 12 11:48:14 hotamsingh systemd[1]: elasticsearch.service: Failed with result 'exit-code'.
```

3. Update `/etc/elasticsearch/elasticsearch.yml` file.
```
sudo nano /etc/elasticsearch/elasticsearch.yml 
```
4. Set  `http.cors.allow-origin` to "*"
5. You can check status again. It will show active state
```
sudo service elasticsearch status
```
You will get the status like:
```
● elasticsearch.service - Elasticsearch
   Loaded: loaded (/usr/lib/systemd/system/elasticsearch.service; disabled; vendor preset: enabled)
   Active: active (running) since Mon 2018-02-12 12:02:52 IST; 14s ago
     Docs: http://www.elastic.co
 Main PID: 12293 (java)
   CGroup: /system.slice/elasticsearch.service
           └─12293 /usr/bin/java -Xms1g -Xmx1g -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFraction=75 -XX:+UseCMSInitiatingOccupancyOnly

Feb 12 12:02:52 hotamsingh systemd[1]: Started Elasticsearch.
```

# Contributors
[https://github.com/oodlestechnologies/ETPCoin/graphs/contributors](https://github.com/oodlestechnologies/ETPCoin/graphs/contributors)

# License
License info here

# Authors 

- Hotam Singh <hotam.singh@oodlestechnologies.com>
- Navin Purohit <navin.purohit@oodlestechnologies.com>
- Monu Thakur <monu.thakur@oodlestechnologies.com>

