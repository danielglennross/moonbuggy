'use strict';

import { getBundle, Options, Bundle } from '../bundler';

const options: Options = {
  root: `${__dirname}/modules`,
  moduleFilename: 'index',
};

const bundle: Bundle = getBundle(options);
