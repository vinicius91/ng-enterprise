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
import { normalize, join } from "@angular-devkit/core";
import { strings } from "../utils/strings";
import { Schema as ViewOptions } from "./schema";
import { setupOptions } from "../utils/setup";
import { constants } from "../utils/constants";
import {
  addImportToNgModule,
  addRouteToAppRoutingModule,
  findRoutingModuleFromOptions
} from "../utils/module-utils";

export enum VIEW_OPTION {
  Blank = "blank",
  List = "list",
  DETAILS = "details",
  FORM = "form",
  TABLE = "table"
}

export const VIEW_OPTIONS = [
  VIEW_OPTION.Blank,
  VIEW_OPTION.List,
  VIEW_OPTION.DETAILS,
  VIEW_OPTION.FORM,
  VIEW_OPTION.TABLE
];

/**
 * Adds the import into the core module for eager loading.
 * @param {Schema} options
 * @returns {Rule}
 */
function importIntoCoreModule(options: ViewOptions): Rule {
  return (host: Tree) => {
    options.module = `${options.path}${constants.coreModule}`;
    const classifiedName = `${strings.classify(options.name)}Module`;
    addImportToNgModule(host, options, classifiedName);
    return host;
  };
}

/**
 * Adds the route into the app.routing.ts file for lazy loading.
 * @param options
 * @returns {Rule}
 */
function addToAppRouting(options: ViewOptions): Rule {
  return (host: Tree) => {
    // @ts-ignore
    options.module = findRoutingModuleFromOptions(host, options);
    addRouteToAppRoutingModule(host, options);
    return host;
  };
}

/**
 * Creates a Service.
 * @param {Schema} options
 * @returns {Rule}
 */
export function simpleModule(options: ViewOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    setupOptions(host, options);

    options.template =
      VIEW_OPTIONS.indexOf(options.template) >= 0
        ? options.template
        : VIEW_OPTION.Blank;
    options.basePath = options.eager
      ? normalize(strings.dasherize(options.name))
      : normalize("");
    const movePath = options.flat
      ? join(options.path, constants.viewsFolder)
      : join(
          options.path,
          constants.viewsFolder,
          strings.dasherize(options.name)
        );

    const templateOptions = {
      ...strings,
      "if-flat": (s: string) => (options.flat ? "" : s),
      ...options
    };

    const rule = chain([
      noop(),
      noop(),
      mergeWith(
        apply(url("./files/"), [
          options.spec
            ? noop()
            : filter(path => !path.endsWith(constants.specFileExtension)),
          template(templateOptions),
          move(movePath)
        ]),
        MergeStrategy.Default
      ),
      options.eager ? importIntoCoreModule(options) : addToAppRouting(options)
    ]);
    return rule(host, context);
  };
}
