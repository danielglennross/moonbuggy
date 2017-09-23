import 'reflect-metadata';

import { Tag, SimpleTag, OptionsTag } from './types';
import { getNonEnumerableEntries } from '../utils/objectExt';
import { ImportModule, Resolver, $moduleName, $importResolvers } from '../schema';

class ModuleOption {
  public importResolvers: ImportModule[];
  public name: string;
}

type ModuleOptionFn = (option: ModuleOption) => void;

export function imports(moduleName: string, resolvers: string[]): ModuleOptionFn {
  return function(option: ModuleOption) {
    const importResolver: ImportModule = { moduleName, resolverNames: resolvers };
    option.importResolvers = [...option.importResolvers || [], importResolver];
  };
}

export function module(...options: ModuleOptionFn[]) {
  return function(target: Object) {
    const moduleOption: ModuleOption = {
      importResolvers: [],
      name: (target as any).name,
    };

    options.forEach(o => o(moduleOption));

    target[$moduleName] = moduleOption.name;
    target[$importResolvers] = moduleOption.importResolvers;

    const obj: any = (target as any).prototype;

    getNonEnumerableEntries(obj).forEach(([key, value]: any) => {
      function attachMetaDataToModule(m: Tag) {
        m.match({
          SimpleTag: (meta: SimpleTag) => {
            target[m.type] = [...target[m.type] || [], key];
          },
          OptionsTag: (meta: OptionsTag) => {
            target[m.type] = [...target[m.type] || [], (<Resolver>{
              field: key,
              name: meta.name || key,
              export: meta.export,
            })];
          },
        });
      }

      const graphQLMeta: Tag = Reflect.getMetadata('design:graphqlmeta', obj, key);
      if (graphQLMeta) {
        attachMetaDataToModule(graphQLMeta);
      }
    });
  };
}
