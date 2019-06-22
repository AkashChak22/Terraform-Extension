import tasks = require('azure-pipelines-task-lib/task');
import {TerraformToolHandler, ITerraformToolHandler, TerraformInterfaces} from './terraform';
import {IExecOptions, ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformCommand} from './terraform';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import {BaseTerraformCommandHandler} from './terraform-command-handler';
import { injectable, inject } from 'inversify';

// export class TerraformCommandHandlerAzureRM implements ITerraformCommandHandler {
//     providerName: string;
//     terraformToolHandler: ITerraformToolHandler;
//     backendConfig: Map<string, string>;

//     constructor() {
//         this.providerName = "azurerm";
//         this.terraformToolHandler = new TerraformToolHandler(tasks);
//         this.backendConfig = new Map<string, string>();
//     }

//     private setupBackend(backendServiceName: string) {
//         this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
//         this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
//         this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
//         this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));
//         this.backendConfig.set('arm_subscription_id', tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true));
//         this.backendConfig.set('arm_tenant_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "tenantid", true));
//         this.backendConfig.set('arm_client_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalid", true));
//         this.backendConfig.set('arm_client_secret', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalkey", true));
//     }

//     public async init(): Promise<number> {
//         tasks.debug("Init starting");
//         let initCommand = new TerraformInit(
//             "init",
//             tasks.getInput("workingDirectory"),
//             tasks.getInput("backendTypeAzureRM"),
//             tasks.getInput("commandOptions")
//         );
//         tasks.debug("Init finished");

//         let terraformToolAzureRM = this.terraformToolHandler.create(initCommand);
//         this.handleBackend(initCommand, terraformToolAzureRM);
        
//         return terraformToolAzureRM.exec(<IExecOptions> {
//             cwd: initCommand.workingDirectory
//         });
//     }

//     public handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner): void {
//         if (command.backendType && command.backendType == "azurerm") {
//             let backendServiceName = tasks.getInput("backendServiceArm", true);
//             this.setupBackend(backendServiceName);

//             for (let [key, value] of this.backendConfig.entries()) {
//                 terraformToolRunner.arg(`-backend-config=${key}=${value}`);
//             }
//         }
//     }

//     public async plan(): Promise<number> {
//         let planCommand = new TerraformPlan(
//             "plan",
//             tasks.getInput("workingDirectory"),
//             tasks.getInput("environmentServiceNameAzureRM", true),
//             tasks.getInput("commandOptions")
//         );

//         let terraformToolAzureRM = this.terraformToolHandler.create(planCommand);
//         this.handleProvider(planCommand, terraformToolAzureRM);
//         return terraformToolAzureRM.exec(<IExecOptions> {
//             cwd: planCommand.workingDirectory
//         });
//     }

//     public async apply(): Promise<number> {
//         let autoApprove: string = '-auto-approve';
//         let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

//         if (additionalArgs.includes(autoApprove) === false) {
//             additionalArgs = `${autoApprove} ${additionalArgs}`;
//         }

//         let applyCommand = new TerraformApply(
//             "apply",
//             tasks.getInput("workingDirectory"),
//             tasks.getInput("environmentServiceNameAzureRM", true),
//             additionalArgs
//         );

//         let terraformToolAzureRM = this.terraformToolHandler.create(applyCommand);
//         this.handleProvider(applyCommand, terraformToolAzureRM);
//         return terraformToolAzureRM.exec(<IExecOptions> {
//             cwd: applyCommand.workingDirectory
//         });
//     };

//     public async destroy(): Promise<number> {
//         let autoApprove: string = '-auto-approve';
//         let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

//         if (additionalArgs.includes(autoApprove) === false) {
//             additionalArgs = `${autoApprove} ${additionalArgs}`;
//         }

//         let destroyCommand = new TerraformApply(
//             "destroy",
//             tasks.getInput("workingDirectory"),
//             tasks.getInput("environmentServiceNameAzureRM", true),
//             additionalArgs
//         );

//         let terraformToolAzureRM = this.terraformToolHandler.create(destroyCommand);
//         this.handleProvider(destroyCommand, terraformToolAzureRM);
//         return terraformToolAzureRM.exec(<IExecOptions> {
//             cwd: destroyCommand.workingDirectory
//         });
//     };

//     handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner) {
//         if (command.serviceProvidername) {
//             process.env['ARM_SUBSCRIPTION_ID']  = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", false);
//             process.env['ARM_TENANT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "tenantid", false);
//             process.env['ARM_CLIENT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalid", false);
//             process.env['ARM_CLIENT_SECRET']    = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalkey", false);
//         }
//     }

//     public async validate(): Promise<number> {
//         let validateCommand = new TerraformCommand(
//             "validate",
//             tasks.getInput("workingDirectory"),
//             tasks.getInput("commandOptions")
//         );

//         let terraformToolAzureRM = this.terraformToolHandler.create(validateCommand);
//         return terraformToolAzureRM.exec(<IExecOptions>{
//             cwd: validateCommand.workingDirectory
//         });
//     }
// }

@injectable()
export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor(
        @inject(TerraformInterfaces.ITerraformToolHandler) terraformToolHandler: ITerraformToolHandler
    ) {
        super(terraformToolHandler);
        this.providerName = "azurerm";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));
        this.backendConfig.set('arm_subscription_id', tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true));
        this.backendConfig.set('arm_tenant_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "tenantid", true));
        this.backendConfig.set('arm_client_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalid", true));
        this.backendConfig.set('arm_client_secret', tasks.getEndpointAuthorizationParameter(backendServiceName, "serviceprincipalkey", true));
    }

    public async init(): Promise<number> {
        tasks.debug("Init starting");
        let initCommand = new TerraformInit(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("backendTypeAzureRM"),
            tasks.getInput("commandOptions")
        );
        tasks.debug("Init finished");

        let terraformToolAzureRM = this.terraformToolHandler.create(initCommand);
        this.handleBackend(initCommand, terraformToolAzureRM);
        
        return terraformToolAzureRM.exec(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }

    public handleBackend(command: TerraformInit, terraformToolRunner: ToolRunner): void {
        if (command.backendType && command.backendType === "azurerm") {
            let backendServiceName = tasks.getInput("backendServiceArm", true);
            this.setupBackend(backendServiceName);

            for (let [key, value] of this.backendConfig.entries()) {
                terraformToolRunner.arg(`-backend-config=${key}=${value}`);
            }
        }
    }

    handleProvider(command: TerraformApply | TerraformPlan | TerraformDestroy, terraformToolRunner: ToolRunner) {
        if (command.serviceProvidername) {
            process.env['ARM_SUBSCRIPTION_ID']  = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", false);
            process.env['ARM_TENANT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "tenantid", false);
            process.env['ARM_CLIENT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalid", false);
            process.env['ARM_CLIENT_SECRET']    = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalkey", false);
        }
    }
}