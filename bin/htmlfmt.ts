#!/usr/bin/env node
import {createReadStream} from 'fs';
import {logger, Level} from 'loge';
import * as optimist from 'optimist';

import {Parser, XMLSerializer} from '../index';

let argvparser = optimist
  .usage('Usage: htmlfmt page.html')
  // .example('curl https://www.google.com/ | htmlfmt')
  .options({
    limit: {
      describe: 'maximum element length to inline',
      default: 60,
    },
    lower: {
      describe: 'convert tag names to lowercase',
      type: 'boolean',
    },
    // script meta commands
    help: {
      describe: 'print this help message',
      alias: 'h',
      type: 'boolean',
    },
    verbose: {
      describe: 'print debugging information',
      alias: 'v',
      type: 'boolean',
    },
    version: {
      describe: 'print version',
      type: 'boolean',
    },
  });

let argv = argvparser.argv;
logger.level = argv.verbose ? Level.debug : Level.info;

if (argv.help) {
  argvparser.showHelp();
}
else if (argv.version) {
  console.log(require('../package').version);
}
else {
  // process.stdin.isTTY is set to `true` when nothing is piped into htmlfmt
  logger.debug('STDIN=%s', process.stdin['isTTY'] ? 'TTY' : 'pipe');
  argv = argvparser.check(function(argv) {
    if (process.stdin['isTTY'] && argv._.length < 1) {
      throw new Error('You must either pipe in HTML content or specify a filename as a positional argument.');
    }
    return true;
  }).argv;
  // use STDIN if available (if not TTY), otherwise use the first positional  command line argument
  const readableStream = (!process.stdin['isTTY'] ? process.stdin : createReadStream(argv._[0]));
  readableStream.pipe(new Parser({lowerCaseTags: argv.lower === true})).on('finish', function() {
    logger.debug('document=%j', this.document);
    const xmlSerializer = new XMLSerializer('  ', argv.limit);
    const formattedHTML = xmlSerializer.serializeToString(this.document);
    process.stdout.write(formattedHTML);
    process.stdout.write('\n');
  });
}
