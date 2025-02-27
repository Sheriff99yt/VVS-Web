export interface Theme {
    node: {
        background: string;
        border: string;
        selectedBorder: string;
        title: string;
        type: string;
        text: string;
        portHover: string;
    };
    port: {
        exec: string;
        data: string;
        border: string;
    };
    validation: {
        valid: string;
        invalid: string;
    };
    execution: {
        activePath: string;
        inactivePath: string;
        activeOpacity: number;
        inactiveOpacity: number;
    };
    flow: {
        condition: {
            true: string;
            false: string;
            unknown: string;
        };
        loop: {
            active: string;
            inactive: string;
            iteration: string;
        };
        switch: {
            active: string;
            inactive: string;
            case: string;
        };
    };
}

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
} 