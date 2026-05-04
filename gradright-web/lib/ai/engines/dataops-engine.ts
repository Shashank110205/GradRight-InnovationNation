/**
 * DataOps engine (GEMINI_DATAOPS_API_KEY) — news normalization, deadline ingestion, crawlers.
 * Future: batch jobs + `student_profiles` as segmentation input only.
 */
export type DataopsEngineReadContext = {
  jobName: string;
};

export function describeDataopsEngine(): string {
  return "dataops";
}
