import 'reflect-metadata';

import { rulePredicate } from './types';
import { getNonEnumerableEntries, tuple } from '../utils/objectExt';

interface IField {
  name: string;
  rule: rulePredicate;
}

export function field(name: string, rule: rulePredicate): IField  {
  return { name, rule };
}

export function inputMapper(inputName: string, ...fields: IField[])
  : (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

export function inputMapper(inputName: string, error: Error, ...fields: IField[])
  : (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

export function inputMapper(inputName: string, errorOrField: Error | IField, ...fields: IField[]) {
  let error: Error = null;
  if (errorOrField instanceof Error) {
    error = errorOrField;
  } else {
    fields = [errorOrField as IField, ...fields];
  }

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]): Promise<any> {
      const [ root, data, context, paramInfo ] = args;

      const inputs = getNonEnumerableEntries(data[inputName]).filter(([, v]: any) => Boolean(v));
      if (inputs.length !== 1) {
        throw new Error('Only one field is allowed in an input union');
      }

      const [fieldName] = inputs[0];
      const mapping = fields.find(f => f.name === fieldName);
      if (!mapping) {
        throw new Error(`Cannot find type matcher for: "${fieldName}"`);
      }

      const [ok, err] = await tuple(mapping.rule(context));
      if (err || !ok) {
        throw error || new Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, [
        root,
        Object.assign(data, { [inputName]: data[inputName][fieldName] }),
        context,
        paramInfo,
      ]);

      return result;
    };
    return descriptor;
  };
}
