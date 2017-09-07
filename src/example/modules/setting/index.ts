'use strict';

import { Context } from '../../../schema';
import { module, rule, Schema, ExportResolver } from '../../../decorators';

const requestExists = (context: Context): boolean => !!context.request;

@module('Setting')
class Setting {

  @ExportResolver('getSettings')
  @rule(requestExists)
  public settings(root: any, args: any, context: Context) {
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
