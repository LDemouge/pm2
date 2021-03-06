/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
// Inject custom modules
if (process.env.pmx !== "false") {
  require('pmx').init({
    transactions: process.env.km_link == 'true' && process.env.trace == 'true' || false,
    http: process.env.km_link == 'true' || false
  });
}

if (typeof(process.env.source_map_support) != "undefined" &&
    process.env.source_map_support !== "false") {
  require('source-map-support').install();
}

// Cron restart feature
if (process.env.cron_restart) {
  var cron_pattern = process.env.cron_restart;
  var cronJob = require('cron').CronJob;
  var job = new cronJob({
    cronTime: cron_pattern,
    onTick: function () {
      if (process.connected && process.send) {
        process.send({
          'cron_restart': 1
        });
      } else {
        process.exit(0);
      }
    },
    start: false
  });
  job.start();
}


// Rename the process
process.title = process.env.PROCESS_TITLE || 'node ' + process.env.pm_exec_path;

if (process.connected &&
    process.send &&
    process.versions &&
    process.versions.node)
  process.send({
    'node_version': process.versions.node
  });


// uid/gid management
if (process.env.uid || process.env.gid) {
  try {
    if (process.env.gid)
      process.setgid(process.env.gid);
    if (process.env.uid){
      process.initgroups(process.env.uid, process.env.uid);
      process.setgid(process.env.uid);
      process.setuid(process.env.uid);
    }
  } catch(e) {
    setTimeout(function() {
      console.error('%s on call %s', e.message, e.syscall);
      console.error('%s is not accessible', process.env.uid);
      return process.exit(1);
    }, 100);
  }
}

// Require the real application
if (process.env.pm_exec_path)
  require('module')._load(process.env.pm_exec_path, null, true);
else
  throw new Error('Could not _load() the script');

// Change some values to make node think that the user's application
// was started directly such as `node app.js`
process.mainModule = process.mainModule || {};
process.mainModule.loaded = false;
require.main = process.mainModule;
