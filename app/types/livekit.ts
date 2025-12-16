export type JobStatus = {
  id?: string;
  status?: string;
  workerId?: string;
};

export type DispatchSummary = {
  id?: string;
  state?: string;
  jobCount?: number;
  jobStatuses?: JobStatus[];
  error?: string;
};
