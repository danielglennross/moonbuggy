'use strict';

import { IResolver, Context, IModule } from '../../../schema';
import { module, exportSchema, exportResolvers, rule } from '../../../decorators';

const requestExists = (context: Context): boolean => !!context.request;

@module('Setting')
@exportSchema('basic')
@exportResolvers('settings')
class Setting implements IModule {

  @rule(requestExists)
  public settings(root: any, args: any, context: Context): IResolver {
    return [{
      id: 'setting1',
      value: 'value1',
    }, {
      id: 'setting2',
      value: 'value2',
    }];
  }

  public basic(): string {
    return `
      type Setting {
        id: String
        value: String
      }
    `;
  }

}

export default new Setting();
