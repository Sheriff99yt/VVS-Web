import { IPort, IPortFactory, DataType } from './NodeSystem';

/**
 * Factory for creating standardized ports
 */
export class PortFactory implements IPortFactory {
    /**
     * Creates an execution input port
     * @param label Optional label for the port
     */
    static createExecInput(label: string = 'Execute'): IPort {
        return {
            id: 'exec_in',
            label,
            dataType: 'any',
            isExec: true,
            isInput: true,
            validation: {
                required: true
            }
        };
    }

    /**
     * Creates an execution output port
     * @param label Optional label for the port
     */
    static createExecOutput(label: string = 'Next'): IPort {
        return {
            id: 'exec_out',
            label,
            dataType: 'any',
            isExec: true,
            isInput: false,
            validation: {
                required: true
            }
        };
    }

    /**
     * Creates a data input port
     * @param id Port identifier
     * @param label Display label
     * @param dataType Type of data
     * @param required Whether the port is required
     * @param allowedTypes Optional array of allowed types
     */
    static createDataInput(
        id: string,
        label: string,
        dataType: DataType,
        required: boolean = false,
        allowedTypes?: DataType[]
    ): IPort {
        return {
            id,
            label,
            dataType,
            isInput: true,
            validation: {
                required,
                allowedTypes: allowedTypes || [dataType]
            }
        };
    }

    /**
     * Creates a data output port
     * @param id Port identifier
     * @param label Display label
     * @param dataType Type of data
     */
    static createDataOutput(
        id: string,
        label: string,
        dataType: DataType
    ): IPort {
        return {
            id,
            label,
            dataType,
            isInput: false
        };
    }

    // Legacy instance methods for backward compatibility
    createExecPort(id: string, label: string, isInput: boolean): IPort {
        return isInput ? 
            PortFactory.createExecInput(label) :
            PortFactory.createExecOutput(label);
    }

    createDataPort(
        id: string,
        label: string,
        dataType: DataType,
        isInput: boolean,
        validation?: IPort['validation']
    ): IPort {
        return isInput ?
            PortFactory.createDataInput(id, label, dataType, validation?.required, validation?.allowedTypes) :
            PortFactory.createDataOutput(id, label, dataType);
    }

    createOptionalDataPort(
        id: string,
        label: string,
        dataType: DataType,
        isInput: boolean,
        validation?: IPort['validation']
    ): IPort {
        const port = this.createDataPort(id, label, dataType, isInput, { ...validation, required: false });
        port.isOptional = true;
        return port;
    }

    createMultiTypePort(
        id: string,
        label: string,
        allowedTypes: DataType[],
        isInput: boolean,
        validation?: Omit<IPort['validation'], 'allowedTypes'>
    ): IPort {
        return this.createDataPort(id, label, allowedTypes[0], isInput, {
            ...validation,
            allowedTypes
        });
    }
} 