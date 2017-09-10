'use strict';

import { module, rule, Schema, Resolver, name, exportOnly } from '../../../decorators';

const requestExists = (context: any): boolean => !!context;

@module('Setting')
class Setting {

  @Resolver(name('getSettings'), exportOnly())
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

  @Schema()
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
