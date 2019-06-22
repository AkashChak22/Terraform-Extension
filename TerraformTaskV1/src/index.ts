import tasks = require('azure-pipelines-task-lib/task');
import {Container, interfaces} from './../node_modules/inversify';
import 'reflect-metadata';
import {ParentCommandHandler, IParentCommandHandler, ParentCommandHandlerInterfaces} from './parent-handler';
import {ITerraformCommandHandler, CommandHandlerInterfaces} from './terraform-command-handler';
import {TerraformCommandHandlerAzureRM} from './azure-terraform-command-handler';
import {TerraformCommandHandlerAWS} from './aws-terraform-command-handler';
import {TerraformCommandHandlerGCP} from './gcp-terraform-command-handler';
import { ITerraformToolHandler, TerraformInterfaces, TerraformToolHandler } from './terraform';

let container = new Container();

container.bind<Container>("container").toConstantValue(container);
container.bind<IParentCommandHandler>(ParentCommandHandlerInterfaces.IParentCommandHandler).to(ParentCommandHandler);
container.bind<ITerraformCommandHandler>(CommandHandlerInterfaces.ITerraformCommandHandler).to(TerraformCommandHandlerAzureRM).whenTargetNamed("azurerm");
container.bind<ITerraformCommandHandler>(CommandHandlerInterfaces.ITerraformCommandHandler).to(TerraformCommandHandlerAWS).whenTargetNamed("aws");
container.bind<ITerraformCommandHandler>(CommandHandlerInterfaces.ITerraformCommandHandler).to(TerraformCommandHandlerGCP).whenTargetNamed("gcp");
container.bind<ITerraformToolHandler>(TerraformInterfaces.ITerraformToolHandler).toDynamicValue((context: interfaces.Context) => new TerraformToolHandler(tasks));

tasks.debug("Task Execution begins");
let parentHandler = container.get<IParentCommandHandler>(ParentCommandHandlerInterfaces.IParentCommandHandler);
parentHandler.execute(tasks.getInput("provider"), tasks.getInput("command"))
    .then(() => {
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    })
    .catch((error) => {
        tasks.setResult(tasks.TaskResult.Failed, error);
    })