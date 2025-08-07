import { Rule } from '@angular-devkit/schematics';
import { Schema } from '../schema';
/**
 * Patches `app.config.ts` by adding our provider
 */
export declare function addChartsProviderToMain(options: Schema): Rule;
