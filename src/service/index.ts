import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  chain,
  mergeWith,
  template,
  url,
  move,
  filter,
  noop,
  MergeStrategy
} from "@angular-devkit/schematics";
import { join } from "@angular-devkit/core";
import { strings } from "../utils/strings";
import { Schema as ServiceOptions } from "./schema";
import { setupOptions } from "../utils/setup";
import { constants } from "../utils/constants";

/**
 * Creates a Service.
 * @param {Schema} options
 * @returns {Rule}
 */
export function service(options: ServiceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    setupOptions(host, options);
    // defaults
    options.operations = options.operations ? options.operations : "clrud";
    options.endpoint = options.endpoint
      ? options.endpoint
      : strings.dasherize(options.name);
    options.vo = options.vo ? options.vo : options.name;
    options.voPath = options.voPath
      ? options.voPath
      : join(
          options.path,
          constants.voFolder,
          strings.dasherize(strings.singularize(options.vo))
        );

    const movePath = options.flat
      ? join(options.path, constants.servicesFolder)
      : join(
          options.path,
          constants.servicesFolder,
          strings.dasherize(strings.pluralize(options.name))
        );

    // get template source
    const templateSource = apply(url("./files"), [
      options.spec
        ? noop()
        : filter(path => !path.endsWith(constants.specFileExtension)),
      template({
        ...strings,
        "if-flat": (s: string) => (options.flat ? "" : s),
        ...options
      }),
      move(movePath)
    ]);

    const rule = chain([mergeWith(templateSource, MergeStrategy.Default)]);
    return rule(host, context);
  };
}
