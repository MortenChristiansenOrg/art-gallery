import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "check stuck image processing",
  { minutes: 5 },
  internal.processing.checkStuck
);

export default crons;
