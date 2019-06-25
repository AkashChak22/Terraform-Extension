import {TerraformToolHandler, ITerraformToolHandler} from './terraform';
import {ToolRunner, IExecOptions, IExecSyncOptions} from 'azure-pipelines-task-lib/toolrunner';
import {BaseTerraformCommand} from './terraform-commands';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import tasks = require('azure-pipelines-task-lib/task');

export interface ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;

    init(): Promise<number>;
    plan(): Promise<number>;
    apply(): Promise<number>;
    destroy(): Promise<number>;
    validate(): Promise<number>;
}

export abstract class BaseTerraformCommandHandler implements ITerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;

    constructor() {
        this.providerName = "";
        this.terraformToolHandler = new TerraformToolHandler(tasks);
        this.backendConfig = new Map<string, string>();
    }

    protected warnIfMultipleProviders(): void {
        let terraformPath = tasks.which("terraform", true);

        let terraformToolRunner: ToolRunner = tasks.tool(terraformPath);
        terraformToolRunner.arg("providers");
        let commandOutput = terraformToolRunner.execSync(<IExecSyncOptions>{
            cwd: tasks.getInput("workingDirectory")
        });

        let countProviders = (commandOutput.stdout.match(/provider/g) || []).length;
        tasks.debug(countProviders.toString());
        if (countProviders > 1) {
            tasks.warning("Multiple provider blocks specified in the .tf files in the current working drectory.");
        }
    }
    
    protected getServiceProviderNameFromProviderInput(): string {
        let provider: string = tasks.getInput("provider", true);
        
        switch (provider) {
            case "azurerm": return "AzureRM";
            case "aws"    : return "AWS";
            case "gcp"    : return "GCP";
        }
    }

    abstract handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner);

    public async init(): Promise<number> {
        let backendName = `backendType${this.getServiceProviderNameFromProviderInput()}`;

        let initCommand = new TerraformInit(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput(backendName),
            tasks.getInput("commandOptions")
        );

        let terraformTool = this.terraformToolHandler.createToolRunner(initCommand);
        this.handleBackend(initCommand, terraformTool);
        
        return terraformTool.exec(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }

    public async plan(): Promise<number> {
        this.warnIfMultipleProviders();
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let planCommand = new TerraformPlan(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            tasks.getInput("commandOptions")
        );

        let terraformTool = this.terraformToolHandler.createToolRunner(planCommand);
        this.handleProvider(planCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: planCommand.workingDirectory
        });
    }

    public async apply(): Promise<number> {
        this.warnIfMultipleProviders();
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

        let terraformTool = this.terraformToolHandler.createToolRunner(applyCommand);
        this.handleProvider(applyCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: applyCommand.workingDirectory
        });
    };

    public async destroy(): Promise<number> {
        this.warnIfMultipleProviders();
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

        let terraformTool = this.terraformToolHandler.createToolRunner(destroyCommand);
        this.handleProvider(destroyCommand, terraformTool);
        return terraformTool.exec(<IExecOptions> {
            cwd: destroyCommand.workingDirectory
        });
    };

    abstract handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner);

    public async validate(): Promise<number> {
        let validateCommand = new BaseTerraformCommand(
            "validate",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );

        let terraformTool = this.terraformToolHandler.createToolRunner(validateCommand);
        return terraformTool.exec(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}