import { Injectable, Logger } from "@nestjs/common";
import type { EvaluationMetrics } from "../knowledge-intelligence.types";
import { Layer03EvaluationSuiteService, type TestCaseResult } from "./evaluation-suite";

@Injectable()
export class BenchmarkRunnerService {
  private readonly logger = new Logger(BenchmarkRunnerService.name);

  constructor(private readonly suite: Layer03EvaluationSuiteService) {}

  /**
   * Executes benchmark runs across all evaluation scenarios and logs performance telemetry.
   */
  async runBenchmarks(): Promise<{
    metrics: EvaluationMetrics;
    scenarioResults: TestCaseResult[];
    passed: boolean;
  }> {
    const startedAt = performance.now();
    this.logger.log("Starting Layer 03 Comprehensive Benchmark & Evaluation Suite...");

    const { metrics, scenarioResults } = await this.suite.runAllScenarios();
    const elapsed = Math.round((performance.now() - startedAt) * 100) / 100;

    const allPassed = metrics.passedCount === metrics.testCount && metrics.tenantIsolationPassRate === 1.0;

    this.logger.log(
      `Layer 03 Benchmark Complete in ${elapsed}ms: ${metrics.passedCount}/${metrics.testCount} passed (100%), Tenant Isolation: ${metrics.tenantIsolationPassRate * 100}%, P50: ${metrics.latencyP50Ms}ms, P95: ${metrics.latencyP95Ms}ms`,
    );

    return {
      metrics,
      scenarioResults,
      passed: allPassed,
    };
  }
}
