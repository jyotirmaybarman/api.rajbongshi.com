import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUES } from './queue.constant';

@Injectable()
export class QueueService{

    constructor(@InjectQueue(QUEUES.DEFAULT_QUEUE) private defaultQueue: Queue){}

    async addJob<T>(job: T){
        return await this.defaultQueue.add(job);
    }
}