import {TerraformCommandHandlerAzureRM} from './azure-terraform-command-handler';
import { BaseTerraformCommandHandler, ITerraformCommandHandler, CommandHandlerInterfaces } from './terraform-command-handler';
import { TerraformCommandHandlerAWS } from './aws-terraform-command-handler';
import { TerraformCommandHandlerGCP } from './gcp-terraform-command-handler';
import { injectable, Container, inject } from 'inversify';

export interface IParentCommandHandler {
    execute(providerName: string, command: string): Promise<number>;
}

@injectable()
export class ParentCommandHandler implements IParentCommandHandler {
    private readonly container: Container;

    constructor(
        @inject("container") container: Container
    ) {
        this.container = container;
    }

    public async execute(providerName: string, command: string): Promise<number> {
        // Make provider class according to provider name
        let provider: ITerraformCommandHandler;
        // if (providerName === "azurerm") {
        //     provider = new TerraformCommandHandlerAzureRM();
        // } else if (providerName === "aws") {
        //     provider = new TerraformCommandHandlerAWS();
        // } else if (providerName === "gcp") {
        //     provider = new TerraformCommandHandlerGCP();
        // }
        provider = this.container.getNamed<ITerraformCommandHandler>(CommandHandlerInterfaces.ITerraformCommandHandler, providerName);

        return await provider[command]();
    }
}

export const ParentCommandHandlerInterfaces = {
    IParentCommandHandler: Symbol("IParentCommandHandler")
}