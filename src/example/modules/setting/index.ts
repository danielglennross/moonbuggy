'use strict';

import {
  rule,
  schema,
  resolver,
  name,
  exportOnly,
} from '../../../moonbuggy/index';

const requestExists = (context: any): boolean => !!context;

class Setting {

  @resolver(name('getSettings'), exportOnly())
  @rule(requestExists)
  public settings(root: any, args: any, context: any) {
    return [{
      id: 'setting1',
      value: 'value1',
    }, {
      id: 'setting2',
      value: 'value2',
    }];
  }

  @schema()
  public basic() {
    return `
      type Setting {
        id: String
        value: String
      }
    `;
  }

}

export default new Setting();
