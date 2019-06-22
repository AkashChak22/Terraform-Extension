import {TerraformToolHandler, ITerraformToolHandler, TerraformInterfaces} from './terraform';
import {ToolRunner, IExecOptions} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformCommand} from './terraform';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import tasks = require('azure-pipelines-task-lib/task');
import { injectable, inject } from 'inversify';

export interface ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;

    init(): Promise<number>;
    handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner);
    plan(): Promise<number>;
    apply(): Promise<number>;
    destroy(): Promise<number>;
    handleProvider(command: TerraformPlan | TerraformApply | TerraformDestroy, terraformToolRunner: ToolRunner);
    validate(): Promise<number>;
}

@injectable()
export abstract class BaseTerraformCommandHandler implements ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;
    
    public async abstract init(): Promise<number>;
    abstract handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner);

    constructor(
        @inject(TerraformInterfaces.ITerraformToolHandler) terraformToolHandler: ITerraformToolHandler
    ) {
        this.providerName = "";
        this.terraformToolHandler = terraformToolHandler;
        this.backendConfig = new Map<string, string>();
    }

    protected getServiceProviderNameFromProviderInput(): string {
        let provider: string = tasks.getInput("provider", true);
        
        switch (provider) {
            case "azurerm": return "AzureRM";
            case "aws": return "AWS";
            case "gcp": return "GCP";
        }
    }

    public async plan(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let planCommand = new TerraformPlan(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            tasks.getInput("commandOptions")
        );

        let terraformTool = this.terraformToolHandler.create(planCommand);
        this.handleProvider(planCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: planCommand.workingDirectory
        });
    }

    public async apply(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let applyCommand = new TerraformApply(
            "apply",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let terraformTool = this.terraformToolHandler.create(applyCommand);
        this.handleProvider(applyCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: applyCommand.workingDirectory
        });
    };

    public async destroy(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let destroyCommand = new TerraformApply(
            "destroy",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let terraformTool = this.terraformToolHandler.create(destroyCommand);
        this.handleProvider(destroyCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: destroyCommand.workingDirectory
        });
    };

    abstract handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner);

    public async validate(): Promise<number> {
        let validateCommand = new TerraformCommand(
            "validate",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );

        let terraformTool = this.terraformToolHandler.create(validateCommand);
        return terraformTool.exec(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}

export const CommandHandlerInterfaces = {
    ITerraformCommandHandler: Symbol("ITerraformCommandHandler")
}