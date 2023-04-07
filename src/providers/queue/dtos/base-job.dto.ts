import { QueueJobs } from '../queue.jobs';

export class BaseJobDto{
    task: keyof QueueJobs;
}