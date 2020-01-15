const path = require('path'); //'path';


require('dts-generator').default({
  name: '@oneline/core',
  main:  path.resolve(__dirname,'../lib'),
  project: path.resolve(__dirname, '../'),
  out: 'online-core.d.ts'
});