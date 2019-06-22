import tasks = require('azure-pipelines-task-lib/task');
import {TerraformToolHandler, ITerraformToolHandler, TerraformInterfaces} from './terraform';
import {IExecOptions, ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformCommand} from './terraform';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import {BaseTerraformCommandHandler} from './terraform-command-handler';
import * as path from 'path';
import { injectable, inject } from 'inversify';

@injectable()
export class TerraformCommandHandlerGCP extends BaseTerraformCommandHandler {
    constructor(
        @inject(TerraformInterfaces.ITerraformToolHandler) terraformToolHandler: ITerraformToolHandler
    ) {
        super(terraformToolHandler);
        this.providerName = "gcp";
    }

    public async init(): Promise<number> {
        let initCommand = new TerraformInit(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("backendTypeGCP"),
            tasks.getInput("commandOptions")
        );

        let terraformToolGCP = this.terraformToolHandler.create(initCommand);
        this.handleBackend(initCommand, terraformToolGCP);
        
        return terraformToolGCP.exec(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendGCPBucketName", true));
        this.backendConfig.set('prefix', tasks.getInput("backendGCPPrefix", true));

        let jsonKeyFileContents = tasks.getEndpointAuthorizationParameter(backendServiceName, "certificate", false);
        const jsonKeyFilePath = path.resolve('credentials.json');

        tasks.writeFile(jsonKeyFilePath, jsonKeyFileContents);

        this.backendConfig.set('credentials', jsonKeyFilePath);
    }

    public handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner): void {
        if (command.backendType && command.backendType === "gcp") {
            let backendServiceName = tasks.getInput("backendServiceGCP", true);
            this.setupBackend(backendServiceName);

            for (let [key, value] of this.backendConfig.entries()) {
                terraformToolRunner.arg(`-backend-config=${key}=${value}`);
            }
        }
    }

    handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner) {
        if (command.serviceProvidername) {
            let jsonKeyFileContents = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "certificate", false);
            tasks.debug(jsonKeyFileContents);

            const jsonKeyFilePath = path.resolve('credentials.json');
            tasks.debug(`JSON file path: ${jsonKeyFilePath}`);
            tasks.writeFile(jsonKeyFilePath, jsonKeyFileContents);

            process.env['GOOGLE_CREDENTIALS']  = `${jsonKeyFilePath}`;
            process.env['GOOGLE_PROJECT']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "project", false);            
        }
    }
}