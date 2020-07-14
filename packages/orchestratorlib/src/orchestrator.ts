/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {OrchestratorAdd} from './add';
import {OrchestratorBuild} from './build';
import {OrchestratorCreate} from './create';
import {OrchestratorEvaluate} from './evaluate';
import {OrchestratorFineTune} from './finetune';
import {OrchestratorNlr} from './nlr';
import {OrchestratorPredict} from './predict';
import {OrchestratorTest} from './test';

export class Orchestrator {
  public static async createAsync(nlrPath: string, inputPath: string, outputPath: string, hierarchical: boolean = false) {
    await OrchestratorCreate.runAsync(nlrPath, inputPath, outputPath, hierarchical);
  }

  // eslint-disable-next-line max-params
  public static async addAsync(nlrPath: string, inputPath: string, outputPath: string, snapshotPath: string, labelPrefix: string = "") {
    await OrchestratorAdd.runAsync(nlrPath, inputPath, outputPath, snapshotPath, labelPrefix);
  }

  public static async buildAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorBuild.runAsync(nlrPath, inputPath, outputPath);
  }

  public static async evaluateAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorEvaluate.runAsync(nlrPath, inputPath, outputPath);
  }

  public static async fineTuneAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorFineTune.runAsync(nlrPath, inputPath, outputPath);
  }

  public static async NlrAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorNlr.runAsync(nlrPath, inputPath, outputPath);
  }

  public static async predictAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorPredict.runAsync(nlrPath, inputPath, outputPath);
  }

  public static async testAsync(nlrPath: string, inputPath: string, outputPath: string) {
    await OrchestratorTest.runAsync(nlrPath, inputPath, outputPath);
  }
}
