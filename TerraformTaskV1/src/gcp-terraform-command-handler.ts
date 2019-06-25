import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformInit, TerraformApply, TerraformPlan, TerraformDestroy} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';
import * as path from 'path';

export class TerraformCommandHandlerGCP extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "gcp";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendGCPBucketName", true));
        this.backendConfig.set('prefix', tasks.getInput("backendGCPPrefix", true));

        // Get credentials for json file
        const jsonKeyFilePath = path.resolve('credentials.json');
        let clientEmail = tasks.getEndpointAuthorizationParameter(backendServiceName, "Issuer", false);
        let tokenUri = tasks.getEndpointAuthorizationParameter(backendServiceName, "Audience", false);
        let privateKey = tasks.getEndpointAuthorizationParameter(backendServiceName, "PrivateKey", false);

        // Create json string and write it to the file
        let jsonCredsString = `{"type": "service_account", "private_key": "${privateKey}", "client_email": "${clientEmail}", "token_uri": "${tokenUri}"}`
        tasks.writeFile(jsonKeyFilePath, jsonCredsString);

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
            // Get credentials for json file
            const jsonKeyFilePath = path.resolve('credentials.json');
            let clientEmail = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "Issuer", false);
            let tokenUri = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "Audience", false);
            let privateKey = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "PrivateKey", false);

            // Create json string and write it to the file
            let jsonCredsString = `{"type": "service_account", "private_key": "${privateKey}", "client_email": "${clientEmail}", "token_uri": "${tokenUri}"}`
            tasks.writeFile(jsonKeyFilePath, jsonCredsString);

            process.env['GOOGLE_CREDENTIALS']  = `${jsonKeyFilePath}`;
            process.env['GOOGLE_PROJECT']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "project", false);            
        }
    }
}