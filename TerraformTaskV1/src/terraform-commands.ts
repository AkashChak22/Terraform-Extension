import {TerraformCommand} from './terraform';

export class TerraformInit extends TerraformCommand {
    // readonly backendType: BackendTypes | undefined;
    readonly backendType: string | undefined;

    constructor(
        name: string,
        workingDirectory: string,
        backendType: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        if (backendType) {
            // this.backendType = BackendTypes[<keyof typeof BackendTypes> backendType];
            this.backendType = backendType;
        }
    }
}

export class TerraformPlan extends TerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}

export class TerraformApply extends TerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}

export class TerraformDestroy extends TerraformCommand {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}
