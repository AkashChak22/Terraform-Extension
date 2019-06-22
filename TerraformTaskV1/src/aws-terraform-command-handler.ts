import tasks = require('azure-pipelines-task-lib/task');
import {TerraformToolHandler, ITerraformToolHandler, TerraformInterfaces} from './terraform';
import {IExecOptions, ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformCommand} from './terraform';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import {BaseTerraformCommandHandler} from './terraform-command-handler';
import { injectable, inject } from 'inversify';

@injectable()
export class TerraformCommandHandlerAWS extends BaseTerraformCommandHandler {
    constructor(
        @inject(TerraformInterfaces.ITerraformToolHandler) terraformToolHandler: ITerraformToolHandler
    ) {
        super(terraformToolHandler);
        this.providerName = "aws";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendAWSBucketName", true));
        this.backendConfig.set('key', tasks.getInput("backendAWSKey", true));
        this.backendConfig.set('region', tasks.getInput("backendAWSRegion", true));
        this.backendConfig.set('access_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "username", true));
        this.backendConfig.set('secret_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "password", true));
    }

    public async init(): Promise<number> {
        let initCommand = new TerraformInit(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("backendTypeAWS"),
            tasks.getInput("commandOptions")
        );

        let terraformToolAWS = this.terraformToolHandler.create(initCommand);
        this.handleBackend(initCommand, terraformToolAWS);
        
        return terraformToolAWS.exec(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }

    public handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner): void {
        if (command.backendType && command.backendType === "aws") {
            let backendServiceName = tasks.getInput("backendServiceAWS", true);
            this.setupBackend(backendServiceName);

            for (let [key, value] of this.backendConfig.entries()) {
                terraformToolRunner.arg(`-backend-config=${key}=${value}`);
            }
        }
    }

    handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner) {
        if (command.serviceProvidername) {
            process.env['AWS_ACCESS_KEY_ID']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "username", false);
            process.env['AWS_SECRET_ACCESS_KEY']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "password", false);            
        }
    }
}