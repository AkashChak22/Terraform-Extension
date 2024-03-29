import tasks = require('azure-pipelines-task-lib/task');
import {ParentCommandHandler} from './parent-handler';
import path = require('path');

tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

async function run() {
    let parentHandler = new ParentCommandHandler();
    try {
        await parentHandler.execute(tasks.getInput("provider"), tasks.getInput("command"));
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();