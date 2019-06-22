import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner'
import { injectable } from 'inversify';

export class TerraformCommand {
    public readonly name: string;
    public readonly additionalArgs: string | undefined;
    public readonly workingDirectory: string;

    constructor(
        name: string,
        workingDirectory: string,
        additionalArgs?: string
    ) {
        this.name = name;
        this.workingDirectory = workingDirectory;  
        this.additionalArgs = additionalArgs;
    } 
}

export interface ITerraformToolHandler {
    create(command?: TerraformCommand): ToolRunner;
}

@injectable()
export class TerraformToolHandler implements ITerraformToolHandler {
    private readonly tasks: any;
    
    constructor(tasks: any) {
        this.tasks = tasks;
    }

    public create(command?: TerraformCommand): ToolRunner {
        let terraformPath = this.tasks.which("terraform", true);

        let terraformToolRunner: ToolRunner = this.tasks.tool(terraformPath);
        if (command) {
            terraformToolRunner.arg(command.name);
            if (command.additionalArgs) {
                terraformToolRunner.line(command.additionalArgs);
            }
        }

        return terraformToolRunner;
    }
}

export const TerraformInterfaces = {
    ITerraformToolHandler: Symbol("ITerraformToolHandler")
}
